"use client";
import { useState } from "react";
import { post } from "@/lib/api";
import { inputClass, primaryBtn } from "./Shared";

export default function EmailStep({ initialEmail = "", onSent }) {
  const [email, setEmail] = useState(initialEmail);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = email.trim();

    if (!value) {
      setErrors({ email: "Email is required." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    setErrors({});
    setLoading(true);
    const { ok, error } = await post(
      "/api/v1/auth/storeOwner/forgot-password",
      {
        email: value,
      },
    );
    setLoading(false);

    if (!ok) {
      setErrors({ form: error || "Something went wrong. Try again." });
      return;
    }

    onSent(value);
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#09090b] font-inter">
          Forgot password?
        </h1>
        <p className="mt-1.5 text-sm text-[#71717a]">
          Enter your email and we&apos;ll send you a 6-digit code
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[#09090b]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="alice@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: "" }));
            }}
            className={inputClass(!!errors.email)}
          />
          {errors.email && (
            <p className="text-xs text-[#ef4444]">{errors.email}</p>
          )}
        </div>

        {errors.form && (
          <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#ef4444]">
            {errors.form}
          </p>
        )}

        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? "Sending code…" : "Send code"}
        </button>
      </form>
    </>
  );
}
