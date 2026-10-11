"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, ChevronUp } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const PREVIEW_COUNT = 6;

export default function EcomTrialCard({ pack }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const {
    id,
    package_type_label,
    package_name,
    short_description,
    description = [],
    subscription_periods,
  } = pack;

  const period = subscription_periods?.[0];
  const months = period?.duration ?? 1;
  const termLabel = `Free for ${months * 30} days`;
  const price = Number(period?.price ?? 0).toFixed(2);

  const hiddenCount = description.length - PREVIEW_COUNT;
  const hasMore = hiddenCount > 0;
  const visible = open ? description : description.slice(0, PREVIEW_COUNT);

  const checkoutPath = `/checkout/packages/${id}/${months}`;
  const buyingUrl = isAuthenticated
    ? checkoutPath
    : `/login?redirect=${encodeURIComponent(checkoutPath)}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-softGray bg-white">
      <div className="flex flex-col md:flex-row">
        {/* left */}
        <div className="flex-1 p-5 md:p-7">
          <p className="mb-1 text-[10.5px] font-bold uppercase tracking-widest text-brand">
            {package_type_label}
          </p>
          <h3 className="text-lg font-bold text-dark">{package_name}</h3>

          <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-600">
            {short_description}
          </p>

          <hr className="my-4 border-softGray" />

          <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-widest text-custom-gray">
            What&apos;s included
          </p>

          <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {visible.map((d) => (
              <li key={d} className="flex items-start gap-2.5">
                <Check
                  size={14}
                  strokeWidth={2.5}
                  className="mt-0.5 shrink-0 text-brand"
                />
                <span className="text-xs leading-relaxed text-gray-600">
                  {d}
                </span>
              </li>
            ))}
          </ul>

          {hasMore && (
            <button
              onClick={() => setOpen((p) => !p)}
              aria-expanded={open}
              className="mt-3 flex items-center gap-1.5 py-1.5 text-[11px] font-semibold text-brand hover:underline"
            >
              {open ? "Show less" : `+${hiddenCount} more features`}
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* right panel */}
        <div className="flex flex-col border-t border-dashed border-white/20 bg-dark p-5 md:w-72 md:border-l md:border-t-0 md:p-7">
          {/* price + CTA, centered in the leftover space */}
          <div className="flex flex-1 flex-col justify-center">
            <p className="mb-1 text-[10.5px] font-bold uppercase tracking-widest text-white/70">
              {termLabel}
            </p>

            <div className="flex items-end gap-0.5 text-white">
              <span className="mb-1.5 text-base font-semibold">€</span>
              <span className="text-[42px] font-extrabold leading-none">
                {price}
              </span>
            </div>

            <Link
              href={buyingUrl}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-sm font-bold text-dark transition-colors hover:bg-white/90"
            >
              Start free trial <ArrowRight size={14} />
            </Link>
          </div>

          <p className=" text-[11px] text-white/60">No credit card required</p>
        </div>
      </div>
    </div>
  );
}
