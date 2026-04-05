import { useState } from 'react';
import FileUpload from './components/FileUpload';
import TransactionTable from './components/TransactionTable';
import ImportManager from './components/ImportManager';
import { parseQBO } from './utils/qboParser';
import { categorizeTransactions } from './utils/duplicateDetector';
import './App.css';

const STEPS = {
  UPLOAD: 'upload',
  REVIEW: 'review',
  IMPORTED: 'imported',
};

export default function App() {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [ledgerBalance, setLedgerBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [importedTransactions, setImportedTransactions] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [fileName, setFileName] = useState('');

  function handleFileParsed(content, name) {
    setError(null);
    setFileName(name);
    try {
      const parsed = parseQBO(content);
      const categorized = categorizeTransactions(parsed.transactions, importedTransactions);
      setAccount(parsed.account);
      setLedgerBalance(parsed.ledgerBalance);
      setTransactions(categorized);
      setStep(STEPS.REVIEW);
    } catch (err) {
      setError(err.message || 'Failed to parse QBO file.');
    }
  }

  function handleToggleSelect(index) {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  }

  function handleSelectAll() {
    setTransactions((prev) =>
      prev.map((t) => ({
        ...t,
        selected: t.status === 'new' || t.status === 'near-duplicate',
      }))
    );
  }

  function handleDeselectAll() {
    setTransactions((prev) => prev.map((t) => ({ ...t, selected: false })));
  }

  function handleConfirmImport(selected) {
    setImporting(true);
    setTimeout(() => {
      const newImported = [...importedTransactions, ...selected];
      setImportedTransactions(newImported);
      setImportResult({
        count: selected.length,
        total: newImported.length,
      });
      setImporting(false);
      setStep(STEPS.IMPORTED);
    }, 600);
  }

  function handleUploadAnother() {
    setStep(STEPS.UPLOAD);
    setError(null);
    setTransactions([]);
    setAccount(null);
    setLedgerBalance(null);
    setFileName('');
    setImportResult(null);
  }

  function handleReset() {
    setStep(STEPS.UPLOAD);
    setError(null);
    setTransactions([]);
    setImportedTransactions([]);
    setAccount(null);
    setLedgerBalance(null);
    setFileName('');
    setImportResult(null);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">
            <span className="logo">💼</span> QBO Transaction Importer
          </h1>
          <p className="app-subtitle">
            Parse QuickBooks QBO files · Detect duplicate transactions · Import new transactions
          </p>
        </div>
      </header>

      <main className="app-main">
        <div className="steps-bar">
          <StepIndicator num={1} label="Upload File" active={step === STEPS.UPLOAD} done={step !== STEPS.UPLOAD} />
          <div className="step-divider" />
          <StepIndicator num={2} label="Review & Select" active={step === STEPS.REVIEW} done={step === STEPS.IMPORTED} />
          <div className="step-divider" />
          <StepIndicator num={3} label="Import Complete" active={step === STEPS.IMPORTED} done={false} />
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="error-dismiss">✕</button>
          </div>
        )}

        {step === STEPS.UPLOAD && (
          <section className="section">
            <h2 className="section-title">Step 1: Upload your QBO File</h2>
            <p className="section-desc">
              Upload a QuickBooks Online export file (<code>.qbo</code>) or Open Financial Exchange file (<code>.ofx</code>).
              The app will parse your transactions, detect any duplicates, and let you choose which ones to import.
            </p>
            <FileUpload onFileParsed={handleFileParsed} onError={setError} />

            {importedTransactions.length > 0 && (
              <div className="imported-summary">
                <strong>📋 Already imported:</strong> {importedTransactions.length} transaction{importedTransactions.length !== 1 ? 's' : ''} in this session.
                <button className="btn-link" onClick={handleReset}>Reset session</button>
              </div>
            )}

            <div className="sample-section">
              <h3>Don&apos;t have a QBO file?</h3>
              <p>Load a built-in sample file to explore the app:</p>
              <button className="btn-sample" onClick={() => loadSampleFile(handleFileParsed)}>
                📄 Load Sample QBO File
              </button>
            </div>
          </section>
        )}

        {step === STEPS.REVIEW && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Step 2: Review Transactions</h2>
                <p className="section-desc">
                  File: <strong>{fileName}</strong>
                  {account && <> &nbsp;·&nbsp; Account: <strong>{account.acctId || 'Unknown'}</strong> ({account.acctType})</>}
                  {ledgerBalance && <> &nbsp;·&nbsp; Balance: <strong>${ledgerBalance.amount.toFixed(2)}</strong> as of {ledgerBalance.asOf}</>}
                </p>
              </div>
              <button className="btn-link" onClick={handleUploadAnother}>← Upload different file</button>
            </div>

            <p className="review-hint">
              ✅ <strong>New</strong> transactions are pre-selected. Uncheck any you do not want to import.
              Duplicate transactions are unchecked by default but can be manually included.
            </p>

            <TransactionTable
              transactions={transactions}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
            />

            <ImportManager
              transactions={transactions}
              onConfirmImport={handleConfirmImport}
              onCancel={handleUploadAnother}
              importing={importing}
            />
          </section>
        )}

        {step === STEPS.IMPORTED && importResult && (
          <section className="section section-success">
            <div className="success-icon">🎉</div>
            <h2 className="section-title">Import Successful!</h2>
            <p className="success-msg">
              Successfully imported <strong>{importResult.count}</strong> transaction{importResult.count !== 1 ? 's' : ''}.
              <br />
              Total transactions in session: <strong>{importResult.total}</strong>
            </p>

            <div className="success-actions">
              <button className="btn-primary" onClick={handleUploadAnother}>
                📂 Upload Another File
              </button>
              <button className="btn-secondary-action" onClick={() => setStep(STEPS.REVIEW)}>
                ← Back to Review
              </button>
              {importedTransactions.length > 0 && (
                <button className="btn-link" onClick={handleReset}>
                  🔄 Reset Session
                </button>
              )}
            </div>

            <div className="imported-list-section">
              <h3>All Imported Transactions ({importedTransactions.length})</h3>
              <TransactionTable
                transactions={importedTransactions.map((t) => ({ ...t, status: 'new', selected: false }))}
                showCheckboxes={false}
              />
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>QBO Transaction Importer &mdash; All processing is done locally in your browser. No data is sent to any server.</p>
      </footer>
    </div>
  );
}

function StepIndicator({ num, label, active, done }) {
  return (
    <div className={`step-indicator${active ? ' step-active' : ''}${done ? ' step-done' : ''}`}>
      <div className="step-num">{done ? '✓' : num}</div>
      <div className="step-label">{label}</div>
    </div>
  );
}

function loadSampleFile(onFileParsed) {
  const sampleQBO = `OFXHEADER:100
DATA:OFXSGML
VERSION:151
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20250301120000[0:GMT]
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>USD
<BANKACCTFROM>
<BANKID>021000021
<ACCTID>123456789012
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>20250101000000[0:GMT]
<DTEND>20250228000000[0:GMT]
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20250105000000[0:GMT]
<TRNAMT>-45.99
<FITID>20250105001
<NAME>AMAZON.COM
<MEMO>Online purchase - books
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20250110000000[0:GMT]
<TRNAMT>-120.50
<FITID>20250110001
<NAME>WHOLE FOODS MARKET
<MEMO>Grocery shopping
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20250115000000[0:GMT]
<TRNAMT>3500.00
<FITID>20250115001
<NAME>EMPLOYER PAYROLL
<MEMO>Direct deposit - salary
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20250118000000[0:GMT]
<TRNAMT>-89.99
<FITID>20250118001
<NAME>NETFLIX
<MEMO>Monthly subscription
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20250120000000[0:GMT]
<TRNAMT>-250.00
<FITID>20250120001
<NAME>UTILITY COMPANY
<MEMO>Electric bill January
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20250122000000[0:GMT]
<TRNAMT>-45.99
<FITID>20250122001
<NAME>AMAZON.COM
<MEMO>Online purchase - near duplicate test
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20250125000000[0:GMT]
<TRNAMT>-18.75
<FITID>20250125001
<NAME>SPOTIFY
<MEMO>Music subscription
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20250128000000[0:GMT]
<TRNAMT>-1200.00
<FITID>20250128001
<NAME>LANDLORD LLC
<MEMO>Rent payment
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20250131000000[0:GMT]
<TRNAMT>500.00
<FITID>20250131001
<NAME>FREELANCE CLIENT
<MEMO>Invoice 1042 payment
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20250110000000[0:GMT]
<TRNAMT>-120.50
<FITID>20250110001
<NAME>WHOLE FOODS MARKET
<MEMO>Grocery shopping - exact duplicate
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>4328.27
<DTASOF>20250228000000[0:GMT]
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  onFileParsed(sampleQBO, 'sample_transactions.qbo');
}
