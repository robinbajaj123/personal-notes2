import { useRef, useState } from 'react';
import './FileUpload.css';

export default function FileUpload({ onFileParsed, onError }) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.qbo') && !file.name.toLowerCase().endsWith('.ofx')) {
      onError('Please upload a valid .qbo or .ofx file.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileParsed(e.target.result, file.name);
    };
    reader.onerror = () => onError('Failed to read file.');
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleChange(e) {
    handleFile(e.target.files[0]);
  }

  return (
    <div
      className={`file-upload${dragging ? ' dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current && inputRef.current.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current && inputRef.current.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".qbo,.ofx"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div className="file-upload-icon">📂</div>
      <div className="file-upload-text">
        {fileName ? (
          <span className="file-name">✅ {fileName}</span>
        ) : (
          <>
            <strong>Drag &amp; drop</strong> a <code>.qbo</code> or <code>.ofx</code> file here
            <br />
            or <span className="browse-link">browse to select</span>
          </>
        )}
      </div>
    </div>
  );
}
