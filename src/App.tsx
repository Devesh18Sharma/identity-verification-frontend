// src/App.tsx
import { useState } from 'react'; // Removed unused 'React' import
import axios from 'axios';

// Import Components (Ensure paths are correct)
import DocumentUpload from './components/DocumentUpload';
import SelfieCapture from './components/SelfieCapture';
import VerificationStatus from './components/VerificationStatus';
import AccountSetup from './components/AccountSetup';

// Import Types
import { VerificationStep, DocumentFiles, VerificationStatusValue, AccountDetails, ApiErrorData } from './types/verification';

// Define API base URL - Ensure this matches your Spring Boot backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/verify';
console.log(`API URL: ${API_URL}`); // Log the API URL being used

function App() {
  const [step, setStep] = useState<VerificationStep>('document');
  const [docFiles, setDocFiles] = useState<DocumentFiles | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusValue>(null);
  const [error, setError] = useState<string | null>(null);
  const [finalAccountDetails, setFinalAccountDetails] = useState<AccountDetails | null>(null); // Store created account info

  // Handler for when documents are selected in DocumentUpload
  const handleDocsSelected = (files: DocumentFiles) => {
    console.log("Documents selected:", files);
    setDocFiles(files);
    setError(null); // Clear previous errors
    setStep('selfie');
  };

  // Handler for when selfie is captured and ready for submission
  const handleSelfieCapturedAndSubmit = async (selfieBlob: Blob) => {
    if (!docFiles) {
      console.error("Attempted submission without document files.");
      setError("Document files are missing. Please go back and upload them.");
      setStep('document');
      return;
    }

    setError(null);
    setStep('submitting');
    console.log("Preparing form data for submission...");

    const formData = new FormData();
    formData.append('documentFront', docFiles.front, docFiles.front.name); // Include filename
    if (docFiles.back) {
      formData.append('documentBack', docFiles.back, docFiles.back.name); // Include filename
    }
    // Convert blob to File object with a filename - crucial for backend processing
    const selfieFile = new File([selfieBlob], "selfie.jpg", { type: selfieBlob.type || "image/jpeg" });
    formData.append('selfie', selfieFile, selfieFile.name); // Include filename

    // Optional: Log FormData contents (for debugging, doesn't show files directly)
    // for (let [key, value] of formData.entries()) {
    //   console.log(`${key}: ${value instanceof File ? value.name : value}`);
    // }

    try {
      console.log(`Submitting verification data to ${API_URL}/initiate...`);
      const response = await axios.post<{ verificationId: string }>(`${API_URL}/initiate`, formData, {
        // Content-Type is set automatically by browser for FormData
        // timeout: 30000 // Optional: Add a timeout (e.g., 30 seconds)
      });
      console.log("Verification initiated successfully:", response.data);
      setVerificationId(response.data.verificationId);
      setVerificationStatus('PENDING'); // Set initial status for polling
      setStep('status');
    } catch (err) { // Catch block with better typing
      console.error("Error submitting verification:", err);
      let errorMsg = "Submission failed. Please check your connection and try again.";
        if (axios.isAxiosError(err)) {
            const responseData = err.response?.data as ApiErrorData;
            if (responseData && responseData.message) {
                errorMsg = `Submission failed: ${responseData.message}`;
            } else if (err.response?.status) {
                 errorMsg = `Submission failed: Server responded with status ${err.response.status}.`;
            } else if (err.request) {
                 errorMsg = "Submission failed: No response received from server.";
            } else if (err.code === 'ECONNABORTED') {
                 errorMsg = "Submission timed out. Please check your connection and try again.";
            }
        } else if (err instanceof Error) {
             errorMsg = `Submission failed: ${err.message}`;
        }
      setError(errorMsg);
      // Send user back to appropriate step (maybe selfie or doc)
      setStep('selfie'); // Or 'document' if more appropriate
    }
  };

  // Handler for when verification is confirmed successful
  const handleVerificationSuccess = () => {
    console.log("Verification successful!");
    setError(null); // Clear any previous polling errors
    setStep('account');
  };

  // Handler for when verification fails
  const handleVerificationFailure = (reason: string) => {
    console.warn(`Verification failed with reason: ${reason}`);
    // Provide more user-friendly messages based on the reason code
    let userMessage = `Verification Failed (${reason}). Please ensure your document and selfie are clear and try again. If the problem persists, contact support.`;
     if (reason === 'REJECTED') {
         userMessage = "Verification Rejected. The document or selfie could not be accepted. Please contact support for more details.";
     } else if (reason === 'EXPIRED') {
         userMessage = "This verification attempt has expired. Please start over.";
     } else if (reason === 'ERROR' || reason === 'FAILED') {
         userMessage = "A technical error occurred during verification. Please try again later or contact support.";
     }
    setError(userMessage);
    // Reset state for retry
    setStep('document'); // Reset to start
    setVerificationId(null);
    setVerificationStatus(null);
    setDocFiles(null);
  };

  // Handler for successful account creation
  const handleAccountCreated = (accountDetails: AccountDetails) => {
    console.log("Account setup complete! Details:", accountDetails);
    setFinalAccountDetails(accountDetails); // Store the details
    setError(null);
    setStep('finished');
  };

  return (
    <div id="app-container"> {/* Use ID if targeted by global styles */}
      <header className="app-header">
         <h1>Identity Verification</h1>
      </header>
      <main className="app-main">
          {/* Display global errors prominently */}
          {error && <p className="error-message app-error">{error}</p>}

          {/* Render components based on the current step */}
          {step === 'document' && (
            <DocumentUpload onFilesSelected={handleDocsSelected} />
          )}

          {step === 'selfie' && docFiles && ( // Only render if docFiles exist
            <SelfieCapture onSubmit={handleSelfieCapturedAndSubmit} />
          )}

          {step === 'submitting' && (
             <div className="component-section loading-section">
                <p className="loading-message">Submitting your information securely...</p>
                <div className="spinner"></div>
             </div>
           )}

          {step === 'status' && verificationId && (
            <VerificationStatus
              verificationId={verificationId}
              apiUrl={API_URL}
              onVerified={handleVerificationSuccess}
              onFailed={handleVerificationFailure}
              initialStatus={verificationStatus || 'PENDING'}
            />
          )}

          {step === 'account' && (
            <AccountSetup
              apiUrl={API_URL}
              onAccountCreated={handleAccountCreated}
            />
          )}

          {step === 'finished' && (
            <div className="component-section finished-section">
              <h2>Verification Complete!</h2>
              <p>Welcome, {finalAccountDetails?.email ?? 'User'}!</p>
              <p>Your identity has been verified and your account is ready.</p>
              {/* Example: Link to a dashboard */}
              {/* <a href="/dashboard">Go to Dashboard</a> */}
            </div>
          )}
      </main>
       <footer className="app-footer">
            <p>&copy; {new Date().getFullYear()} Your Company Name</p>
       </footer>
    </div>
  );
}

export default App;