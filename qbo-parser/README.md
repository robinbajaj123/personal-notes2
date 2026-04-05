# QBO Transaction Importer

A React web application that parses QuickBooks Online QBO files (OFX format), detects duplicate transactions, and lets you selectively import new transactions.

## Features

- **📂 Drag & Drop Upload** — Upload `.qbo` or `.ofx` files via drag & drop or file browser
- **🔍 Duplicate Detection** — Three-tier detection system:
  - **Exact FITID match** — Matches on the financial institution's unique transaction ID
  - **Exact date/amount/name match** — Catches duplicates even with different FITIDs
  - **Near-duplicate (fuzzy)** — Same amount & payee within a configurable date window (default ±3 days)
- **📋 In-file duplicate detection** — Flags transactions that appear more than once within the same uploaded file
- **✅ Selective Import** — Review all transactions, see their duplicate status, check/uncheck which ones to import
- **🔄 Session memory** — Previously imported transactions are remembered; re-uploading the same file correctly marks everything as duplicate
- **🔒 100% client-side** — All parsing and processing happens in your browser; no data is sent to any server

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## How It Works

1. **Upload** your `.qbo` or `.ofx` file (or click **Load Sample QBO File** to try with built-in data)
2. **Review** the parsed transactions — new ones are pre-selected, duplicates are unchecked
3. **Import** the selected transactions; the app remembers them for future uploads

## QBO/OFX Format Support

Supports the OFX SGML format (v1.x) used by QuickBooks Online exports, including:
- Bank account statements (`BANKMSGSRSV1` / `STMTRS`)
- Credit card statements (`CREDITCARDMSGSRSV1` / `CCSTMTRS`)
- All standard `STMTTRN` fields: `FITID`, `TRNTYPE`, `DTPOSTED`, `TRNAMT`, `NAME`, `MEMO`, `CHECKNUM`

## Project Structure

```
src/
  utils/
    qboParser.js          # OFX/QBO file parser
    duplicateDetector.js  # Duplicate detection logic
  components/
    FileUpload.jsx        # Drag & drop upload component
    TransactionTable.jsx  # Transaction list with status badges
    ImportManager.jsx     # Import summary and confirmation
  App.jsx                 # 3-step wizard (Upload → Review → Done)
```
