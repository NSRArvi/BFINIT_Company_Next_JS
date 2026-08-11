import React from "react";
import Link from "next/link";
import { Building2, CreditCard, Bitcoin, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PaymentMethod({ method }) {
  const config = {
    bank_transfer: { icon: Building2, label: "Bank" },
    stripe: { icon: CreditCard, label: "Stripe" },
  }[method] ?? { icon: Bitcoin, label: "Crypto" };

  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon size={14} />
      {config.label}
    </div>
  );
}

function StatusDot({ status }) {
  const isSettled = status === "paid" || status === "active";
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isSettled ? "bg-brand" : "bg-muted-foreground"
        }`}
      />
      <span
        className={`text-sm capitalize ${
          isSettled ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

export default function OrderTable({ orders = [] }) {
  const formattedOrders = orders.map((order) => {
    const amount = Number(order.packageInvoice?.payment_amount);
    return {
      ...order,
      formattedAmount: Number.isInteger(amount) ? amount : amount.toFixed(2),
      duration: order.subscriptionPeriod?.duration === 1 ? "month" : "year",
    };
  });

  return (
    <div className="overflow-x-auto rounded-lg bg-card">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="h-10 w-[14%] text-xs font-medium text-muted-foreground">
              Invoice
            </TableHead>
            <TableHead className="w-[22%] text-xs font-medium text-muted-foreground">
              Package
            </TableHead>
            <TableHead className="w-[14%] text-xs font-medium text-muted-foreground">
              Price
            </TableHead>
            <TableHead className="w-[14%] text-xs font-medium text-muted-foreground">
              Ordered
            </TableHead>
            <TableHead className="w-[12%] text-xs font-medium text-muted-foreground">
              Method
            </TableHead>
            <TableHead className="w-[12%] text-xs font-medium text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="w-[10%] text-right text-xs font-medium text-muted-foreground">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {formattedOrders.length > 0 ? (
            formattedOrders.map((order, index) => (
              <TableRow key={index} className="hover:bg-muted/40">
                <TableCell className="truncate py-3.5 font-mono text-sm text-foreground">
                  #{order.packageInvoice?.invoice_number}
                </TableCell>

                <TableCell className="truncate text-sm text-foreground">
                  {order.package?.package_type}
                </TableCell>

                <TableCell className="truncate">
                  <span className="text-sm font-medium text-foreground">
                    €{order.formattedAmount}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    /{order.duration}
                  </span>
                </TableCell>

                <TableCell className="truncate text-sm text-muted-foreground">
                  {formatDate(order.created_at)}
                </TableCell>

                <TableCell className="truncate">
                  <PaymentMethod
                    method={order.packageInvoice?.payment_method}
                  />
                </TableCell>

                <TableCell className="truncate">
                  <StatusDot status={order.packageInvoice?.status} />
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <Link
                      href={`/my-orders/${order.packageInvoice?.invoice_number}`}
                    >
                      <Eye size={13} />
                      View
                    </Link>
                  </Button>
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
  );
}
