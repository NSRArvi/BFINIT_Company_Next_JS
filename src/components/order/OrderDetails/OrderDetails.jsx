"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Copy, Check, Building2, Bitcoin } from "lucide-react";

import useAuth from "@/hooks/useAuth";
import { ECOM_BASE_URL } from "@/config";
import OrderConfirmSkeleton from "@/components/skeletons/OrderConfirmSkeleton/OrderConfirmSkeleton";
import formatDate from "@/utils/formatDate";
import formatDateTime from "@/utils/formateDateTime";
import formatCurrency from "@/utils/formatCurrency";
import Container from "@/components/shared/Container";

function CopyValue({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 font-mono text-sm text-foreground hover:text-brand transition-colors"
    >
      {value}
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function OrderDetails({ invoice }) {
  const { user, token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  useEffect(() => {
    if (!invoice || !user) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `${ECOM_BASE_URL}/api/v1/package-order/user-order?invoice_number=${invoice}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.message ?? "Fetch failed");
        setOrder(json.data);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [invoice, user, token]);

  if (loading) return <OrderConfirmSkeleton />;

  const pkg = order.package;
  const period = order.subscriptionPeriod;
  const invoices = order.packageInvoice;
  const upgrade = order.packageUpgrade;
  const manual = invoices?.manualPayments?.[0];
  const customer = order.user;

  const isBank = invoices?.payment_method === "bank_transfer";
  const currency = (upgrade?.currency ?? "EUR").toUpperCase();
  const totalPaid = invoices?.payment_amount ?? upgrade?.amount;
  const isSettled = order.status === "active" || invoices?.status === "paid";

  const features = pkg.description ?? [];
  const visibleFeatures = showAllFeatures ? features : features.slice(0, 5);

  return (
    <Container>
      <div className="mx-auto min-h-screen max-w-2xl px-4 py-28">
        <div className="rounded-xl border border-border bg-card">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border px-8 py-7">
            <div>
              <p className="text-lg font-bold text-foreground">eBfinit</p>
              <p className="mt-1 text-xs text-muted-foreground">
                8 rue de Dublin, 34200, Sète, France
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Invoice
              </p>
              <p className="mt-1 font-mono text-sm text-foreground">
                #{invoices?.invoice_number}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(invoices?.created_at)}
              </p>
            </div>
          </div>

          {/* Billed to / status */}
          <div className="grid grid-cols-2 gap-6 border-b border-border px-8 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Billed to
              </p>
              <p className="mt-1.5 text-sm font-medium text-foreground">
                {customer?.name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {customer?.email}
              </p>
              {customer?.phone && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {customer.phone}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <span
                className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                  isSettled
                    ? "bg-brand/10 text-brand"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSettled ? "bg-brand" : "bg-muted-foreground"
                  }`}
                />
                {isSettled ? "Paid" : "Pending"}
              </span>
            </div>
          </div>

          {/* Line item */}
          <div className="px-8 py-6">
            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="w-1/2 pb-3 font-semibold">Item</th>
                  <th className="w-1/4 pb-3 text-right font-semibold">
                    Duration
                  </th>
                  <th className="w-1/4 pb-3 text-right font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="py-4 align-top">
                    <p className="text-sm font-medium text-foreground">
                      {pkg.package_name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pkg.short_description}
                    </p>
                  </td>
                  <td className="py-4 text-right align-top text-sm text-muted-foreground">
                    {period.duration} {period.duration === 1 ? "mo" : "mos"}
                  </td>
                  <td className="py-4 text-right align-top text-sm font-medium text-foreground">
                    {formatCurrency(totalPaid, currency)}
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td
                    colSpan={2}
                    className="py-2 text-right text-sm text-muted-foreground"
                  >
                    Subtotal
                  </td>
                  <td className="py-2 text-right text-sm text-foreground">
                    {formatCurrency(totalPaid, currency)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={2}
                    className="pt-1 pb-2 text-right text-base font-semibold text-foreground"
                  >
                    Total
                  </td>
                  <td className="pt-1 pb-2 text-right text-base font-semibold text-foreground">
                    {formatCurrency(totalPaid, currency)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Subscription range — plain, no fake slider */}
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  Start
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDate(order.start_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  Expires
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDate(order.expire_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="border-t border-border px-8 py-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Payment method
            </p>

            <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
              {isBank ? <Building2 size={14} /> : <Bitcoin size={14} />}
              {isBank ? "Bank Transfer" : "Crypto"}
            </div>

            {isBank && manual && (
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="text-foreground">{manual.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch</span>
                  <span className="text-foreground">{manual.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account no.</span>
                  <CopyValue value={manual.account_no} />
                </div>
                {manual.transaction_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Transaction ID
                    </span>
                    <CopyValue value={manual.transaction_id} />
                  </div>
                )}
              </div>
            )}

            {!isBank && invoices?.sol_amount && (
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Amount sent</span>
                <span className="font-mono text-foreground">
                  {parseFloat(invoices.sol_amount).toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Features — collapsed */}
          {features.length > 0 && (
            <div className="border-t border-border px-8 py-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What&apos;s included
              </p>
              <ul className="mt-3 space-y-1.5">
                {visibleFeatures.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
              {features.length > 5 && (
                <button
                  onClick={() => setShowAllFeatures((v) => !v)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showAllFeatures
                    ? "Show less"
                    : `Show ${features.length - 5} more`}
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${showAllFeatures ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
