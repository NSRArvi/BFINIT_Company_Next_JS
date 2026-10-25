import React, { useState } from "react";
import Link from "next/link";
import { Building2, CreditCard, Bitcoin, Eye, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ECOM_BASE_URL } from "@/config";
import useAuth from "@/hooks/useAuth";
import { handleUnauthorized } from "@/lib/auth";
import RepayStripeDialog from "@/components/modals/RepayStripeDialog";
import toast from "react-hot-toast";

function getPayHref(order, invoice) {
  if (invoice?.status !== "pending" || invoice.payment_method !== "solana") {
    return null;
  }
  return `/checkout/crypto/${order.package?.id}/${order.subscriptionPeriod?.duration}/${invoice.invoice_number}?discount=30`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

const METHODS = {
  bank_transfer: { icon: Building2, label: "Bank" },
  stripe: { icon: CreditCard, label: "Stripe" },
  solana: { icon: Bitcoin, label: "Crypto" },
  trial: { icon: Gift, label: "Free trial" },
};

function PaymentMethod({ method }) {
  const config = METHODS[method];
  if (!config) return <span className="text-sm text-muted-foreground">—</span>;

  const Icon = config.icon;
  return (
    <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon size={14} />
      {config.label}
    </div>
  );
}

function StatusDot({ label, tone, note }) {
  const dot = {
    good: "bg-brand",
    muted: "bg-muted-foreground",
    expired: "bg-red-500",
  }[tone];

  return (
    <div>
      <div className="inline-flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span
          className={`text-sm capitalize ${
            tone === "good" ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      </div>
      {note && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>
      )}
    </div>
  );
}

function getRow(order) {
  const invoice = order.packageInvoice;
  const isTrial = invoice?.payment_method === "trial";

  const base = {
    key: invoice?.id ?? order.id,
    invoiceNumber: invoice?.invoice_number,
    orderedAt: invoice?.created_at ?? order.created_at,
    method: invoice?.payment_method,
    isTrial,
  };

  if (isTrial) {
    const days =
      order.start_at && order.expire_at
        ? Math.round(
            (new Date(order.expire_at) - new Date(order.start_at)) / 86400000,
          )
        : null;
    const expired =
      order.status === "expired" ||
      (order.expire_at && new Date(order.expire_at) < new Date());

    return {
      ...base,
      expired,
      price: days ? `Free · ${days}d` : "Free",
      status: expired
        ? {
            label: "Expired",
            tone: "expired",
            note: `Ended ${formatDate(order.expire_at)}`,
          }
        : {
            label: "Active",
            tone: "good",
            note: `Ends ${formatDate(order.expire_at)}`,
          },
    };
  }

  const settled = invoice?.status === "paid" || invoice?.status === "active";
  return {
    ...base,
    expired: false,
    payHref: getPayHref(order, invoice),
    canRepayStripe:
      invoice?.status === "pending" && invoice?.payment_method === "stripe",
    price: `€${formatAmount(invoice?.payment_amount)}`,
    unit: order.subscriptionPeriod?.duration === 1 ? "month" : "year",
    status: {
      label: invoice?.status ?? "pending",
      tone: settled ? "good" : "muted",
    },
  };
}

export default function OrderTable({ orders = [], onRefresh }) {
  const { token } = useAuth();
  const [payment, setPayment] = useState(null);
  const [repayingId, setRepayingId] = useState(null);
  const rows = orders.map((order) => ({ order, row: getRow(order) }));

  const handleRepay = async (order) => {
    const invoiceNumber = order.packageInvoice.invoice_number;
    setRepayingId(invoiceNumber);
    try {
      const res = await fetch(
        `${ECOM_BASE_URL}/api/v1/package-order/retry-payment/${invoiceNumber}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      handleUnauthorized(res);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not retry payment");
      }
      setPayment(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRepayingId(null);
    }
  };

  const handleVerified = async (paymentIntent, invoiceNumber) => {
    try {
      const res = await fetch(
        `${ECOM_BASE_URL}/api/v1/package-order/payment/verify-stripe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent?.id,
            invoiceNumber,
          }),
        },
      );
      const data = await res.json();
      if (!data?.success) {
        toast.error(data?.message || "Payment verification failed.");
        return;
      }
      setPayment(null);
      toast.success("Payment successful!");
      await onRefresh?.();
    } catch {
      toast.error("Could not verify payment. Please contact support.");
    }
  };

  return (
    <>
      {" "}
      <div className="overflow-x-auto rounded-lg bg-card">
        <Table className="w-full min-w-[800px] table-fixed">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="h-10 w-[14%] text-xs font-medium text-muted-foreground">
                Invoice
              </TableHead>
              <TableHead className="w-[18%] text-xs font-medium text-muted-foreground">
                Package
              </TableHead>
              <TableHead className="w-[13%] text-xs font-medium text-muted-foreground">
                Price
              </TableHead>
              <TableHead className="w-[13%] text-xs font-medium text-muted-foreground">
                Ordered
              </TableHead>
              <TableHead className="w-[13%] text-xs font-medium text-muted-foreground">
                Method
              </TableHead>
              <TableHead className="w-[15%] text-xs font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="w-[14%] text-right text-xs font-medium text-muted-foreground">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length > 0 ? (
              rows.map(({ order, row }) => (
                <TableRow key={row.key} className="hover:bg-muted/40">
                  <TableCell className="truncate py-3.5 font-mono text-sm text-foreground">
                    #{row.invoiceNumber}
                  </TableCell>

                  <TableCell className="truncate text-sm text-foreground">
                    {order.package?.package_name}
                  </TableCell>

                  <TableCell className="truncate">
                    <span className="text-sm font-medium text-foreground">
                      {row.price}
                    </span>
                    {row.unit && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        /{row.unit}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="truncate text-sm text-muted-foreground">
                    {formatDate(row.orderedAt)}
                  </TableCell>

                  <TableCell className="truncate">
                    <PaymentMethod method={row.method} />
                  </TableCell>

                  <TableCell>
                    <StatusDot {...row.status} />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {row.isTrial && row.expired && (
                        <Button
                          asChild
                          size="sm"
                          className="h-8 bg-brand text-xs text-white hover:bg-brand/90"
                        >
                          <Link href="/#pricing">Upgrade</Link>
                        </Button>
                      )}

                      {row.payHref ? (
                        <Button
                          asChild
                          size="sm"
                          className="h-8 bg-brand text-xs text-white hover:bg-brand/90"
                        >
                          <Link href={row.payHref}>Repay</Link>
                        </Button>
                      ) : row.canRepayStripe ? (
                        <Button
                          onClick={() => handleRepay(order)}
                          disabled={repayingId === row.invoiceNumber}
                          size="sm"
                          className="h-8 bg-brand text-xs text-white hover:bg-brand/90"
                        >
                          {repayingId === row.invoiceNumber
                            ? "Loading..."
                            : "Repay"}
                        </Button>
                      ) : (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <Link href={`/my-orders/${row.invoiceNumber}`}>
                            <Eye size={13} />
                            View
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-40 text-center text-sm text-muted-foreground"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <RepayStripeDialog
        payment={payment}
        onClose={() => setPayment(null)}
        onVerified={handleVerified}
      />
    </>
  );
}
