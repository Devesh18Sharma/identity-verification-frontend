// src/components/AccountSetup.tsx
import { useState, FormEvent } from 'react'; // Removed unused 'React' import
import axios from 'axios';
import { AccountDetails, ApiErrorData } from '../types/verification'; // Import types
import './AccountSetup.css';

interface AccountSetupProps {
  apiUrl: string;
  onAccountCreated: (details: AccountDetails) => void; // Pass details back
}

// Basic email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AccountSetup({ apiUrl, onAccountCreated }: AccountSetupProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);


  const validateForm = (): boolean => {
      setValidationError(null); // Clear previous validation errors
      if (!email || !password || !confirmPassword) {
          setValidationError("All fields are required.");
          return false;
      }
      if (!EMAIL_REGEX.test(email)) {
           setValidationError("Please enter a valid email address.");
           return false;
      }
      if (password.length < 8) {
          setValidationError("Password must be at least 8 characters long.");
          return false;
      }
      // Add more complex password rules if needed (e.g., uppercase, number, symbol)
      // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      // if (!passwordRegex.test(password)) {
      //     setValidationError("Password must include uppercase, lowercase, number, and special character.");
      //     return false;
      // }
      if (password !== confirmPassword) {
          setValidationError("Passwords do not match.");
          return false;
      }
      return true; // Form is valid
  };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear previous submission errors

    if (!validateForm()) {
        return; // Stop submission if validation fails
    }

    setIsLoading(true);

    try {
      const payload = { email, password };
      // Assume backend returns account details upon success
      const response = await axios.post<{ message: string; account: AccountDetails }>(`${apiUrl}/create-account`, payload);

      console.log("Account creation successful:", response.data);
      onAccountCreated(response.data.account); // Pass the created account details back

    } catch (err) { // Catch block with better typing
      console.error("Account creation failed:", err);
      let errorMsg = "Account setup failed. Please try again later.";
       if (axios.isAxiosError(err)) {
            const responseData = err.response?.data as ApiErrorData;
            if (responseData && responseData.message) {
                // Check for specific messages like 'Email already exists'
                if (responseData.message.toLowerCase().includes("email already exists")) {
                    errorMsg = "This email address is already registered. Please use a different email.";
                } else {
                    errorMsg = `Account setup failed: ${responseData.message}`;
                }
            } else if (err.response?.status) {
                 errorMsg = `Account setup failed: Server responded with status ${err.response.status}.`;
            } else if (err.request) {
                 errorMsg = "Account setup failed: No response received from server.";
            }
        } else if (err instanceof Error) {
             errorMsg = `Account setup failed: ${err.message}`;
        }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Disable button based on loading state OR validation errors
  const isSubmitDisabled = isLoading || !email || !password || !confirmPassword || password !== confirmPassword || password.length < 8;

  return (
    <div className="component-section account-setup-container">
      <h2>4. Setup Your Account</h2>
      <p>Your identity is verified! Create your account credentials below.</p>
      {/* Display validation errors first */}
      {validationError && <p className="error-message validation-error">{validationError}</p>}
      {/* Display submission errors */}
      {error && <p className="error-message submission-error">{error}</p>}

      <form onSubmit={handleSubmit} noValidate> {/* Disable browser validation, rely on ours */}
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            aria-invalid={!!validationError && validationError.includes("email")}
            aria-describedby={validationError ? "validation-error-msg" : undefined}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Create Password (min 8 chars):</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading}
            aria-invalid={!!validationError && validationError.includes("Password")}
            aria-describedby={validationError ? "validation-error-msg" : undefined}
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            disabled={isLoading}
             aria-invalid={!!validationError && validationError.includes("match")}
            aria-describedby={validationError ? "validation-error-msg" : undefined}
          />
        </div>

         {/* For screen readers if validation fails */}
        {validationError && <span id="validation-error-msg" className="visually-hidden">Error: {validationError}</span>}

        <button type="submit" disabled={isSubmitDisabled}>
          {isLoading ? 'Creating Account...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
}

export default AccountSetup;