// src/types/verification.ts
export type VerificationStep = 'document' | 'selfie' | 'submitting' | 'status' | 'account' | 'finished';

export interface DocumentFiles {
    front: File;
    back?: File; // Optional back file
}

export type VerificationStatusValue = 'PENDING' | 'APPROVED' | 'FAILED' | 'REJECTED' | 'EXPIRED' | null;

export interface AccountDetails {
    email: string;
    // Add other relevant fields like userId if returned from backend
}