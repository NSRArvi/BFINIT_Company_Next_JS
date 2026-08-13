"use client";
import { useState, useEffect, useRef } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { post } from "@/lib/api";
import Container from "@/components/shared/Container";
import { useRouter } from "next/navigation";

const SESSION_KEY = "register_pending";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // OTP step state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);

  const { saveAuth } = useAuth();
  const navigate = useRouter();

  // On mount: check if we were mid-registration (e.g. user refreshed on OTP screen)
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({
          ...prev,
          ...parsed,
          confirmPassword: parsed.password,
        }));
        setOtpStep(true);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // ─── Validation ────────────────────────────────────────────────────────────

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Full name is required.";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if (!form.email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!form.phone) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\+?[0-9\s\-().]{7,20}$/.test(form.phone)) {
      newErrors.phone = "Enter a valid phone number.";
    }

    if (!form.password) {
      newErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    return newErrors;
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // OTP digit input handling
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1); // keep only last digit
    setOtp(next);
    if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));
    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ─── Step 1: Register → receive OTP ────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
    };

    setLoading(true);
    const { data, ok, error } = await post(
      "/api/v1/auth/storeOwnerRegister",
      payload,
    );
    setLoading(false);

    if (!ok) {
      setErrors({ form: error });
      return;
    }

    if (data?.data?.requireOtp) {
      // Persist registration data so a refresh doesn't lose it
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      );
      setOtpStep(true);
      return;
    }

    // If backend doesn't require OTP, finish immediately
    clearPending();
    saveAuth(data);
    navigate.push("/");
  };

  // ─── Step 2: Verify OTP ────────────────────────────────────────────────────

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setErrors({ otp: "Please enter the full 6-digit code." });
      return;
    }

    const pending = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");

    const payload = {
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      password: pending.password,
      otp_code: otpCode,
    };

    setLoading(true);
    const { data, ok, error } = await post(
      "/api/v1/auth/storeOwnerRegister",
      payload,
    );
    setLoading(false);

    if (!ok) {
      setErrors({ otp: error || "Invalid OTP. Please try again." });
      return;
    }

    clearPending();
    saveAuth(data);
    navigate.push("/");
  };

  const clearPending = () => sessionStorage.removeItem(SESSION_KEY);

  const handleGoBack = () => {
    clearPending();
    setOtpStep(false);
    setOtp(["", "", "", "", "", ""]);
    setErrors({});
  };

  // ─── Styles ────────────────────────────────────────────────────────────────

  const inputClass = (field) =>
    `h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#09090b] placeholder-[#a1a1aa] outline-none transition-all duration-150 focus:ring-2 focus:ring-brand focus:ring-offset-1 ${
      errors[field]
        ? "border-[#ef4444] focus:ring-[#ef4444]"
        : "border-[#e4e4e7] hover:border-[#a1a1aa]"
    }`;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center bg-[#f8f9fa] pb-16 pt-24">
      <Container>
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-[#e4e4e7] bg-white px-8 py-10 shadow-sm">
            {/* ── OTP Step ── */}
            {otpStep ? (
              <>
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0fdf4]">
                    <svg
                      className="h-6 w-6 text-brand"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h1
                    className="text-2xl font-semibold tracking-tight text-[#09090b]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Check your email
                  </h1>
                  <p className="mt-1.5 text-sm text-[#71717a]">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-[#09090b]">
                      {form.email}
                    </span>
                  </p>
                </div>

                <form
                  onSubmit={handleOtpSubmit}
                  className="flex flex-col gap-5"
                >
                  {/* OTP boxes */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#09090b]">
                      Verification Code
                    </label>
                    <div
                      className="flex justify-between gap-2"
                      onPaste={handleOtpPaste}
                    >
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className={`h-12 w-full rounded-lg border text-center text-lg font-semibold text-[#09090b] outline-none transition-all duration-150 focus:ring-2 focus:ring-brand focus:ring-offset-1 ${
                            errors.otp
                              ? "border-[#ef4444] focus:ring-[#ef4444]"
                              : "border-[#e4e4e7] hover:border-[#a1a1aa]"
                          }`}
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <p className="text-xs text-[#ef4444]">{errors.otp}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 h-10 w-full rounded-lg bg-brand text-sm font-medium text-white transition-all duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Verifying…" : "Verify & Create Account"}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="text-center text-sm text-[#71717a] transition-colors hover:text-[#09090b]"
                  >
                    ← Use a different email
                  </button>
                </form>
              </>
            ) : (
              /* ── Registration Step ── */
              <>
                <div className="mb-8 text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-[#09090b] font-inter">
                    Create an account
                  </h1>
                  <p className="mt-1.5 text-sm text-[#71717a]">
                    Fill in your details to get started
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-[#09090b]"
                    >
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Alice Test"
                      value={form.name}
                      onChange={handleChange}
                      className={inputClass("name")}
                    />
                    {errors.name && (
                      <p className="text-xs text-[#ef4444]">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-[#09090b]"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="alice@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className={inputClass("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-[#ef4444]">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="phone"
                      className="text-sm font-medium text-[#09090b]"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+1234567890"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass("phone")}
                    />
                    {errors.phone && (
                      <p className="text-xs text-[#ef4444]">{errors.phone}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-[#09090b]"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        className={`${inputClass("password")} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] transition-colors hover:text-[#09090b]"
                        tabIndex={-1}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <AiOutlineEyeInvisible className="text-lg" />
                        ) : (
                          <AiOutlineEye className="text-lg" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-[#ef4444]">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-[#09090b]"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className={`${inputClass("confirmPassword")} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] transition-colors hover:text-[#09090b]"
                        tabIndex={-1}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? (
                          <AiOutlineEyeInvisible className="text-lg" />
                        ) : (
                          <AiOutlineEye className="text-lg" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-[#ef4444]">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {errors.form && (
                    <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#ef4444]">
                      {errors.form}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 h-10 w-full rounded-lg bg-brand text-sm font-medium text-white transition-all duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Sending OTP…" : "Continue"}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#e4e4e7]" />
                  <span className="text-xs text-[#a1a1aa]">or</span>
                  <div className="h-px flex-1 bg-[#e4e4e7]" />
                </div>

                <p className="text-center text-sm text-[#71717a]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-brand hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-[#a1a1aa]">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms-and-conditions"
              className="underline hover:text-[#71717a]"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy-policy"
              className="underline hover:text-[#71717a]"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </Container>
    </div>
  );
}
