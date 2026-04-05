import './ImportManager.css';

export default function ImportManager({
  transactions,
  onConfirmImport,
  onCancel,
  importing,
}) {
  const selected = transactions.filter((t) => t.selected);
  const skipped = transactions.filter((t) => !t.selected);
  const duplicates = transactions.filter(
    (t) => t.status === 'duplicate' || t.status === 'near-duplicate' || t.status === 'intra-duplicate'
  );

  return (
    <div className="import-manager">
      <h3 className="import-title">📥 Import Summary</h3>

      <div className="import-stats">
        <div className="stat-card stat-total">
          <div className="stat-num">{transactions.length}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
        <div className="stat-card stat-import">
          <div className="stat-num">{selected.length}</div>
          <div className="stat-label">Selected for Import</div>
        </div>
        <div className="stat-card stat-skip">
          <div className="stat-num">{skipped.length}</div>
          <div className="stat-label">Skipped</div>
        </div>
        <div className="stat-card stat-duplicate">
          <div className="stat-num">{duplicates.length}</div>
          <div className="stat-label">Duplicates Detected</div>
        </div>
      </div>

      {selected.length === 0 && (
        <div className="import-warning">
          ⚠️ No transactions selected. Please select at least one transaction to import.
        </div>
      )}

      <div className="import-actions">
        <button
          className="btn-import"
          onClick={() => onConfirmImport(selected)}
          disabled={selected.length === 0 || importing}
        >
          {importing ? '⏳ Importing...' : `✅ Import ${selected.length} Transaction${selected.length !== 1 ? 's' : ''}`}
        </button>
        <button className="btn-cancel" onClick={onCancel} disabled={importing}>
          Cancel
        </button>
      </div>
    </div>
  );
}
