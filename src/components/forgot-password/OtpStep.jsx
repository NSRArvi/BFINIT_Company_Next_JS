"use client";
import { useState, useEffect, useRef } from "react";
import { post } from "@/lib/api";
import { primaryBtn } from "./Shared";

const RESEND_SECONDS = 30;
const EMPTY_OTP = ["", "", "", "", "", ""];

export default function OtpStep({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState(EMPTY_OTP);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  // The code was just sent by the previous step, so start on cooldown
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const otpRefs = useRef([]);

  // Focus first box on mount
  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (errors.otp) setErrors((p) => ({ ...p, otp: "" }));
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...EMPTY_OTP];
    pasted.split("").forEach((char, i) => (next[i] = char));
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setErrors({});
    setOtp(EMPTY_OTP);
    setLoading(true);

    const { ok, error } = await post(
      "/api/v1/auth/storeOwner/forgot-password",
      { email },
    );

    setLoading(false);

    if (!ok) {
      setErrors({ form: error || "Could not resend code. Try again." });
      return;
    }
    setCooldown(RESEND_SECONDS);
    otpRefs.current[0]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setErrors({ otp: "Please enter the full 6-digit code." });
      return;
    }

    if (loading) return;
    setLoading(true);

    const { ok, error, data } = await post(
      "/api/v1/auth/storeOwner/forgot-password/verify-otp",
      {
        email,
        otp_code: code,
      },
    );

    setLoading(false);

    if (!ok) {
      setErrors({ otp: error || "Invalid code. Please try again." });
      return;
    }

    onVerified(code, data);
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#09090b] font-inter">
          Check your email
        </h1>
        <p className="mt-1.5 text-sm text-[#71717a]">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-[#09090b]">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#09090b]">
            Verification Code
          </label>
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`h-12 w-full rounded-lg border text-center text-lg font-semibold text-[#09090b] outline-none transition-all duration-150 focus:ring-2 focus:ring-brand focus:ring-offset-1 ${
                  errors.otp
                    ? "border-[#ef4444] focus:ring-[#ef4444]"
                    : "border-[#e4e4e7] hover:border-[#a1a1aa]"
                }`}
              />
            ))}
          </div>
          {errors.otp && <p className="text-xs text-[#ef4444]">{errors.otp}</p>}
        </div>

        {errors.form && (
          <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#ef4444]">
            {errors.form}
          </p>
        )}

        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? "Verifying…" : "Verify code"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onBack}
            className="text-[#71717a] transition-colors hover:text-[#09090b]"
          >
            ← Change email
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:text-[#a1a1aa] disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </form>
    </>
  );
}
