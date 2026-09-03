"use client";
import { useState, useEffect, useRef } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FiChevronDown } from "react-icons/fi";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { post, get } from "@/lib/api";
import Container from "@/components/shared/Container";
import { useRouter } from "next/navigation";

const SESSION_KEY = "register_pending";
const DEFAULT_COUNTRY = {
  id: 76,
  name: "France",
  short_name: "FRA",
  iso2: "FR",
  country_code: "+33",
  flag_emoji: "🇫🇷",
  currency_code: "EUR",
  currency_name: "Euro",
  abbreviation: "€",
};

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

  // Country code state
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef(null);

  const { saveAuth } = useAuth();
  const navigate = useRouter();

  // Fetch countries once on mount
  useEffect(() => {
    const fetchCountries = async () => {
      const { data, ok } = await get("/api/v1/country");
      if (ok && data?.data?.length) {
        setCountries(data.data);
        // Keep DEFAULT_COUNTRY unless you want to default to the API's first entry:
        // setSelectedCountry(data.data.find((c) => c.iso2 === "US") || data.data[0]);
      }
    };
    fetchCountries();
  }, []);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target)
      ) {
        setCountryOpen(false);
        setCountrySearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        if (parsed.countryCode) {
          setSelectedCountry((prev) => ({
            ...prev,
            country_code: parsed.countryCode,
          }));
        }
        setOtpStep(true);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const filteredCountries = countries.filter((c) => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.country_code.includes(q) ||
      c.iso2.toLowerCase().includes(q)
    );
  });

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

    // Phone is validated separately from the country code now
    if (!form.phone) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^[0-9\s\-().]{4,14}$/.test(form.phone)) {
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

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setCountryOpen(false);
    setCountrySearch("");
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
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
      country_code: selectedCountry.country_code,
      phone: form.phone.replace(/[\s\-().]/g, ""),
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
          countryCode: selectedCountry.country_code,
          password: form.password,
        }),
      );
      setOtpStep(true);
      return;
    }

    // If backend doesn't require OTP, finish immediately
    clearPending();
    saveAuth(data);
    navigate.push("/login");
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
      country_code: pending.countryCode || selectedCountry.country_code,
      phone: (pending.phone || "").replace(/[\s\-().]/g, ""),
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
    navigate.push("/login");
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

                  {/* Phone (with country code) */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="phone"
                      className="text-sm font-medium text-[#09090b]"
                    >
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div
                        className="relative shrink-0"
                        ref={countryDropdownRef}
                      >
                        <button
                          type="button"
                          onClick={() => setCountryOpen((p) => !p)}
                          className="flex h-10 items-center gap-1.5 rounded-lg border border-[#e4e4e7] bg-white px-3 text-sm text-[#09090b] transition-colors hover:border-[#a1a1aa]"
                        >
                          <span className="text-base leading-none">
                            {selectedCountry.flag_emoji}
                          </span>
                          <span>{selectedCountry.country_code}</span>
                          <FiChevronDown className="text-[#71717a]" />
                        </button>

                        {countryOpen && (
                          <div className="absolute left-0 z-20 mt-1 w-64 overflow-hidden rounded-lg border border-[#e4e4e7] bg-white shadow-lg">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Search country or code"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full border-b border-[#e4e4e7] px-3 py-2 text-sm outline-none"
                            />
                            <div className="max-h-56 overflow-y-auto">
                              {filteredCountries.length === 0 && (
                                <p className="px-3 py-2 text-sm text-[#a1a1aa]">
                                  No matches
                                </p>
                              )}
                              {filteredCountries.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectCountry(c)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[#f4f4f5]"
                                >
                                  <span className="text-base leading-none">
                                    {c.flag_emoji}
                                  </span>
                                  <span className="truncate">{c.name}</span>
                                  <span className="ml-auto shrink-0 text-[#71717a]">
                                    {c.country_code}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel-national"
                        placeholder="234 567 890"
                        value={form.phone}
                        onChange={handleChange}
                        className={inputClass("phone")}
                      />
                    </div>
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
