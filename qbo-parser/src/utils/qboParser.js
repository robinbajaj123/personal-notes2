/**
 * QBO/OFX File Parser
 *
 * QBO files use the OFX (Open Financial Exchange) SGML format.
 * This parser handles both SGML-style OFX (v1.x) and XML-style OFX (v2.x).
 */

/**
 * Parse an OFX date string into a JavaScript Date object.
 * OFX dates look like: 20200115120000[0:GMT] or 20200115120000 or 20200115
 */
function parseOFXDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.trim().replace(/\[.*\]/, '');
  const year = parseInt(clean.substring(0, 4), 10);
  const month = parseInt(clean.substring(4, 6), 10) - 1;
  const day = parseInt(clean.substring(6, 8), 10);
  const hour = clean.length >= 10 ? parseInt(clean.substring(8, 10), 10) : 0;
  const min = clean.length >= 12 ? parseInt(clean.substring(10, 12), 10) : 0;
  const sec = clean.length >= 14 ? parseInt(clean.substring(12, 14), 10) : 0;
  const d = new Date(Date.UTC(year, month, day, hour, min, sec));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a Date to YYYY-MM-DD for display.
 */
export function formatDate(date) {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Strip the OFX header block (everything before the first <OFX> tag).
 * Returns just the body content starting from <OFX>.
 */
function stripOFXHeader(content) {
  const idx = content.indexOf('<OFX>');
  if (idx === -1) {
    // Try case-insensitive
    const lower = content.toLowerCase();
    const lIdx = lower.indexOf('<ofx>');
    if (lIdx === -1) return content;
    return content.substring(lIdx);
  }
  return content.substring(idx);
}

/**
 * Convert SGML-style OFX to a simple key-value extraction approach.
 * We use regex to extract tag values rather than full SGML parsing.
 */
function extractTagValue(content, tag) {
  // Match <TAG>value with optional closing tag
  const re = new RegExp(`<${tag}>([^<]*)`, 'i');
  const match = re.exec(content);
  return match ? match[1].trim() : '';
}

/**
 * Extract all occurrences of a repeating block (e.g. <STMTTRN>...</STMTTRN>).
 */
function extractBlocks(content, tag) {
  const blocks = [];
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  const upperContent = content.toUpperCase();
  const upperOpen = openTag.toUpperCase();
  const upperClose = closeTag.toUpperCase();

  let searchFrom = 0;
  while (true) {
    const start = upperContent.indexOf(upperOpen, searchFrom);
    if (start === -1) break;
    const end = upperContent.indexOf(upperClose, start + upperOpen.length);
    if (end === -1) break;
    blocks.push(content.substring(start + openTag.length, end));
    searchFrom = end + upperClose.length;
  }
  return blocks;
}

/**
 * Parse a single <STMTTRN> block into a transaction object.
 */
function parseTransaction(block) {
  const fitid = extractTagValue(block, 'FITID');
  const trntype = extractTagValue(block, 'TRNTYPE');
  const dtposted = extractTagValue(block, 'DTPOSTED');
  const trnamt = extractTagValue(block, 'TRNAMT');
  const name = extractTagValue(block, 'NAME');
  const memo = extractTagValue(block, 'MEMO');
  const checknum = extractTagValue(block, 'CHECKNUM');
  const refnum = extractTagValue(block, 'REFNUM');

  const amount = parseFloat(trnamt) || 0;
  const date = parseOFXDate(dtposted);

  return {
    fitid: fitid || `generated-${crypto.randomUUID()}`,
    type: trntype,
    date,
    dateStr: formatDate(date),
    amount,
    name: name || memo || '',
    memo: memo || '',
    checknum,
    refnum,
    raw: block.trim(),
  };
}

/**
 * Parse account info from a statement block.
 */
function parseAccountInfo(content) {
  const bankId = extractTagValue(content, 'BANKID');
  const acctId = extractTagValue(content, 'ACCTID');
  const acctType = extractTagValue(content, 'ACCTTYPE');
  const curdef = extractTagValue(content, 'CURDEF');
  const dtStart = extractTagValue(content, 'DTSTART');
  const dtEnd = extractTagValue(content, 'DTEND');

  return {
    bankId,
    acctId,
    acctType,
    currency: curdef,
    dateStart: formatDate(parseOFXDate(dtStart)),
    dateEnd: formatDate(parseOFXDate(dtEnd)),
  };
}

/**
 * Parse ledger balance from content.
 */
function parseLedgerBalance(content) {
  const balBlocks = extractBlocks(content, 'LEDGERBAL');
  if (balBlocks.length > 0) {
    const balamt = extractTagValue(balBlocks[0], 'BALAMT');
    const dtasof = extractTagValue(balBlocks[0], 'DTASOF');
    return {
      amount: parseFloat(balamt) || 0,
      asOf: formatDate(parseOFXDate(dtasof)),
    };
  }
  return null;
}

/**
 * Main entry point: parse a QBO file content string.
 * Returns an object with transactions, account info, and balance.
 */
export function parseQBO(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Invalid QBO content: expected a non-empty string');
  }

  const body = stripOFXHeader(content);

  // Extract STMTRS (statement response) blocks - handles bank statements
  const stmtrsBlocks = extractBlocks(body, 'STMTRS');
  // Also check for CCSTMTRS (credit card statement)
  const ccStmtrsBlocks = extractBlocks(body, 'CCSTMTRS');
  const allStmtBlocks = [...stmtrsBlocks, ...ccStmtrsBlocks];

  if (allStmtBlocks.length === 0) {
    // Fallback: try to find STMTTRNRS and extract transactions directly
    const stmttrnrs = extractBlocks(body, 'STMTTRNRS');
    if (stmttrnrs.length > 0) {
      const transactions = [];
      for (const block of stmttrnrs) {
        const tranBlocks = extractBlocks(block, 'STMTTRN');
        transactions.push(...tranBlocks.map(parseTransaction));
      }
      return {
        account: parseAccountInfo(body),
        ledgerBalance: parseLedgerBalance(body),
        transactions,
      };
    }
    throw new Error(
      'No statement data found in QBO file. Please ensure this is a valid QBO/OFX file.'
    );
  }

  const transactions = [];
  let account = null;
  let ledgerBalance = null;

  for (const stmtrs of allStmtBlocks) {
    if (!account) {
      account = parseAccountInfo(stmtrs);
    }
    if (!ledgerBalance) {
      ledgerBalance = parseLedgerBalance(stmtrs);
    }
    const tranBlocks = extractBlocks(stmtrs, 'STMTTRN');
    transactions.push(...tranBlocks.map(parseTransaction));
  }

  return {
    account: account || parseAccountInfo(body),
    ledgerBalance,
    transactions,
  };
}
