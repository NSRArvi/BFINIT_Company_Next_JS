"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import Container from "@/components/shared/Container";
import Heading from "./Heading";
import OrderDetailsCard from "./OrderDetailsCard";
import TokenBreakDown from "./TokenBreakDown";
import ChooseWallet from "./ChooseWallet";
import { ECOM_BASE_URL } from "@/config";
import { formatTokenAmount } from "@/utils/formatTokenAmount";
import CryptoCheckoutSkeleton from "@/components/skeletons/CryptoCheckoutSkeleton";
import useAuth from "@/hooks/useAuth";

const MINT_ADDRESS = process.env.NEXT_PUBLIC_SPUMP_MINT_ADDRESS;
const RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS;
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT;

export default function CryptoCheckout() {
  const router = useRouter();
  const { packageId, duration: durationQuery, invoice_number } = useParams();
  const { token } = useAuth();

  const [loadingPack, setLoadingPack] = useState(true);
  const [loadinEurToUsd, setLoadingEurToUsd] = useState(true);
  const [loadingTokenPrice, setLoadingTokenPrice] = useState(true);
  const [packDetails, setPackDetails] = useState({});
  const [eurToUsdRate, setEurToUsdRate] = useState(null);
  const [tokenRate, setTokenRate] = useState(null);

  const { pricing } = packDetails;
  const isYearly = pricing?.duration >= 12;
  const originalPrice = pricing?.selected_month_price;
  const discountAmount = isYearly ? originalPrice * 0.3 : 0;
  const subTotalPrice = originalPrice - discountAmount;
  const perMonthPrice = pricing?.base_price;
  const duration = isYearly ? "1 Year" : "1 Month";

  // radium prices
  const subTotalInUSD = eurToUsdRate ? subTotalPrice * eurToUsdRate : null;
  const radiumTotalPrice =
    subTotalInUSD && tokenRate ? subTotalInUSD / tokenRate : null;
  const formattedRadiumPrice = formatTokenAmount(radiumTotalPrice);

  // wallet connection status
  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState(null);

  // crypto payment
  const [txStatus, setTxStatus] = useState(null);
  const [txError, setTxError] = useState(null);
  const [signature, setSignature] = useState(null);

  // fetch package details
  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        const res = await fetch(
          `${ECOM_BASE_URL}/api/v1/package/get-single/${packageId}/${durationQuery}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data?.success) setPackDetails(data?.data);
      } catch (e) {
        console.error("Failed to fetch package details:", e);
      } finally {
        setLoadingPack(false);
      }
    };

    fetchPackageDetails();
  }, [packageId, durationQuery]);

  // fetch eur to usd rate
  useEffect(() => {
    const fetchEurToUsdRate = async () => {
      try {
        const res = await fetch("/api/exchange-rate");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data?.rate) setEurToUsdRate(data?.rate);
      } catch (e) {
        console.error("Failed to fetch eur to usd rate:", e);
      } finally {
        setLoadingEurToUsd(false);
      }
    };

    fetchEurToUsdRate();
  }, []);

  // fetch radium price
  const fetchRadiumPrice = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_RAYDIUM_API_URL}?mints=${process.env.NEXT_PUBLIC_SPUMP_MINT_ADDRESS}`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const price = data?.success
      ? parseFloat(data.data[process.env.NEXT_PUBLIC_SPUMP_MINT_ADDRESS])
      : null;

    if (price === null || isNaN(price))
      throw new Error("Raydium returned no price");
    return price;
  };

  // fetch jupiter price
  const fetchJupiterPrice = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_JUP_API_URL}?ids=${process.env.NEXT_PUBLIC_SPUMP_MINT_ADDRESS}`,
    );
    if (!res.ok) throw new Error(`Jupiter HTTP ${res.status}`);
    const data = await res.json();

    const price = data?.[process.env.NEXT_PUBLIC_SPUMP_MINT_ADDRESS]?.usdPrice;

    if (!price || isNaN(price)) throw new Error("Jupiter returned no price");
    return parseFloat(price);
  };

  // fetch radium price
  useEffect(() => {
    const fetchTokenPrice = async () => {
      try {
        const price = await fetchRadiumPrice();
        setTokenRate(price);
      } catch {
        try {
          const price = await fetchJupiterPrice();
          setTokenRate(price);
        } catch (e) {
          console.error("Both Raydium and Jupiter failed:", e);
        }
      } finally {
        setLoadingTokenPrice(false);
      }
    };

    fetchTokenPrice();
  }, []);

  const connectWallet = async (name) => {
    setWalletError(null);
    try {
      let provider, publicKey;

      if (name === "Phantom") {
        provider = window?.phantom?.solana;
        if (!provider) throw new Error("Phantom not installed");
        if (!provider.isPhantom) throw new Error("Phantom not found");

        const resp = await provider.connect().catch((e) => {
          if (e.code === 4001) throw new Error("Connection rejected");
          if (e.message === "Unexpected error")
            throw new Error("Please unlock your Phantom wallet and try again");
          throw e;
        });
        publicKey = resp.publicKey.toString();
      } else {
        provider = window?.solflare;
        if (!provider?.isSolflare) throw new Error("Solflare not installed");

        await provider.connect().catch((e) => {
          if (e.code === 4001) throw new Error("Connection rejected");
          throw new Error("Please unlock your Solflare wallet and try again");
        });

        await new Promise((r) => setTimeout(r, 100));
        if (!provider.publicKey)
          throw new Error("Solflare: publicKey unavailable");
        publicKey = provider.publicKey.toString();
      }

      setWallet({ provider, publicKey, name });
    } catch (e) {
      setWalletError(e.message ?? `Failed to connect ${name}`);
    }
  };

  const disconnectWallet = async () => {
    try {
      await wallet?.provider?.disconnect();
    } catch {
      console.error("Failed to disconnect wallet");
    }
    setWallet(null);
  };

  const handlePay = async () => {
    if (!wallet || !radiumTotalPrice) return;
    setTxStatus("building");
    setTxError(null);
    setSignature(null);

    try {
      const connection = new Connection(RPC_ENDPOINT, "confirmed");
      const fromPubkey = new PublicKey(wallet.publicKey);
      const toPubkey = new PublicKey(RECEIVER_ADDRESS);
      const mintPubkey = new PublicKey(MINT_ADDRESS);

      const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
      const decimals = mintInfo.value?.data?.parsed?.info?.decimals ?? 6;
      const rawAmount = BigInt(
        Math.round(radiumTotalPrice * Math.pow(10, decimals)),
      );

      const fromATA = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
      const toATA = await getAssociatedTokenAddress(mintPubkey, toPubkey);

      const tx = new Transaction();

      try {
        await getAccount(connection, toATA);
      } catch {
        tx.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey,
            toATA,
            toPubkey,
            mintPubkey,
          ),
        );
      }

      tx.add(createTransferInstruction(fromATA, toATA, fromPubkey, rawAmount));

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPubkey;

      setTxStatus("awaiting");
      const signedTx = await wallet.provider.signTransaction(tx);

      setTxStatus("confirming");
      const sig = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
      });
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      setSignature(sig);

      // verify with backend
      try {
        const res = await fetch(
          `${ECOM_BASE_URL}/api/v1/package-order/payment/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              txSignature: sig,
              invoiceNumber: invoice_number,
              walletAddress: wallet.publicKey,
            }),
          },
        );

        if (!res.ok) throw new Error(`Verify failed: ${res.status}`);
        const data = await res.json();

        if (data?.success && data?.data?.invoiceNumber) {
          setTxStatus("success");
          router.push(`/order-confirmation/${invoice_number}`);
        }
      } catch (verifyErr) {
        console.error("Backend verify failed:", verifyErr);
        setTxError(
          `Payment sent but verification pending. Save your transaction ID: ${sig}`,
        );
      }
    } catch (e) {
      setTxError(e.message ?? "Transaction failed");
      setTxStatus("error");
    }
  };

  const isLoading = loadingPack || loadinEurToUsd || loadingTokenPrice;

  return (
    <main className="py-14 min-h-dvh md:py-28">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: heading */}
          <Heading />

          {/* Right: cards */}
          <div className="space-y-3">
            {isLoading ? (
              <CryptoCheckoutSkeleton />
            ) : (
              <>
                <OrderDetailsCard
                  packDetails={packDetails}
                  perMonthPrice={perMonthPrice}
                  originalPrice={originalPrice}
                  discountAmount={discountAmount}
                  subTotalPrice={subTotalPrice}
                  formattedRadiumPrice={formattedRadiumPrice}
                  isYearly={isYearly}
                  duration={duration}
                  wallet={wallet}
                />
                <TokenBreakDown
                  originalPrice={originalPrice}
                  formattedRadiumPrice={formattedRadiumPrice}
                  tokenRate={tokenRate}
                  isYearly={isYearly}
                />
                <ChooseWallet
                  wallet={wallet}
                  walletError={walletError}
                  onConnect={connectWallet}
                  onDisconnect={disconnectWallet}
                  formattedRadiumPrice={formattedRadiumPrice}
                  onPay={handlePay}
                  txStatus={txStatus}
                  txError={txError}
                  signature={signature}
                />
              </>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
