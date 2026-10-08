"use client";
import { useEffect, useState } from "react";
import { ECOM_BASE_URL } from "@/config";
import EcomPricingCard3 from "../../../Cards/EcomPricingCard3";
import spumpLogo from "../../../../assets/logo/spump_logo.png";
import Image from "next/image";
import Container from "@/components/shared/Container";
import EcomTrialCard from "@/components/Cards/EcomTrialCard";

const durations = [
  { id: 0, month: 1, label: "Monthly" },
  { id: 1, month: 12, label: "Yearly" },
];

const currencies = [
  {
    id: "eur",
    label: "Euro",
    symbol: "€",
    icon: (
      <span className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
        €
      </span>
    ),
  },
  {
    id: "spump",
    label: "SPUMP",
    icon: (
      <Image
        width={1000}
        height={1000}
        src="https://scottypumpkin.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fhero.ecd1dcc2.png&w=640&q=75"
        alt=""
        className="size-8 rounded-full"
      />
    ),
  },
  {
    id: "usff",
    label: "USFF",
    icon: (
      <Image
        width={1000}
        height={1000}
        src="https://usfranc.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.bdd0bb3c.webp&w=640&q=100"
        alt=""
        className="size-8 rounded-full"
      />
    ),
  },
  {
    id: "usdc",
    label: "USDC",
    icon: (
      <Image
        width={1000}
        height={1000}
        src="https://assets.coingecko.com/coins/images/6319/small/usdc.png"
        alt=""
        className="size-8 rounded-full"
      />
    ),
  },
];

const NewPricing = ({ pricingSection }) => {
  const [selectedDuration, setSelectedDuration] = useState(1);
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

        {/* 3. Duration toggle */}
        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[10.5px] font-bold uppercase tracking-widest text-custom-gray">
              We accept
            </span>
            {currencies.map((currency) => (
              <div
                key={currency.id}
                title={currency.label}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5"
              >
                <span className="flex *:size-5!">{currency.icon}</span>
                <span className="font-inter text-xs font-semibold text-gray-600">
                  {currency.label}
                </span>
                {(currency.id === "spump" || currency.id === "usff") && (
                  <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold text-brand">
                    −30%
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex w-full rounded-xl border border-gray-200 bg-gray-50 p-1 md:w-auto">
            {durations.map((duration) => (
              <button
                key={duration.id}
                onClick={() => setSelectedDuration(duration.month)}
                className={`flex-1 rounded-lg px-6 py-2 font-inter text-sm font-semibold transition-all duration-200 md:flex-none ${
                  selectedDuration === duration.month
                    ? "bg-brand text-white"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                {duration.label}
              </button>
            ))}
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
        <p className="mt-8 text-center font-inter text-sm text-gray-400">
          No hidden fees. Cancel anytime. Upgrade as you grow.
        </p>
      </Container>
    </section>
  );
};

export default NewPricing;
