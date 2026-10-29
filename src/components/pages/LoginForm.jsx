import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/shared/Container";
import { post } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

export default function LoginForm() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { saveAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const validate = () => {
    const newErrors = {};
    if (!form.email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!form.password) {
      newErrors.password = "Password is required.";
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      email: form.email,
      password: form.password,
    };

    setLoading(true);
    const { data, ok, error } = await post("/api/v1/auth/login", payload);
    setLoading(false);
    if (!ok) {
      setErrors({ form: error });
      return;
    }

    saveAuth(data?.data);

    const redirect = searchParams.get("redirect") || "/";
    router.push(redirect);
  };

  return (
    <div className="flex min-h-screen items-center bg-[#f8f9fa] pb-16 pt-24">
      <Container>
        <div className="mx-auto w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border border-[#e4e4e7] bg-white px-8 py-10 shadow-sm">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight font-inter text-[#09090b]">
                Welcome back
              </h1>
              <p className="mt-1.5 text-sm text-[#71717a]">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#09090b] placeholder-[#a1a1aa] outline-none transition-all duration-150 focus:ring-2 focus:ring-brand focus:ring-offset-1 ${
                    errors.email
                      ? "border-[#ef4444] focus:ring-[#ef4444]"
                      : "border-[#e4e4e7] hover:border-[#a1a1aa]"
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-[#ef4444]">{errors.email}</p>
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
                    className={`h-10 w-full rounded-lg border bg-white px-3 pr-10 text-sm text-[#09090b] placeholder-[#a1a1aa] outline-none transition-all duration-150 focus:ring-2 focus:ring-brand focus:ring-offset-1 ${
                      errors.password
                        ? "border-[#ef4444] focus:ring-[#ef4444]"
                        : "border-[#e4e4e7] hover:border-[#a1a1aa]"
                    }`}
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
                  <p className="text-xs text-[#ef4444]">{errors.password}</p>
                )}
              </div>

              {/* Forgot password */}
              <div className="-mt-2 flex justify-end">
                <Link
                  href={
                    form.email.trim()
                      ? `/forgot-password?email=${encodeURIComponent(
                          form.email.trim(),
                        )}`
                      : "/forgot-password"
                  }
                  className="text-xs text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Form-level error */}
              {errors.form && (
                <p className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#ef4444]">
                  {errors.form}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-lg bg-brand text-sm font-medium text-white transition-all duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#e4e4e7]" />
              <span className="text-xs text-[#a1a1aa]">or</span>
              <div className="h-px flex-1 bg-[#e4e4e7]" />
            </div>

            {/* Sign up link */}
            <p className="text-center text-sm text-[#71717a]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-brand hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-[#a1a1aa]">
            By signing in, you agree to our{" "}
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
