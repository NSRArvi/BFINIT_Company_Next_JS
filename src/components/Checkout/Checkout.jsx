"use client";
import { useEffect, useState } from "react";
import { ECOM_BASE_URL } from "@/config";
import { useParams } from "next/navigation";
import Container from "../shared/Container";
import Heading from "./Heading";
import CheckoutForm from "./CheckoutForm";
import CheckoutSkeleton from "../loader/CheckoutSkeleton";

const currencies = [
  {
    id: "eur",
    label: "Euro",
    icon: "/icons/euro.png",
    discount: null,
  },
  {
    id: "spump",
    label: "SPUMP",
    icon: "/icons/spump.webp",
    discount: 30,
  },
  {
    id: "usff",
    label: "USFF",
    icon: "https://usfranc.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.bdd0bb3c.webp&w=640&q=75",
    discount: 30,
  },
  {
    id: "usdc",
    label: "USDC",
    icon: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
    discount: null,
  },
];

export default function Checkout() {
  const { id, duration } = useParams();
  const [packDetails, setPackDetails] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [loadingPack, setLoadingPack] = useState(true);
  const [loadingBank, setLoadingBank] = useState(true);

  useEffect(() => {
    const fetchPackageDetails = async () => {
      setLoadingPack(true);
      const res = await fetch(
        `${ECOM_BASE_URL}/api/v1/package/get-single/${id}/${duration}`,
      );
      const data = await res.json();
      if (data?.success) setPackDetails(data?.data);
      setLoadingPack(false);
    };
    fetchPackageDetails();
  }, [id, duration]);

  useEffect(() => {
    const fetchBankInfo = async () => {
      setLoadingBank(true);
      const res = await fetch(
        `${ECOM_BASE_URL}/api/v1/platform-bank-payment/get-all`,
      );
      const data = await res.json();
      if (data?.success && data?.data?.length > 0) setBankInfo(data?.data[0]);
      setLoadingBank(false);
    };
    fetchBankInfo();
  }, []);

  const loading = loadingPack || loadingBank;

  let content = null;

  if (loading) {
    content = <CheckoutSkeleton />;
  }

  if (!loading && packDetails?.id) {
    content = (
      <section>
        <CheckoutForm
          details={packDetails}
          currencies={currencies}
          bankInfo={bankInfo}
        />
      </section>
    );
  }

  return (
    <section className="pt-28">
      <Container>
        <Heading currencies={currencies} />
        {content}
      </Container>
    </section>
  );
}
