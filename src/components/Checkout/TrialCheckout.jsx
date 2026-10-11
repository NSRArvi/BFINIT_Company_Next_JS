"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, Clock, Lock } from "lucide-react";
import { ECOM_BASE_URL } from "@/config";
import useAuth from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { handleUnauthorized } from "@/lib/auth";

const PREVIEW_COUNT = 6;

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

function Heading() {
  return (
    <>
      <div className="text-center">
        <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1 font-sora text-[11px] font-semibold tracking-widest text-primary">
          hPanel Order Management
        </span>
        <h2 className="mt-4 font-sora text-3xl font-bold leading-tight text-dark md:text-4xl">
          Start your <span className="text-primary">free trial</span>
        </h2>
        <p className="mt-3 font-sora text-sm text-gray-400">
          No credit card required. Upgrade anytime as you grow.
        </p>
      </div>
      <hr className="my-6 border-gray-200" />
    </>
  );
}

function TrialUnavailable({ reason, usedAt }) {
  const copy =
    reason === "trial_used"
      ? {
          title: "You've already used your free trial",
          text: usedAt
            ? `Your trial was activated on ${fmt(usedAt)}.`
            : "Your trial was already activated on this account.",
        }
      : reason === "has_paid_plan"
        ? {
            title: "You already have an active plan",
            text: "The free trial is only available to new accounts.",
          }
        : {
            title: "You already have an order",
            text: "The free trial is only available to accounts with no previous orders. Check your orders for the status.",
          };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#D6E4F0] bg-white">
      <div className="px-5 py-8 text-center">
        <h3 className="text-lg font-bold text-[#0F1F2E]">{copy.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-[#4A6580]">
          {copy.text}
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Link
            href="/my-orders"
            className="rounded-xl border border-[#D6E4F0] bg-white px-5 py-2.5 text-sm font-bold text-[#186BB5] transition-colors hover:bg-[#F4F7FB]"
          >
            View my orders
          </Link>
          <Link
            href="/bfinit-ecomerce-platform"
            className="rounded-xl bg-[#186BB5] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#145fa0]"
          >
            See plans
          </Link>
        </div>
      </div>
      <div className="border-t border-[#D6E4F0] bg-[#EBF2FA] px-5 py-3">
        <p className="flex items-center justify-center gap-1 text-center text-[11px] text-[#8FADC8]">
          <Lock size={14} /> Secure checkout · Cancel anytime
        </p>
      </div>
    </div>
  );
}

export default function TrialCheckout({ details }) {
  const navigate = useRouter();
  const { token } = useAuth();

  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    const checkEligibility = async () => {
      try {
        const res = await fetch(
          `${ECOM_BASE_URL}/api/v1/package-order/user-orders?page=1&limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
            signal: controller.signal,
          },
        );
        handleUnauthorized(res);
        if (!res.ok) throw new Error("Failed to load orders");

        const json = await res.json();
        const orders = json?.data ?? [];
        const total = json?.meta?.total ?? orders.length;

        if (total === 0) {
          setEligibility({ eligible: true });
          return;
        }

        const trialOrder = orders.find(
          (o) => o.packageInvoice?.payment_method === "trial",
        );
        const hasPaidPlan = orders.some(
          (o) => o.packageInvoice?.status === "paid",
        );

        setEligibility({
          eligible: false,
          reason: trialOrder
            ? "trial_used"
            : hasPaidPlan
              ? "has_paid_plan"
              : "has_order",
          usedAt: trialOrder?.created_at,
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        setEligibility({ eligible: true });
      }
    };

    checkEligibility();
    return () => controller.abort();
  }, [token]);

  const {
    id,
    package_name,
    package_type_label,
    description = [],
    pricing,
    subscription_periods,
  } = details;

  const period = subscription_periods?.[0];
  const months = pricing?.duration ?? period?.duration ?? 1;
  const days = months * 30;
  const periodId = pricing?.subscription_period_id ?? period?.id;
  const total = Number(pricing?.total_base_price ?? period?.price ?? 0).toFixed(
    2,
  );

  const hiddenCount = description.length - PREVIEW_COUNT;
  const visible = showAll ? description : description.slice(0, PREVIEW_COUNT);

  const buildPayload = () => {
    const payload = new FormData();
    payload.append("package_id", id);
    payload.append("subscription_period_id", periodId);
    payload.append("duration", months);
    payload.append("currency", "eur");
    payload.append("amount", 0);
    payload.append("payment_method", "trial");
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${ECOM_BASE_URL}/api/v1/package-order/create-order`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: buildPayload(),
        },
      );

      const data = await res.json();

      if (data?.success) {
        // adjust to wherever create-order returns the invoice number
        const invoiceNumber =
          data?.data?.packageInvoice?.invoice_number ??
          data?.data?.invoice_number;

        toast.success("Your free trial is active!");
        navigate.push(
          invoiceNumber ? `/order-confirmation/${invoiceNumber}` : "/my-orders",
        );
      } else {
        toast.error(
          data?.message || "Failed to start your trial. Please try again.",
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── checking / blocked states ─────────────────────────────────────────────
  if (eligibility === null) {
    return (
      <section className="py-10 md:py-20">
        <div className="mx-auto w-full max-w-xl px-4">
          <Heading />
          <div className="h-96 w-full animate-pulse rounded-xl border border-[#D6E4F0] bg-[#F4F7FB]" />
        </div>
      </section>
    );
  }

  if (!eligibility.eligible) {
    return (
      <section className="py-10 md:py-20">
        <div className="mx-auto w-full max-w-xl px-4">
          <TrialUnavailable
            reason={eligibility.reason}
            usedAt={eligibility.usedAt}
          />
        </div>
      </section>
    );
  }

  // ── eligible: normal form ─────────────────────────────────────────────────
  return (
    <section className="py-10 md:py-20">
      <div className="mx-auto w-full max-w-xl px-4">
        <Heading />

        <form
          onSubmit={handleSubmit}
          className="w-full overflow-hidden rounded-xl border border-[#D6E4F0] bg-white"
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-[#186BB5] px-5 pb-6 pt-5">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -right-2 h-20 w-20 rounded-full bg-white/5" />
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#93c5e8]">
              Order Details
            </p>
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold leading-tight text-white">
                  {package_name}
                </h2>
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  <Clock size={11} /> <span>{days} Days</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold text-white">€{total}</p>
                <p className="mt-0.5 text-[11px] text-[#93c5e8]">
                  {package_type_label}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            {/* What you get */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8FADC8]">
                What you get
              </p>
              <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {visible.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      size={14}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0 text-[#186BB5]"
                    />
                    <span className="text-xs leading-relaxed text-[#4A6580]">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll((p) => !p)}
                  aria-expanded={showAll}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[#186BB5] hover:underline"
                >
                  {showAll ? "Show less" : `+${hiddenCount} more features`}
                  {showAll ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8FADC8]">
                Summary
              </p>
              <div className="divide-y divide-[#D6E4F0] rounded-xl border border-[#D6E4F0] bg-[#F4F7FB]">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-[#4A6580]">
                    {package_type_label} · {days} days
                  </span>
                  <span className="text-xs font-semibold text-[#0F1F2E]">
                    Free
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-[#0F1F2E]">
                    Due today
                  </span>
                  <span className="text-lg font-bold text-[#186BB5]">
                    €{total}
                  </span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-[#4A6580]">
                Your trial ends after {days} days. Upgrade anytime to keep your
                store live.
              </p>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-0.5 accent-[#186BB5]"
              />
              <label
                htmlFor="terms"
                className="text-xs leading-relaxed text-gray-500"
              >
                I have read the{" "}
                <Link
                  href="/terms-and-conditions"
                  className="font-bold text-[#186BB5] underline-offset-2 hover:underline"
                >
                  terms and conditions
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={!agreed || isSubmitting}
              className="w-full rounded-xl bg-[#186BB5] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#145fa0] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Processing…" : "Start Free Trial"}
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-[#D6E4F0] bg-[#EBF2FA] px-5 py-3">
            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-[#8FADC8]">
              <Lock size={14} /> Secure checkout · Cancel anytime
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
