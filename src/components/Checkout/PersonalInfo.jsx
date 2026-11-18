"use client";
import { useState, useEffect } from "react";
import { UploadCloud, X, ImageIcon, CreditCard, Building2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";

export default function PersonalInfo({
  paymentMethod,
  formData,
  setFormData,
  slipFile,
  setSlipFile,
}) {
  const { user } = useAuth();
  const [slipPreview, setSlipPreview] = useState(null);

  // Pre-fill sender name from auth user on mount / when user loads
  useEffect(() => {
    if (user?.name) {
      setFormData((prev) => ({
        ...prev,
        sender_name: prev.sender_name || user.name,
      }));
    }
  }, [user?.name]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSlipChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSlipFile(file);
    if (file.type.startsWith("image/")) {
      setSlipPreview(URL.createObjectURL(file));
    } else {
      setSlipPreview(null);
    }
  };

  const removeSlip = () => {
    setSlipFile(null);
    setSlipPreview(null);
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#186BB5] focus:ring-2 focus:ring-[#186BB5]/10";

  const labelClass = "text-xs font-semibold text-gray-700 tracking-wide";

  return (
    <div className="space-y-4 w-full">
      {/* Title */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
        <hr className="mt-3 border-gray-100" />
      </div>

      <div className="space-y-4">
        {/* ── Stripe fields ───────────────────────────────────────── */}
        {paymentMethod === "stripe" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <CreditCard
                size={15}
                className="mt-0.5 shrink-0 text-amber-600"
              />
              <p className="text-xs leading-relaxed text-amber-800">
                After placing your order, you&apos;ll complete payment securely
                using your card details in the next step.
              </p>
            </div>
          </div>
        )}

        {/* ── Bank Transfer fields ─────────────────────────────────── */}
        {paymentMethod === "bank" && (
          <div className="space-y-4">
            <div
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              style={{ borderLeftWidth: "3px", borderLeftColor: "#186BB5" }}
            >
              <Building2 size={15} className="mt-0.5 shrink-0 text-[#186BB5]" />
              <p className="text-xs leading-relaxed text-gray-600">
                Transfer the exact amount shown in the order summary, then fill
                in your transfer details and upload your payment slip below.
              </p>
            </div>

            {/* Sender / Account Holder Name — pre-filled from auth */}
            <div className="space-y-1.5">
              <label className={labelClass}>
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sender_name"
                value={formData.sender_name ?? ""}
                onChange={handleChange}
                placeholder="Name on your bank account"
                required
                className={inputClass}
              />
              {user?.name && formData.sender_name === user.name && (
                <p className="text-[11px] text-gray-400">
                  Pre-filled from your profile — edit if your bank account name
                  differs.
                </p>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <label className={labelClass}>
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="account_no"
                value={formData.account_no ?? ""}
                onChange={handleChange}
                placeholder="Enter account number"
                required
                className={inputClass}
              />
            </div>

            {/* Bank Name */}
            <div className="space-y-1.5">
              <label className={labelClass}>
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="bank_name"
                value={formData.bank_name ?? ""}
                onChange={handleChange}
                placeholder="Enter bank name"
                required
                className={inputClass}
              />
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <label className={labelClass}>
                Branch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch ?? ""}
                onChange={handleChange}
                placeholder="Enter branch name"
                required
                className={inputClass}
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className={labelClass}>
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone ?? ""}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
                className={inputClass}
              />
            </div>

            {/* Transaction / Reference ID */}
            <div className="space-y-1.5">
              <label className={labelClass}>
                Transaction / Reference ID{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="transaction_id"
                value={formData.transaction_id ?? ""}
                onChange={handleChange}
                placeholder="Enter transaction or reference ID"
                required
                className={inputClass}
              />
            </div>

            {/* Payment Date & Time */}
            <div className="space-y-1.5">
              <label className={labelClass}>
                Select payment Date &amp; Time{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="payment_at"
                value={formData.payment_at ?? ""}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Payment Slip Upload */}
            <div className="space-y-1.5">
              <label className={labelClass}>
                Payment Slip <span className="text-red-500">*</span>
              </label>
              <p className="-mt-0.5 text-[11px] text-gray-400">
                Upload your bank transfer receipt or payment confirmation
                screenshot.
              </p>
              {!slipFile ? (
                <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 transition-all hover:border-[#186BB5]/40 hover:bg-gray-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-all group-hover:shadow-md">
                    <UploadCloud
                      size={22}
                      className="text-gray-400 transition-colors group-hover:text-[#186BB5]"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">
                      Click to upload slip
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      JPG, PNG, PDF up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleSlipChange}
                    required
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {slipPreview ? (
                    <Image
                      width={1000}
                      height={1000}
                      src={slipPreview}
                      alt="Payment slip"
                      className="max-h-52 w-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex items-center justify-center px-4 py-8 text-sm text-gray-500">
                      PDF selected — no preview available
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-gray-100 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={14} className="text-gray-400" />
                      <span className="max-w-45 truncate text-xs font-semibold text-gray-700">
                        {slipFile?.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeSlip}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-red-500 transition-colors hover:bg-red-50"
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Terms */}
        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            name="terms"
            checked={formData.terms}
            onChange={handleChange}
            required
            className="mt-0.5 accent-[#186BB5]"
          />
          <label
            htmlFor="terms"
            className="text-xs leading-relaxed text-gray-500"
          >
            I have read the{" "}
            <Link
              href="/terms"
              className="font-bold text-[#186BB5] underline-offset-2 hover:underline"
            >
              terms and conditions
            </Link>
          </label>
        </div>
      </div>
    </div>
  );
}
