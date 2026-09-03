"use client";
import { useState, useEffect } from "react";
import { Package, XCircle } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { ECOM_BASE_URL } from "@/config";
import OrderTableSkeleton from "../../skeletons/OrderTableSkeleton/OrderTableSkeleton";
import { useRouter } from "next/navigation";
import Container from "@/components/shared/Container";
import OrderTable from "./OrderTable";
import { handleUnauthorized } from "@/lib/auth";

export default function MyOrders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await fetch(
          `${ECOM_BASE_URL}/api/v1/package-order/user-orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        handleUnauthorized(res);
        if (!res.ok) throw new Error("Failed to fetch orders");

        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
          setMeta(data.meta);
        } else {
          throw new Error(data.message || "Failed to fetch orders");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [token, router, user]);

  return (
    <Container>
      <div className="min-h-screen py-16">
        <div className="py-10">
          {/* Page Header */}
          <div className="pb-6">
            <h1 className="text-xl font-semibold text-foreground">My Orders</h1>
            {meta && !loading && (
              <p className="mt-1 text-sm text-muted-foreground">
                {meta.total} order{meta.total !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          {/* Content */}
          {loading && <OrderTableSkeleton />}

          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-5">
              <XCircle
                size={18}
                className="mt-0.5 shrink-0 text-destructive"
                strokeWidth={2}
              />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Failed to load orders
                </p>
                <p className="mt-0.5 text-xs text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="rounded-lg border border-border bg-card py-16 text-center">
              <Package
                size={32}
                className="mx-auto mb-3 text-muted-foreground"
                strokeWidth={1.5}
              />
              <p className="text-sm font-medium text-foreground">
                No orders yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your subscription orders will appear here.
              </p>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <OrderTable orders={orders} />
          )}
        </div>
      </div>
    </Container>
  );
}
