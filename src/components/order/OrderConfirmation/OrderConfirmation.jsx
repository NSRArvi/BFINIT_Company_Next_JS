"use client";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Bitcoin,
  Building2,
  ExternalLink,
  Copy,
  Check,
  CreditCard,
} from "lucide-react";
import logo from "../../../assets/logo/eblogo.png";

import useAuth from "@/hooks/useAuth";
import { ECOM_BASE_URL } from "@/config";
import ErrorView from "./Error";
import OrderConfirmSkeleton from "@/components/skeletons/OrderConfirmSkeleton/OrderConfirmSkeleton";
import formatDate from "@/utils/formatDate";
import formatDateTime from "@/utils/formateDateTime";
import formatCurrency from "@/utils/formatCurrency";
import Container from "@/components/shared/Container";
import Link from "next/link";
import { handleUnauthorized } from "@/lib/auth";
import Image from "next/image";

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

export default function OrderConfirmation({ invoice }) {
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invoice) {
      setError("Missing order information.");
      setLoading(false);
      return;
    }
    if (!token) return; // auth still loading

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${ECOM_BASE_URL}/api/v1/package-order/user-order?invoice_number=${invoice}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );

        handleUnauthorized(res);
        if (!res.ok) throw new Error("Failed to fetch order details");

        const json = await res.json();
        setOrder(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [invoice, token]);

  if (loading) return <OrderConfirmSkeleton />;
  if (error) return <ErrorView message={error} />;
  if (!order) return <ErrorView message="Order not found." />;

  // ── Derived data ──────────────────────────────────────────────────────────

  const pkg = order.package;
  const period = order.subscriptionPeriod;
  const invoices = order.packageInvoice;
  const upgrade = order.packageUpgrade;
  const manual = invoices?.manualPayments?.[0];
  const customer = order.user;

  const method = invoices?.payment_method;
  const isTrial = method === "trial";
  const isBank = method === "bank_transfer";
  const isStripe = method === "stripe";
  const isCrypto = method === "solana";
  const currency = (upgrade?.currency ?? "EUR").toUpperCase();
  const totalPaid = invoices?.payment_amount ?? upgrade?.amount;
  const isSettled = invoices?.status === "paid";

  const trialDays =
    order.start_at && order.expire_at
      ? Math.round(
          (new Date(order.expire_at) - new Date(order.start_at)) / 86400000,
        )
      : null;

  const trialExpired =
    isTrial &&
    (order.status === "expired" ||
      (order.expire_at && new Date(order.expire_at) < new Date()));

  const showPanelCta = isSettled && !trialExpired;

  const headerLabel = isTrial
    ? trialExpired
      ? "Trial expired"
      : "Trial activated"
    : isSettled
      ? "Payment confirmed"
      : "Awaiting confirmation";

  const statusLabel = isTrial
    ? trialExpired
      ? "Expired"
      : "Active"
    : isSettled
      ? "Paid"
      : "Pending";

  const statusGood = isTrial ? !trialExpired : isSettled;

  return (
    <Container>
      <div className="mx-auto min-h-screen max-w-2xl px-4 py-28">
        <div className="rounded-xl border border-border bg-card">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border px-8 py-7">
            <div>
              <Image
                width={1000}
                height={1000}
                src={logo}
                className="h-5 w-auto md:h-6"
                alt="Bfinit Company Logo"
                priority
              />
              <p className="mt-1 text-xs text-muted-foreground">
                8 rue de Dublin, 34200, Sète, France
              </p>
              <div
                className={`mt-3 flex items-center gap-1.5 text-xs font-medium ${
                  trialExpired ? "text-muted-foreground" : "text-brand"
                }`}
              >
                <CheckCircle2 size={13} />
                {headerLabel}
              </div>
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

          {/* Bill to / status */}
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
                  statusGood
                    ? "bg-brand/10 text-brand"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    statusGood ? "bg-brand" : "bg-muted-foreground"
                  }`}
                />
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Line items */}
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
                    {isTrial && trialDays
                      ? `${trialDays} days`
                      : `${period.duration} ${period.duration === 1 ? "mo" : "mos"}`}
                  </td>
                  <td className="py-4 text-right align-top text-sm font-medium text-foreground">
                    {isTrial ? "Free" : formatCurrency(totalPaid, currency)}
                  </td>
                </tr>

                {!isTrial && (
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
                )}
                <tr className={isTrial ? "border-t border-border" : ""}>
                  <td
                    colSpan={2}
                    className="pb-2 pt-2 text-right text-base font-semibold text-foreground"
                  >
                    {isTrial ? "Due today" : "Total"}
                  </td>
                  <td className="pb-2 pt-2 text-right text-base font-semibold text-foreground">
                    {formatCurrency(totalPaid, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Trial period */}
          {isTrial && (
            <div className="border-t border-border px-8 py-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Trial period
              </p>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span className="text-foreground">
                    {formatDate(order.start_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {trialExpired ? "Ended" : "Ends"}
                  </span>
                  <span className="text-foreground">
                    {formatDate(order.expire_at)}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {trialExpired
                  ? "Your trial has ended. Upgrade to a paid plan to keep your store live."
                  : "No payment was taken. Upgrade anytime to keep your store live after the trial ends."}
              </p>
            </div>
          )}

          {/* Payment method (paid orders only) */}
          {!isTrial && (
            <div className="border-t border-border px-8 py-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payment method
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-foreground">
                {isBank && (
                  <>
                    <Building2 size={14} /> <span>Bank Transfer</span>
                  </>
                )}
                {isCrypto && (
                  <>
                    <Bitcoin size={14} /> <span>Crypto</span>
                  </>
                )}
                {isStripe && (
                  <>
                    <CreditCard size={14} /> <span>Stripe</span>
                  </>
                )}
              </div>

              {isBank && manual && (
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Account holder
                    </span>
                    <span className="text-foreground">{manual.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="text-foreground">{manual.bank_name}</span>
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid at</span>
                    <span className="text-foreground">
                      {formatDateTime(manual.payment_at)}
                    </span>
                  </div>
                </div>
              )}

              {!isBank && (
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  {invoices?.sol_amount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount sent</span>
                      <span className="font-mono text-foreground">
                        {parseFloat(invoices.sol_amount).toFixed(4)}
                      </span>
                    </div>
                  )}
                  {invoices?.payment_amount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount sent</span>
                      <span className="font-mono text-foreground">
                        €{parseFloat(invoices.payment_amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid at</span>
                    <span className="text-foreground">
                      {formatDateTime(invoices?.updated_at)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Panel CTA */}
          {showPanelCta && (
            <div className="flex items-center justify-between gap-4 border-t border-border px-8 py-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Your store panel is ready
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Access your store panel at shopadmin.bfinit.com using your
                  BFINIT account.
                </p>
              </div>
              <Link
                href="https://shopadmin.bfinit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open store panel
                <ExternalLink size={12} />
              </Link>
            </div>
          )}

          {/* Expired trial CTA */}
          {trialExpired && (
            <div className="flex items-center justify-between gap-4 border-t border-border px-8 py-6">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Keep your store live
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Choose a plan to continue where you left off.
                </p>
              </div>
              <Link
                href="/#pricing"
                className="inline-flex shrink-0 items-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Upgrade
              </Link>
            </div>
          )}

          {!isSettled && isBank && (
            <div className="flex items-start gap-2.5 border-t border-border bg-muted px-8 py-5">
              <Clock
                size={14}
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Once your bank transfer is approved, sign in to{" "}
                <span className="font-semibold text-foreground">
                  shopadmin.bfinit.com
                </span>{" "}
                with your bfinit.com login.
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
