/**
 * Duplicate Transaction Detector
 *
 * Detects duplicate transactions using multiple strategies:
 * 1. Exact FITID match (same financial institution transaction ID)
 * 2. Same date + amount + name (exact match)
 * 3. Same amount + date within tolerance (fuzzy near-duplicate)
 */

/**
 * Normalize a string for comparison (lowercase, trim, collapse whitespace).
 */
function normalizeStr(str) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Get the difference in days between two dates.
 */
function daysDiff(d1, d2) {
  if (!d1 || !d2) return Infinity;
  return Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Build a lookup key for exact duplicate detection.
 */
function buildExactKey(txn) {
  return `${txn.dateStr}|${txn.amount.toFixed(2)}|${normalizeStr(txn.name)}`;
}

/**
 * Detect duplicates within a single list of transactions (intra-file).
 * Returns a Map from transaction index to an array of duplicate indices.
 */
export function detectIntraFileDuplicates(transactions) {
  const fitidMap = new Map(); // fitid -> first seen index
  const exactKeyMap = new Map(); // exactKey -> first seen index
  // duplicateOf[i] = index of the original transaction that i duplicates
  const duplicateOf = new Array(transactions.length).fill(null);

  transactions.forEach((txn, i) => {
    // Check FITID match (most reliable)
    if (txn.fitid && !txn.fitid.startsWith('generated-')) {
      if (fitidMap.has(txn.fitid)) {
        duplicateOf[i] = fitidMap.get(txn.fitid);
        return;
      }
      fitidMap.set(txn.fitid, i);
    }

    // Check exact date+amount+name match
    const key = buildExactKey(txn);
    if (exactKeyMap.has(key)) {
      duplicateOf[i] = exactKeyMap.get(key);
      return;
    }
    exactKeyMap.set(key, i);
  });

  return duplicateOf;
}

/**
 * Detect duplicates between two lists of transactions (inter-file / cross-import).
 *
 * @param {Array} newTransactions - Transactions from the newly uploaded file
 * @param {Array} existingTransactions - Already-imported transactions
 * @param {Object} options
 * @param {number} options.fuzzyDaysTolerance - Days within which same amount+name is a near-duplicate (default 3)
 * @returns {Array} - For each newTransaction, an object { isDuplicate, isNearDuplicate, matchedIndex }
 */
export function detectDuplicatesAgainstExisting(
  newTransactions,
  existingTransactions,
  options = {}
) {
  const { fuzzyDaysTolerance = 3 } = options;

  // Build lookup structures for existing transactions
  const existingFitids = new Map();
  const existingExactKeys = new Map();

  existingTransactions.forEach((txn, i) => {
    if (txn.fitid && !txn.fitid.startsWith('generated-')) {
      existingFitids.set(txn.fitid, i);
    }
    existingExactKeys.set(buildExactKey(txn), i);
  });

  return newTransactions.map((txn) => {
    // 1. Exact FITID match
    if (txn.fitid && !txn.fitid.startsWith('generated-')) {
      if (existingFitids.has(txn.fitid)) {
        return {
          isDuplicate: true,
          isNearDuplicate: false,
          matchedIndex: existingFitids.get(txn.fitid),
          reason: 'Exact FITID match',
        };
      }
    }

    // 2. Exact date + amount + name match
    const key = buildExactKey(txn);
    if (existingExactKeys.has(key)) {
      return {
        isDuplicate: true,
        isNearDuplicate: false,
        matchedIndex: existingExactKeys.get(key),
        reason: 'Exact date/amount/name match',
      };
    }

    // 3. Fuzzy: same amount + name within fuzzyDaysTolerance days
    for (let i = 0; i < existingTransactions.length; i++) {
      const existing = existingTransactions[i];
      if (
        txn.amount === existing.amount &&
        normalizeStr(txn.name) === normalizeStr(existing.name) &&
        daysDiff(txn.date, existing.date) <= fuzzyDaysTolerance
      ) {
        return {
          isDuplicate: false,
          isNearDuplicate: true,
          matchedIndex: i,
          reason: `Near-duplicate: same amount/name within ${fuzzyDaysTolerance} days`,
        };
      }
    }

    return { isDuplicate: false, isNearDuplicate: false, matchedIndex: null, reason: null };
  });
}

/**
 * Categorize transactions from a new file, given a list of already-imported transactions.
 * Returns enriched transactions with duplicate status.
 */
export function categorizeTransactions(newTransactions, existingTransactions = []) {
  // First: detect intra-file duplicates
  const intraFileDupes = detectIntraFileDuplicates(newTransactions);

  // Then: detect against existing
  const interFileDupes = detectDuplicatesAgainstExisting(newTransactions, existingTransactions);

  return newTransactions.map((txn, i) => {
    const intraIdx = intraFileDupes[i];
    const interStatus = interFileDupes[i];

    let status = 'new'; // 'new' | 'duplicate' | 'near-duplicate' | 'intra-duplicate'
    let duplicateReason = null;
    let duplicateOfIndex = null;

    if (interStatus.isDuplicate) {
      status = 'duplicate';
      duplicateReason = interStatus.reason;
      duplicateOfIndex = interStatus.matchedIndex;
    } else if (intraIdx !== null) {
      status = 'intra-duplicate';
      duplicateReason = 'Duplicate within this file';
      duplicateOfIndex = intraIdx;
    } else if (interStatus.isNearDuplicate) {
      status = 'near-duplicate';
      duplicateReason = interStatus.reason;
      duplicateOfIndex = interStatus.matchedIndex;
    }

    return {
      ...txn,
      status,
      duplicateReason,
      duplicateOfIndex,
      selected: status === 'new', // Pre-select new transactions for import
    };
  });
}
