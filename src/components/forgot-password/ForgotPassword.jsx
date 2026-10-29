"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Container from "@/components/shared/Container";
import EmailStep from "./EmailStep";
import OtpStep from "./OtpStep";
import ResetStep from "./ResetStep";

const STEPS = ["email", "otp", "reset"];

export default function ForgotPassword({ initialEmail }) {
  const [step, setStep] = useState("email"); // "email" | "otp" | "reset"
  const [email, setEmail] = useState(initialEmail || "");
  const [otp, setOtp] = useState(""); // verified code, sent again with the reset call
  const router = useRouter();

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="flex min-h-screen items-center bg-[#f8f9fa] pb-16 pt-24">
      <Container>
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-[#e4e4e7] bg-white px-8 py-10 shadow-sm">
            {/* Step indicator */}
            <div className="mb-6 flex items-center justify-center gap-2">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === stepIndex
                      ? "w-6 bg-brand"
                      : i < stepIndex
                        ? "w-1.5 bg-brand"
                        : "w-1.5 bg-[#e4e4e7]"
                  }`}
                />
              ))}
            </div>

            {step === "email" && (
              <EmailStep
                initialEmail={email}
                onSent={(sentEmail) => {
                  setEmail(sentEmail);
                  setStep("otp");
                }}
              />
            )}

            {step === "otp" && (
              <OtpStep
                email={email}
                onVerified={(code) => {
                  setOtp(code);
                  setStep("reset");
                }}
                onBack={() => setStep("email")}
              />
            )}

            {step === "reset" && (
              <ResetStep
                email={email}
                otp={otp}
                onSuccess={() => router.push("/login?reset=1")}
              />
            )}

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#e4e4e7]" />
              <span className="text-xs text-[#a1a1aa]">or</span>
              <div className="h-px flex-1 bg-[#e4e4e7]" />
            </div>

            <p className="text-center text-sm text-[#71717a]">
              Remembered it?{" "}
              <Link
                href="/login"
                className="font-medium text-brand hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
