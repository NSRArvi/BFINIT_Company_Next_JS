"use client";
import { useEffect, useState } from "react";
import { CreditCard, Landmark, Wallet } from "lucide-react";
import { ECOM_BASE_URL } from "@/config";
import EcomPricingCard3 from "../../../Cards/EcomPricingCard3";
import Image from "next/image";
import Container from "@/components/shared/Container";
import EcomTrialCard from "@/components/Cards/EcomTrialCard";

const durations = [
  { id: 0, month: 1, label: "Monthly" },
  { id: 1, month: 12, label: "Yearly" },
];

const paymentMethods = [
  {
    id: "cards",
    label: "Cards",
    icon: <CreditCard className="size-4 text-brand" strokeWidth={2} />,
  },
  {
    id: "paypal",
    label: "PayPal",
    icon: <Wallet className="size-4 text-brand" strokeWidth={2} />,
  },
  {
    id: "bank",
    label: "Bank transfer",
    icon: <Landmark className="size-4 text-brand" strokeWidth={2} />,
  },
  {
    id: "spump",
    label: "SPUMP",
    icon: (
      <Image
        width={20}
        height={20}
        src="https://scottypumpkin.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fhero.ecd1dcc2.png&w=640&q=75"
        alt="SPUMP"
        className="size-5 rounded-full object-cover"
      />
    ),
  },
  {
    id: "usdc",
    label: "USDC",
    icon: (
      <Image
        width={20}
        height={20}
        src="https://assets.coingecko.com/coins/images/6319/small/usdc.png"
        alt="USDC"
        className="size-5 rounded-full object-cover"
      />
    ),
  },
  {
    id: "usff",
    label: "USFF",
    icon: (
      <Image
        width={20}
        height={20}
        src="https://usfranc.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.bdd0bb3c.webp&w=640&q=100"
        alt="USFF"
        className="size-5 rounded-full object-cover"
      />
    ),
  },
];

const NewPricing = ({ pricingSection }) => {
  const [selectedDuration, setSelectedDuration] = useState(12);
  const [packages, setPackages] = useState([]);

  const trialPackage = packages.find(
    (p) => p.package_type_label?.toLowerCase() === "trial",
  );
  const paidPackages = packages.filter((p) => p !== trialPackage);

  useEffect(() => {
    const fetchPackagesByDuration = async (duration) => {
      try {
        const res = await fetch(
          `${ECOM_BASE_URL}/api/v1/package/get-all/${duration}`,
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setPackages(data.data);
      } catch (error) {
        console.error("Error fetching ecommerce packages data:", error);
      }
    };
    fetchPackagesByDuration(selectedDuration);
  }, [selectedDuration]);

  return (
    <section ref={pricingSection} className="py-10 md:py-20">
      <Container>
        {/* 1. Banner */}
        <div className="relative aspect-[3.54/1] w-full overflow-hidden rounded-xl">
          <Image
            fill
            priority
            sizes="(min-width: 1280px) 1200px, 100vw"
            src="/images/scotty-pumpkin-banner.png"
            alt="Scotty Pumpkin Banner"
            className="object-cover"
          />
        </div>

        {/* 2. Trial (not affected by the toggle) */}
        {trialPackage && (
          <div className="mt-10">
            <p className="mb-3 text-center text-[10.5px] font-bold uppercase tracking-widest text-custom-gray">
              Start free, upgrade as you grow
            </p>
            <EcomTrialCard pack={trialPackage} />
          </div>
        )}

        {/* 3. Pricing */}

        <div className="mt-10 flex flex-col items-center px-4 text-center sm:mt-14">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-dark sm:text-3xl md:text-4xl font-inter">
            Plans and pricing
          </h2>

          <div
            role="group"
            aria-label="Billing cycle"
            className="mt-6 grid w-full max-w-sm grid-cols-2 gap-1 rounded-full bg-slate-100 p-1.5 sm:inline-grid sm:w-auto sm:max-w-none"
          >
            {durations.map((duration) => {
              const isSelected = selectedDuration === duration.month;
              const isYearly = duration.month === 12;

              return (
                <button
                  key={duration.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDuration(duration.month)}
                  className={`inline-flex min-h-11 items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-full px-3 py-2 transition-all duration-200 sm:gap-2.5 sm:px-6 ${
                    isSelected
                      ? "bg-brand text-white shadow-xs"
                      : "text-slate-600 hover:text-dark"
                  }`}
                >
                  <span className="font-inte text-sm font-medium">
                    {duration.label}
                  </span>
                  {isYearly && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors sm:px-3 sm:text-xs ${
                        isSelected
                          ? "border-white/20 bg-white text-brand"
                          : "border-brand/20 bg-white text-brand"
                      }`}
                    >
                      <span className="sm:hidden">30% off</span>
                      <span className="hidden sm:inline">
                        30% off with crypto
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="my-6 flex w-full flex-col items-center gap-3 font-inter text-xs text-slate-500 sm:text-sm md:flex-row md:justify-center md:gap-x-6">
            <span className="text-xs">We accept :</span>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-4 sm:gap-y-2.5">
              {paymentMethods.map((method) => (
                <li
                  key={method.id}
                  className="flex items-center gap-1 whitespace-nowrap"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center *:h-full *:w-full *:object-contain">
                    {method.icon}
                  </span>
                  <span className="text-xs">{method.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. Paid plans */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {paidPackages.slice(0, 4).map((pack) => (
            <EcomPricingCard3
              key={pack.id}
              pack={pack}
              selectedDuration={selectedDuration}
            />
          ))}
        </div>

        {/* 5. We accept */}
        <p className="mt-8 text-center font-inter text-xs text-gray-500">
          No hidden fees. Cancel anytime. Upgrade as you grow.
        </p>
      </Container>
    </section>
  );
};

export default NewPricing;
