import React, { useState, useEffect, useRef } from "react";
import Button from "../shared/buttons/Button";
import { requestEmailOTP, verifyEmailOTP } from "../../services/twoFactorAuthService";

interface OTPVerificationFormProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

const OTPVerificationForm: React.FC<OTPVerificationFormProps> = ({
  email,
  onVerified,
  onBack,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown: decrement every second so "Resend in Xs" updates in real time
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every((digit) => digit !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    // Check if pasted data is 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      setError(null);
      
      // Focus last input
      inputRefs.current[5]?.focus();
      
      // Auto-submit
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join("");
    
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await verifyEmailOTP(otpCode);
      
      if (result.success) {
        setSuccessMessage("Verification successful! Logging in...");
        setTimeout(() => {
          onVerified();
        }, 500);
      } else {
        setError(result.message || "Verification failed");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Parse "Please wait N seconds..." from API to sync cooldown with backend
  const parseWaitSeconds = (message: string): number | null => {
    const match = /(\d+)\s*seconds?/i.exec(message || "");
    return match ? Math.max(0, parseInt(match[1], 10)) : null;
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResending(true);
    setError(null);
    setSuccessMessage(null);
    setOtp(["", "", "", "", "", ""]);

    try {
      const result = await requestEmailOTP();

      if (result.success) {
        setSuccessMessage("New code sent to your email");
        setResendCooldown(60);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.message || "Failed to resend code");
        const seconds = parseWaitSeconds(result.message || "");
        if (seconds !== null) setResendCooldown(seconds);
      }
    } catch (err: any) {
      const message = err?.message || "Failed to resend code. Please try again.";
      setError(message);
      const seconds = parseWaitSeconds(message);
      if (seconds !== null) setResendCooldown(seconds);
    } finally {
      setResending(false);
    }
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (local.length <= 2) return email;
    return `${local.substring(0, 2)}${"*".repeat(local.length - 2)}@${domain}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
          <svg
            className="h-8 w-8 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          We sent a verification code to
        </p>
        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
          {maskEmail(email)}
        </p>
      </div>

      {/* OTP Input */}
      <div>
        <label className="mb-2 block text-center text-xs font-medium text-gray-700 dark:text-gray-300">
          Enter 6-digit code
        </label>
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={loading}
              className={`
                h-12 w-12 rounded-lg border-2 text-center text-lg font-semibold
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                dark:focus:ring-offset-gray-900
                ${
                  digit
                    ? "border-amber-500 bg-amber-50 text-gray-900 dark:border-amber-400 dark:bg-amber-500/10 dark:text-gray-100"
                    : "border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                }
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            />
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Verify Button */}
      <Button
        type="button"
        onClick={() => handleVerify()}
        disabled={loading || otp.some((digit) => !digit)}
        className="w-full"
      >
        {loading ? "Verifying..." : "Verify Code"}
      </Button>

      {/* Resend & Back */}
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || resendCooldown > 0}
          className={`
            text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300
            ${resending || resendCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {resending
            ? "Sending..."
            : resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : "Resend code"}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Back to login
        </button>
      </div>

      {/* Help Text */}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Didn't receive the code? Check your spam folder or click resend.
      </p>
    </div>
  );
};

export default OTPVerificationForm;
