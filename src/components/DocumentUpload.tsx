// src/components/DocumentUpload.tsx
import { useState, ChangeEvent } from 'react'; // Removed unused 'React' import
import { DocumentFiles } from '../types/verification';
import './DocumentUpload.css';

interface DocumentUploadProps {
  onFilesSelected: (files: DocumentFiles) => void;
}

const MAX_FILE_SIZE_MB = 10; // Set max file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function DocumentUpload({ onFilesSelected }: DocumentUploadProps) {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = event.target.files?.[0];
    // Clear previous selection for this side if user cancels file dialog
     if (!file) {
         if (side === 'front') setFrontFile(null);
         else setBackFile(null);
         event.target.value = ''; // Allow re-selecting the same file
         return;
     }

    // --- Validation ---
    // 1. File Type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type for ${side} (${file.type}). Please upload a JPG or PNG image.`);
      event.target.value = ''; // Reset input
      return;
    }

    // 2. File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size for ${side} exceeds ${MAX_FILE_SIZE_MB}MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB).`);
       event.target.value = ''; // Reset input
      return;
    }
    // --- End Validation ---

    setError(null); // Clear error on valid selection
    if (side === 'front') {
      setFrontFile(file);
    } else {
      setBackFile(file);
    }
  };

  const handleNext = () => {
    if (frontFile) {
      setError(null);
      const filesToPass: DocumentFiles = { front: frontFile };
      if (backFile) {
        filesToPass.back = backFile;
      }
      onFilesSelected(filesToPass);
    } else {
      setError('Please upload the front of your document.');
    }
  };

  return (
    <div className="component-section document-upload-container">
      <h2>1. Upload Document</h2>
      <p className="instructions">Please upload clear, well-lit images of your government-issued ID (JPEG or PNG, max {MAX_FILE_SIZE_MB}MB).</p>
      {error && <p className="error-message">{error}</p>}

      <div className="file-input-group">
        <label htmlFor="docFront">Document Front *</label>
        <input
          id="docFront"
          type="file"
          accept="image/png, image/jpeg, image/jpg" // Be specific in accept
          onChange={(e) => handleFileChange(e, 'front')}
          aria-required="true"
          aria-describedby={error ? "upload-error" : undefined} // Accessibility
        />
        {frontFile && <span className="file-name">Selected: {frontFile.name} ({ (frontFile.size / 1024 / 1024).toFixed(2) } MB)</span>}
      </div>

      <div className="file-input-group">
        <label htmlFor="docBack">Document Back (If applicable)</label>
        <input
          id="docBack"
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          onChange={(e) => handleFileChange(e, 'back')}
           aria-describedby={error ? "upload-error" : undefined} // Accessibility
        />
        {backFile && <span className="file-name">Selected: {backFile.name} ({ (backFile.size / 1024 / 1024).toFixed(2) } MB)</span>}
      </div>

      {/* For screen readers if there's an error */}
       {error && <span id="upload-error" className="visually-hidden">Error: {error}</span>}

      <button onClick={handleNext} disabled={!frontFile}>
        Next: Capture Selfie
      </button>
    </div>
  );
}

export default DocumentUpload;