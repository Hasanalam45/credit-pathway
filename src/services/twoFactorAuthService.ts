/**
 * Two-Factor Authentication Service (Email OTP)
 * Calls HTTP Cloud Functions with CORS (Bearer token in header).
 */

import { functions, auth } from "../config/firebase";

/**
 * Request OTP Response
 */
export interface RequestOTPResponse {
  success: boolean;
  message: string;
  email?: string; // Masked email
}

/**
 * Verify OTP Response
 */
export interface VerifyOTPResponse {
  success: boolean;
  message: string;
}

/**
 * Request OTP code to be sent via email
 * Calls Firebase Function that generates OTP and sends email
 * 
 * @returns Promise with success status and message
 */
function getFunctionsBaseUrl(): string {
  const projectId = (functions as any).app?.options?.projectId ?? "";
  return `https://us-central1-${projectId}.cloudfunctions.net`;
}

export const requestEmailOTP = async (): Promise<RequestOTPResponse> => {
  const url = `${getFunctionsBaseUrl()}/requestEmailOtp`;
  console.log("[2FA] requestEmailOtp →", url);

  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    console.error("[2FA] requestEmailOtp: no auth token (user not signed in)");
    throw new Error("Please log in first");
  }
  console.log("[2FA] requestEmailOtp: token present, sending POST");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  console.log("[2FA] requestEmailOtp response:", res.status, res.statusText);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } })?.error;
    const code = err?.code ?? "—";
    const message = err?.message ?? res.statusText;
    console.error("[2FA] requestEmailOtp error:", code, message);
    if (code === "unauthenticated") throw new Error("Please log in first");
    if (code === "not-found") throw new Error("Admin account not found");
    if (code === "failed-precondition") throw new Error(message || "2FA is not enabled");
    if (code === "resource-exhausted") throw new Error(message || "Please wait before requesting a new code");
    throw new Error(message || "Failed to send verification code");
  }

  console.log("[2FA] requestEmailOtp success");
  return data as RequestOTPResponse;
};

/**
 * Verify OTP code entered by user
 * Calls Firebase Function that validates the code
 * 
 * @param code - 6-digit OTP code
 * @returns Promise with success status and message
 */
export const verifyEmailOTP = async (code: string): Promise<VerifyOTPResponse> => {
  if (!code || !/^\d{6}$/.test(code.trim())) {
    throw new Error("Please enter a valid 6-digit code");
  }

  const url = `${getFunctionsBaseUrl()}/verifyEmailOtp`;
  console.log("[2FA] verifyEmailOtp →", url);

  const token = await auth.currentUser?.getIdToken().catch(() => null);
  if (!token) {
    console.error("[2FA] verifyEmailOtp: no auth token (user not signed in)");
    throw new Error("Please log in first");
  }
  console.log("[2FA] verifyEmailOtp: token present, sending POST with code");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: code.trim() }),
  });

  console.log("[2FA] verifyEmailOtp response:", res.status, res.statusText);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } })?.error;
    const codeErr = err?.code ?? "—";
    const message = err?.message ?? res.statusText;
    console.error("[2FA] verifyEmailOtp error:", codeErr, message);
    if (codeErr === "unauthenticated") throw new Error("Please log in first");
    if (codeErr === "not-found") throw new Error("No verification code found. Please request a new code");
    if (codeErr === "deadline-exceeded") throw new Error("Verification code has expired. Please request a new code");
    if (codeErr === "resource-exhausted") throw new Error(message || "Too many failed attempts");
    if (codeErr === "invalid-argument") throw new Error(message || "Invalid code");
    throw new Error(message || "Failed to verify code");
  }

  console.log("[2FA] verifyEmailOtp success");
  return data as VerifyOTPResponse;
};
