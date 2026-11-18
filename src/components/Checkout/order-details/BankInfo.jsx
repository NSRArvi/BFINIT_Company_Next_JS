"use client";
import { useEffect, useState } from "react";
import { CheckCheck, Copy, Landmark } from "lucide-react";
import { ECOM_BASE_URL } from "@/config";
import useAuth from "@/hooks/useAuth";
import { handleUnauthorized } from "@/lib/auth";

const FIELD_CONFIG = [
  { key: "account_name", label: "ACCOUNT NAME" },
  { key: "account_number", label: "ACCOUNT NUMBER" },
  { key: "iban", label: "IBAN" },
  { key: "routing_number", label: "ROUTING NUMBER" },
  { key: "swift_code", label: "SWIFT / BIC" },
];

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8FADC8]">
          {label}
        </p>
        <p className="truncate text-xs font-semibold text-[#0F1F2E]">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-lg p-1.5 text-[#8FADC8] hover:bg-[#F4F7FB] hover:text-[#186BB5]"
      >
        {copied ? (
          <CheckCheck size={13} className="text-green-500" />
        ) : (
          <Copy size={13} />
        )}
      </button>
    </div>
  );
}

function BankCard({ bank }) {
  const fields = FIELD_CONFIG.filter((f) => bank[f.key]);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Landmark className="size-4 text-muted-foreground" />
        {bank.bank_name}
      </div>
      {fields.map((f) => (
        <CopyField key={f.key} label={f.label} value={bank[f.key]} />
      ))}
    </div>
  );
}

export default function BankInfo() {
  const { token } = useAuth();
  const [loadingBank, setLoadingBank] = useState(true);
  const [bankInfo, setBankInfo] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const fetchBankInfo = async () => {
    setLoadingBank(true);
    try {
      const res = await fetch(
        `${ECOM_BASE_URL}/api/v1/platform-bank-payment/get-all`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      handleUnauthorized(res);
      if (!res.ok) throw new Error("Failed to fetch bank info");

      const data = await res.json();
      if (data?.success && data?.data?.length > 0) {
        const active = data.data.filter((b) => b.is_active);
        setBankInfo(active);
        setActiveId(active[0]?.id ?? null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBank(false);
    }
  };

  useEffect(() => {
    fetchBankInfo();
  }, []);

  const activeBank = bankInfo.find((b) => b.id === activeId);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-[#4A6580]">
        Transfer the exact total to the bank below, then upload your slip.
      </p>

      {bankInfo.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {bankInfo.map((bank) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => setActiveId(bank.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activeId === bank.id
                  ? "border-[#186BB5] bg-[#186BB5] text-white"
                  : "border-[#D6E2EE] bg-white text-[#4A6580] hover:bg-[#F4F7FB]"
              }`}
            >
              {bank.country}
            </button>
          ))}
        </div>
      )}

      {activeBank && <BankCard bank={activeBank} />}
    </div>
  );
}
