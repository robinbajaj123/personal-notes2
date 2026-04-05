import './TransactionTable.css';

const STATUS_LABELS = {
  new: { label: 'New', className: 'status-new' },
  duplicate: { label: 'Duplicate', className: 'status-duplicate' },
  'near-duplicate': { label: 'Near Duplicate', className: 'status-near-duplicate' },
  'intra-duplicate': { label: 'In-file Duplicate', className: 'status-intra-duplicate' },
};

export default function TransactionTable({
  transactions,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  showCheckboxes = true,
}) {
  if (!transactions || transactions.length === 0) {
    return <p className="no-transactions">No transactions to display.</p>;
  }

  const newCount = transactions.filter((t) => t.status === 'new').length;
  const selectedCount = transactions.filter((t) => t.selected).length;

  return (
    <div className="transaction-table-wrapper">
      {showCheckboxes && (
        <div className="table-controls">
          <span className="table-summary">
            {transactions.length} transactions &nbsp;|&nbsp;
            <span className="badge new">{newCount} new</span>&nbsp;
            <span className="badge duplicate">
              {transactions.filter((t) => t.status === 'duplicate').length} duplicates
            </span>&nbsp;
            <span className="badge near-duplicate">
              {transactions.filter((t) => t.status === 'near-duplicate').length} near-duplicates
            </span>&nbsp;
            <span className="badge intra-duplicate">
              {transactions.filter((t) => t.status === 'intra-duplicate').length} in-file duplicates
            </span>
          </span>
          <div className="select-buttons">
            <button className="btn-sm" onClick={onSelectAll}>Select New</button>
            <button className="btn-sm btn-secondary" onClick={onDeselectAll}>Deselect All</button>
            <span className="selected-count">{selectedCount} selected for import</span>
          </div>
        </div>
      )}

      <div className="table-scroll">
        <table className="transaction-table">
          <thead>
            <tr>
              {showCheckboxes && <th className="col-check">Import</th>}
              <th>Date</th>
              <th>Type</th>
              <th>Name / Description</th>
              <th>Memo</th>
              <th className="col-amount">Amount</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, i) => {
              const statusInfo = STATUS_LABELS[txn.status] || STATUS_LABELS.new;
              return (
                <tr
                  key={txn.fitid + '-' + i}
                  className={`row-${txn.status}${txn.selected ? ' row-selected' : ''}`}
                >
                  {showCheckboxes && (
                    <td className="col-check">
                      <input
                        type="checkbox"
                        checked={!!txn.selected}
                        onChange={() => onToggleSelect(i)}
                        aria-label={`Select transaction ${i + 1}`}
                      />
                    </td>
                  )}
                  <td className="col-date">{txn.dateStr}</td>
                  <td className="col-type">{txn.type}</td>
                  <td className="col-name">{txn.name}</td>
                  <td className="col-memo">{txn.memo}</td>
                  <td className={`col-amount ${txn.amount < 0 ? 'amount-debit' : 'amount-credit'}`}>
                    {txn.amount < 0 ? '-' : '+'}
                    {Math.abs(txn.amount).toFixed(2)}
                  </td>
                  <td>
                    <span className={`status-badge ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="col-note">
                    {txn.duplicateReason && (
                      <span className="duplicate-note" title={txn.duplicateReason}>
                        ⚠️ {txn.duplicateReason}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
