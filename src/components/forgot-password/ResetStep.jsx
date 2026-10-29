"use client";
import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { post } from "@/lib/api";
import { inputClass, primaryBtn } from "./Shared";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

export default function ResetStep({ email, otp, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const clearError = (field) => {
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const emailLc = email.trim().toLowerCase();
    const pwd = password.toLowerCase();

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (!PASSWORD_REGEX.test(password)) {
      newErrors.password =
        "Use 8+ characters with at least one letter and one number.";
    } else if (pwd === emailLc || pwd === emailLc.split("@")[0]) {
      newErrors.password = "Password can't be the same as your email.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    if (loading) return;
    setLoading(true);

    const { ok, error, data } = await post(
      "/api/v1/auth/storeOwner/reset-password",
      {
        email,
        otp_code: otp,
        password,
      },
    );

    setLoading(false);

    if (!ok) {
      setErrors({ form: error || "Could not reset password. Try again." });
      return;
    }

    onSuccess(data);
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#09090b] font-inter">
          Set a new password
        </h1>
        <p className="mt-1.5 text-sm text-[#71717a]">
          Choose a password you haven&apos;t used before
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[#09090b]"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              className={`${inputClass(!!errors.password)} pr-10`}
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
          {errors.password ? (
            <p className="text-xs text-[#ef4444]">{errors.password}</p>
          ) : (
            <p className="text-xs text-[#71717a]">
              At least 8 characters, with a letter and a number.
            </p>
          )}
        </div>

        {/* Confirm password */}
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
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
              className={`${inputClass(!!errors.confirmPassword)} pr-10`}
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
            <p className="text-xs text-[#ef4444]">{errors.confirmPassword}</p>
          )}
        </div>

        {errors.form && (
          <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#ef4444]">
            {errors.form}
          </p>
        )}

        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </>
  );
}
