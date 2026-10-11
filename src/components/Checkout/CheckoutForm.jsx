"use client";
import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PersonalInfo from "./PersonalInfo";
import StripeCardForm from "./StripeCardForm";
import OrderDetails from "./OrderDetails";
import { ECOM_BASE_URL, STRIPE_PUBLISHABLE_KEY } from "@/config";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import OrderDetailsSkeleton from "../skeletons/OrderDetailsSkeleton/OrderDetailsSkeleton";
import toast from "react-hot-toast";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function CheckoutForm({ details, currencies, bankInfo }) {
  const navigate = useRouter();
  const { token, loading, logout } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [slipFile, setSlipFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currencyId, setCurrencyId] = useState(currencies[0]?.id ?? "eur");
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

  const isCryptoCurrencySelected = selectedCurrency?.id !== "eur";

  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState(null);

  const [formData, setFormData] = useState({
    sender_name: "",
    account_no: "",
    bank_name: "",
    branch: "",
    phone: "",
    transaction_id: "",
    payment_at: "",
    terms: false,
  });

  const buildPayload = useCallback(() => {
    const { id, pricing } = details;
    const {
      subscription_period_id,
      duration,
      total_base_price,
      offer_percentage,
      discount_amount,
    } = pricing;

    const payload = new FormData();
    payload.append("package_id", id);
    payload.append("subscription_period_id", subscription_period_id);
    payload.append("currency", "eur");
    payload.append("duration", duration);

    if (isCryptoCurrencySelected) {
      // Crypto: only send the required fields + solana payment method
      payload.append("payment_method", "solana");
    } else {
      // EUR: full payload with amount, discounts, and bank/stripe fields
      const hasOffer = offer_percentage != null && offer_percentage > 0;
      const offerDiscount = hasOffer
        ? parseFloat(((total_base_price * offer_percentage) / 100).toFixed(2))
        : 0;
      const amount = parseFloat((total_base_price - offerDiscount).toFixed(2));

      payload.append("amount", amount);
      payload.append(
        "payment_method",
        paymentMethod === "bank" ? "bank_transfer" : "stripe",
      );

      if (offerDiscount > 0) {
        payload.append("discount_amount", offerDiscount);
        payload.append("discount_type", "percentage");
      } else if (discount_amount > 0) {
        payload.append("discount_amount", discount_amount);
        payload.append("discount_type", "fixed");
      }

      if (paymentMethod === "bank") {
        const manual = {
          name: formData.sender_name,
          account_no: formData.account_no,
          bank_name: formData.bank_name,
          branch: formData.branch,
          phone: formData.phone,
          ...(formData.transaction_id && {
            transaction_id: formData.transaction_id,
          }),
          payment_at: formData.payment_at
            ? new Date(formData.payment_at).toISOString()
            : undefined,
        };
        payload.append("manual_payment", JSON.stringify(manual));
        if (slipFile) payload.append("document", slipFile);
      }
    }

    return payload;
  }, [details, paymentMethod, formData, slipFile, isCryptoCurrencySelected]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!details) return;

    const payload = buildPayload();

    try {
      setIsSubmitting(true);
      const res = await fetch(
        `${ECOM_BASE_URL}/api/v1/package-order/create-order`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: payload,
        },
      );

      const data = await res.json();

      if (data?.success) {
        toast.success("Order created successfully!");
      } else {
        toast.error(
          data?.message || "Failed to create order. Please try again.",
        );
      }

      if (data?.success) {
        if (isCryptoCurrencySelected) {
          const invoice_number = data.data.invoice.invoice_number;
          const discountParam = selectedCurrency?.discount
            ? `?discount=${selectedCurrency.discount}`
            : "";
          navigate.push(
            `/checkout/crypto/${details.id}/${details.pricing.duration}/${invoice_number}${discountParam}`,
          );
        } else if (paymentMethod === "stripe") {
          const { client_secret } = data.data;
          if (client_secret) {
            setPendingOrderData(data.data);
            setStripeClientSecret(client_secret);
          } else {
            console.error("No client_secret in response");
          }
        } else if (paymentMethod === "bank") {
          const invoice_number = data.data.invoice.invoice_number;
          navigate.push(`/order-confirmation/${invoice_number}`);
        }
      } else {
        console.error("Order failed:", data);
        if (
          data?.success === false &&
          (data?.message === "Your account not found. Please log in again." ||
            data?.message ===
              "Your account is inactive. Please contact support.")
        ) {
          logout();
          navigate.push("/login");
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeSuccess = () => {
    const invoice_number = pendingOrderData.invoice.invoice_number;
    navigate.push(`/order-confirmation/${invoice_number}`);
  };

  const handleBack = () => {
    setStripeClientSecret(null);
    setPendingOrderData(null);
  };

  if (stripeClientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: stripeClientSecret,
          appearance: { theme: "none" },
        }}
      >
        <div className="grid grid-cols-1 gap-8 py-16 md:grid-cols-2">
          <StripeCardForm
            clientSecret={stripeClientSecret}
            orderData={pendingOrderData}
            onBack={handleBack}
            onSuccess={handleStripeSuccess}
          />

          {loading ? (
            <OrderDetailsSkeleton />
          ) : (
            <OrderDetails
              details={details}
              onPaymentChange={setPaymentMethod}
              paymentMethod={paymentMethod}
              currencies={currencies}
              bankInfo={bankInfo}
              currencyId={currencyId}
              onCurrencyChange={setCurrencyId}
              isSubmitting={false}
              readOnly
            />
          )}
        </div>
      </Elements>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={`flex flex-col-reverse gap-8 py-16 ${
          isCryptoCurrencySelected ? "md:flex-col items-center" : "md:flex-row"
        }`}
      >
        {!isCryptoCurrencySelected && (
          <PersonalInfo
            paymentMethod={paymentMethod}
            formData={formData}
            setFormData={setFormData}
            slipFile={slipFile}
            setSlipFile={setSlipFile}
          />
        )}
        {loading ? (
          <OrderDetailsSkeleton />
        ) : (
          <OrderDetails
            details={details}
            onPaymentChange={setPaymentMethod}
            paymentMethod={paymentMethod}
            currencies={currencies}
            bankInfo={bankInfo}
            currencyId={currencyId}
            onCurrencyChange={setCurrencyId}
            isSubmitting={isSubmitting}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            isCryptoCurrencySelected={isCryptoCurrencySelected}
          />
        )}
      </div>
    </form>
  );
}
