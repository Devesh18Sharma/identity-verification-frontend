// src/components/VerificationStatus.tsx
import { useState, useEffect, useRef } from 'react'; // Removed unused 'React' import
import axios from 'axios';
import { VerificationStatusValue, ApiErrorData } from '../types/verification';
import './VerificationStatus.css';

interface VerificationStatusProps {
  verificationId: string;
  apiUrl: string;
  initialStatus: VerificationStatusValue;
  onVerified: () => void;
  onFailed: (reason: string) => void;
}

const POLLING_INTERVAL_MS = 5000; // 5 seconds
const MAX_POLLING_ATTEMPTS = 24; // Stop after 2 minutes (24 * 5s)

function VerificationStatus({
    verificationId,
    apiUrl,
    initialStatus,
    onVerified,
    onFailed
}: VerificationStatusProps) {
  const [status, setStatus] = useState<VerificationStatusValue>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const attemptsRef = useRef<number>(0); // Track polling attempts

  // Define terminal states to simplify checks
  const isTerminalStatus = (s: VerificationStatusValue): boolean =>
      s === 'APPROVED' || s === 'REJECTED' || s === 'FAILED' || s === 'EXPIRED' || s === 'ERROR';


  useEffect(() => {
    const checkStatus = async () => {
      // Stop polling if max attempts reached
       if (attemptsRef.current >= MAX_POLLING_ATTEMPTS) {
           console.warn(`Polling stopped for ${verificationId} after reaching max attempts.`);
           setError("Verification is taking longer than expected. Please check back later or contact support.");
           if (intervalRef.current !== null) clearInterval(intervalRef.current);
           intervalRef.current = null;
           // Consider calling onFailed with a specific 'TIMEOUT' reason if desired
           // onFailed('TIMEOUT');
           return;
       }

       // Stop polling if status is already terminal (safety check)
       if (isTerminalStatus(status)) {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
       }

      attemptsRef.current += 1;
      console.log(`Checking status for ${verificationId} (Attempt: ${attemptsRef.current})...`);

      try {
        setError(null); // Clear previous polling errors on new attempt
        const response = await axios.get<{ status: VerificationStatusValue }>(`${apiUrl}/status/${verificationId}`);
        const newStatus = response.data.status;
        console.log(`Status received: ${newStatus}`);

        // Update state only if the status has actually changed
        if (newStatus !== status) {
           setStatus(newStatus); // Trigger re-render and effect re-evaluation
        }

        // Handle terminal states received from API
        if (newStatus === 'APPROVED') {
          onVerified();
          if (intervalRef.current !== null) clearInterval(intervalRef.current);
          intervalRef.current = null;
        } else if (isTerminalStatus(newStatus)) {
          // Pass the specific failure reason
          onFailed(newStatus || 'UNKNOWN_FAILURE'); // Provide default if null/undefined somehow
          if (intervalRef.current !== null) clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // If status is still PENDING or PROCESSING, polling continues automatically

      } catch (err) { // Catch block with better typing for Axios errors
        console.error("Error checking status:", err);
        let errorMsg = "Failed to fetch status. Please check your connection.";
        if (axios.isAxiosError(err)) {
            const responseData = err.response?.data as ApiErrorData; // Type assertion
            if (responseData && responseData.message) {
                errorMsg = `Failed to fetch status: ${responseData.message}`;
            } else if (err.response?.status) {
                 errorMsg = `Failed to fetch status: Server responded with status ${err.response.status}.`;
            } else if (err.request) {
                 errorMsg = "Failed to fetch status: No response received from server.";
            }
        } else if (err instanceof Error) {
             errorMsg = `Failed to fetch status: ${err.message}`;
        }
        setError(errorMsg);
        // Decide whether to stop polling on error. For robustness, maybe continue for a few tries.
        // If you want to stop immediately:
        // if (intervalRef.current !== null) clearInterval(intervalRef.current);
        // intervalRef.current = null;
        // onFailed('POLLING_ERROR');
      }
    };

    // --- Effect Logic ---
    // Start polling only if status is PENDING/PROCESSING and no interval is active
    if ((status === 'PENDING' || status === 'PROCESSING') && intervalRef.current === null) {
      console.log("Starting status polling...");
      attemptsRef.current = 0; // Reset attempts counter
      // Run once immediately, then start interval
      checkStatus();
      intervalRef.current = window.setInterval(checkStatus, POLLING_INTERVAL_MS);
    }

    // Cleanup function: Stop polling when component unmounts OR status becomes terminal
    return () => {
      if (intervalRef.current !== null) {
        console.log("Stopping status polling (cleanup).");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // Effect dependencies: Rerun if key identifiers change, or status itself changes (to handle terminal state correctly)
  }, [verificationId, apiUrl, onVerified, onFailed, status]);

  const getStatusMessage = (): string => {
    switch (status) {
      case 'PENDING': return 'Verification submitted. We are checking your documents...';
      case 'PROCESSING': return 'Processing your verification, please wait...';
      case 'APPROVED': return 'Verification Successful! Proceeding to account setup...';
      case 'REJECTED': return 'Verification Rejected. The provided document or selfie could not be accepted. Please contact support if you believe this is an error.';
      case 'FAILED': return 'Verification Failed due to a technical issue or invalid data. Please try again or contact support.';
      case 'EXPIRED': return 'This verification attempt has expired. Please start the process again.';
      case 'ERROR': return 'An unexpected error occurred during verification. Please contact support.';
      default: return 'Checking verification status...';
    }
  };

  return (
    <div className="component-section verification-status-container">
      <h2>3. Verification Status</h2>
      {/* Show polling errors separately from terminal status messages */}
      {error && status !== 'FAILED' && status !== 'ERROR' && <p className="error-message">{error}</p>}

      <p>Your verification ID: <strong>{verificationId}</strong></p>
      <div className={`status-indicator status-${status?.toLowerCase() ?? 'unknown'}`}>
        Status: <strong>{status ?? 'Loading...'}</strong>
      </div>
      <p className="status-message">{getStatusMessage()}</p>

      {/* Show spinner only for non-terminal, non-error states */}
      {(status === 'PENDING' || status === 'PROCESSING' || status === null) && <div className="spinner"></div>}
    </div>
  );
}

export default VerificationStatus;