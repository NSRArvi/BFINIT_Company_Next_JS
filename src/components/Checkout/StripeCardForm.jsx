"use client";
import { useState } from "react";
import { Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "14px",
      fontFamily: "inherit",
      color: "#111827",
      "::placeholder": { color: "#9ca3af" },
      iconColor: "#186BB5",
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
  hidePostalCode: true,
};

export default function StripeCardForm({
  clientSecret,
  orderData,
  onBack,
  onSuccess,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [cardFocused, setCardFocused] = useState(false);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: { card: cardElement },
      },
    );

    if (error) {
      setErrorMsg(error.message);
      setIsProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent);
    } else {
      setIsProcessing(false);
    }
  };

  const amount = orderData?.invoice?.payment_amount;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#186BB5] hover:underline"
      >
        <ArrowLeft size={13} /> Back to order
      </button>

      <div>
        <h3 className="text-xl font-bold text-gray-900">Card Details</h3>
        <p className="mt-1 text-sm text-gray-500">
          Enter your card information to complete the payment.
        </p>
        <hr className="mt-3 border-gray-100" />
      </div>

      <form onSubmit={handleConfirm} className="space-y-5">
        {/* Card input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wide text-gray-700">
            Card Number
          </label>
          <div
            className={`rounded-xl border px-4 py-3.5 transition-all ${
              cardFocused
                ? "border-[#186BB5] ring-2 ring-[#186BB5]/10"
                : "border-gray-200"
            } bg-white`}
          >
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onFocus={() => setCardFocused(true)}
              onBlur={() => setCardFocused(false)}
            />
          </div>
        </div>

        {/* Accepted cards */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400">We accept:</span>
          <div className="flex items-center gap-1.5">
            {["visa", "mastercard", "amex"].map((card) => (
              <span
                key={card}
                className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500"
              >
                {card}
              </span>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Security note */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <ShieldCheck size={14} className="shrink-0 text-green-500" />
          <p className="text-[11px] leading-relaxed text-gray-500">
            Your card details are encrypted and processed securely by Stripe. We
            never store your card information.
          </p>
        </div>

        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#186BB5] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#145fa0] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Lock size={13} />
          {isProcessing
            ? "Processing…"
            : `Pay €${Number(amount || 0).toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
