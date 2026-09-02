"use client";
import Container from "@/components/shared/Container";
import {
  AlignLeft,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Form() {
  const [countries, setCountries] = useState([]);
  const [captcha, setCaptcha] = useState({
    token: "",
    question: "Loading challenge...",
  });
  const [blockwords, setBlockwords] = useState([]);
  const [disposableDomains, setDisposableDomains] = useState([]);
  const [protectedDomains, setProtectedDomains] = useState([]);
  const [fieldWarnings, setFieldWarnings] = useState({});
  const [formData, setFormData] = useState({
    _captcha_token: "",
    _captcha_answer: "",
    name: "",
    email: "",
    country: "",
    phone: "",
    subject: "",
    message: "",
    _hp_bio_field: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    message: "",
    error: false,
  });
  const [timestamp, setTimestamp] = useState(0);

  useEffect(() => {
    setTimestamp(Date.now());
    // Fetch live form metadata (countries, security captcha & anti-spam rules) from API
    fetch("https://bitssc.bitss.one/api/forms/frm_1354933c6830")
      .then((res) => res.json())
      .then((data) => {
        if (data.form?.blockwords) setBlockwords(data.form.blockwords);
        if (data.form?.disposable_domains)
          setDisposableDomains(data.form.disposable_domains);
        if (data.form?.protected_domains)
          setProtectedDomains(data.form.protected_domains);
        if (data.success && data.form?.countries) {
          setCountries(data.form.countries);
          const defaultCountry =
            data.form.countries.find(
              (c) => c.name === "United States" || c.iso2 === "US",
            ) || data.form.countries[0];
          if (defaultCountry) {
            const dial = defaultCountry.dial_code || "+1";
            const phoneFields = ["phone"];
            setFormData((prev) => {
              const updates = { ...prev };
              if (!prev["country"]) updates["country"] = defaultCountry.name;
              phoneFields.forEach((fId) => {
                if (!prev[fId] || prev[fId].trim() === "")
                  updates[fId] = dial + " ";
              });
              return updates;
            });
          }
        }
        if (data.form?.captcha) {
          setCaptcha(data.form.captcha);
          setFormData((prev) => ({
            ...prev,
            _captcha_token: data.form.captcha.token,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const checkSpamWarning = (fieldName, val) => {
    if (!val || typeof val !== "string") {
      setFieldWarnings((prev) => {
        if (!prev[fieldName]) return prev;
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
      return;
    }
    const cleanVal = val.toLowerCase().trim();
    if (cleanVal.length < 2) {
      setFieldWarnings((prev) => {
        if (!prev[fieldName]) return prev;
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
      return;
    }
    const isEmail = fieldName.toLowerCase().includes("email");
    let matched = null;
    if (isEmail) {
      const atIdx = cleanVal.lastIndexOf("@");
      if (atIdx !== -1) {
        const emailDomain = cleanVal.slice(atIdx + 1).trim();
        const dotIdx = emailDomain.lastIndexOf(".");
        const isComplete = dotIdx > 0 && emailDomain.length - dotIdx - 1 >= 2;
        if (isComplete) {
          const isProtected = protectedDomains.some(
            (p) => emailDomain === p || emailDomain.endsWith("." + p),
          );
          if (!isProtected && disposableDomains.length > 0) {
            const found = disposableDomains.find(
              (d) => emailDomain === d || emailDomain.endsWith("." + d),
            );
            if (found) matched = `Disposable email provider: ${found}`;
          }
        }
      }
    } else {
      if (
        /(?:\[url[=\]]|<a\s+[^>]*href|<\/a>|\[link[=\]]|<script\b)/i.test(
          cleanVal,
        )
      ) {
        matched = "HTML or BBCode link tags";
      } else if (
        /(?:https?:\/\/)?(?:t\.me|telegram\.me|wa\.me|bit\.ly|tinyurl\.com)\/[a-zA-Z0-9_\-\.\/]+/i.test(
          cleanVal,
        )
      ) {
        matched = "Suspicious redirect/messaging link";
      } else if (/(.){6,}/u.test(cleanVal)) {
        matched = "Repetitive character flood";
      }
      if (!matched && blockwords.length > 0) {
        for (let i = 0; i < blockwords.length; i++) {
          const bw = (blockwords[i] || "").toLowerCase().trim();
          if (!bw || bw.length < 2) continue;
          if (bw.startsWith(".")) {
            const escaped = bw.replace(/[.*+?^${\}()|[\]\\]/g, "\\$&");
            const tldRegex = new RegExp(
              "[a-z0-9_-]+" + escaped + "(?=[\\s\\/.,:;?!)\\\"']|$)",
              "i",
            );
            if (tldRegex.test(cleanVal)) {
              matched = blockwords[i];
              break;
            }
          } else {
            const escaped = bw.replace(/[.*+?^${\}()|[\]\\]/g, "\\$&");
            const isWord = /^[a-zA-Z0-9_]+$/.test(bw);
            const wordRegex = isWord
              ? new RegExp(
                  "(?:^|[^a-zA-Z0-9_\\u00C0-\\u024F])" +
                    escaped +
                    "(?=[^a-zA-Z0-9_\\u00C0-\\u024F]|$)",
                  "i",
                )
              : new RegExp(escaped, "i");
            if (wordRegex.test(cleanVal)) {
              matched = blockwords[i];
              break;
            }
          }
        }
      }
    }
    if (matched) {
      setFieldWarnings((prev) => ({
        ...prev,
        [fieldName]: `⚠️ Blocked pattern detected: ${matched}`,
      }));
    } else {
      setFieldWarnings((prev) => {
        if (!prev[fieldName]) return prev;
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    checkSpamWarning(name, value);
  };

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const countryObj = countries.find(
      (c) =>
        c.name?.toLowerCase() === selectedCountry?.toLowerCase() ||
        c.iso2?.toLowerCase() === selectedCountry?.toLowerCase(),
    );
    const dial = countryObj?.dial_code || "+1";
    const phoneFields = ["phone"];
    setFormData((prev) => {
      const updates = {
        ...prev,
        [e.target.name || "country"]: selectedCountry,
      };
      phoneFields.forEach((fId) => {
        const cleanPhone = (prev[fId] || "").trim();
        let newPhone = dial + " ";
        if (cleanPhone.startsWith("+")) {
          const match = cleanPhone.match(/^\+\d+\s*(.*)$/);
          const rest = match ? match[1] : "";
          newPhone = dial + (rest ? " " + rest : " ");
        } else if (cleanPhone) {
          newPhone = dial + " " + cleanPhone;
        }
        updates[fId] = newPhone;
      });
      return updates;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(fieldWarnings).length > 0) {
      setStatus({
        loading: false,
        message:
          "⚠️ Submission blocked: Please remove prohibited words or links from the highlighted fields.",
        error: true,
      });
      return;
    }
    setStatus({ loading: true, message: "", error: false });
    try {
      const res = await fetch(
        "https://bitssc.bitss.one/api/forms/frm_1354933c6830/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            ...formData,
            _bcf_ts: timestamp,
            _client_tz:
              typeof Intl !== "undefined" && Intl.DateTimeFormat
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : "",
          }),
        },
      );
      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }
      if (data && data.captcha) {
        setCaptcha(data.captcha);
        setFormData((prev) => ({
          ...prev,
          _captcha_token: data.captcha.token,
          _captcha_answer: "",
        }));
      }
      if (res.ok && data && data.success) {
        toast.success(data?.message || "Message sent successfully");
        setStatus({
          loading: false,
          message: data.message || "Thank you! Submission received.",
          error: false,
        });
        setFormData({
          _captcha_token: "",
          _captcha_answer: "",
          name: "",
          email: "",
          country: "",
          phone: "",
          subject: "",
          message: "",
          _hp_bio_field: "",
          ...(data && data.captcha
            ? { _captcha_token: data.captcha.token, _captcha_answer: "" }
            : {}),
        });
      } else {
        toast.error(data?.message || "Something went wrong");
        const errMsg =
          data && (data.message || data.error)
            ? data.message || data.error
            : res.status === 429
              ? data?.message ||
                "A message from this email address has already been received recently. Please wait before submitting again."
              : res.status >= 500
                ? `Server Error (${res.status}: ${res.statusText || "Internal Error"})`
                : "Submission failed. Please check form inputs.";
        setStatus({ loading: false, message: errMsg, error: true });
      }
    } catch (err) {
      const connErr =
        err && err.message
          ? `Connection Error: ${err.message}`
          : "Network error. Please try again.";
      setStatus({ loading: false, message: connErr, error: true });
    }
  };

  const fields = [
    {
      id: "name",
      label: "Full Name",
      type: "text",
      icon: User,
      placeholder: "John Smith",
      required: true,
    },
    {
      id: "email",
      label: "Email Address",
      type: "email",
      icon: Mail,
      placeholder: "you@example.com",
      required: true,
    },

    {
      id: "subject",
      label: "Subject / Query",
      type: "text",
      icon: MessageSquare,
      placeholder: "How can we help?",
      required: true,
    },
    {
      id: "country",
      label: "Country",
      type: "select",
      icon: Globe,
      required: true,
      options: countries,
    },
    {
      id: "phone",
      label: "Phone Number",
      type: "tel",
      icon: Phone,
      placeholder: "phone num",
      required: true,
    },
  ];

  const inputBase = (id) =>
    `w-full pl-10 pr-4 py-3 rounded-xl border text-[14px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition-all duration-200 ${
      fieldWarnings[id]
        ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 bg-white focus:border-red-400 focus:ring-red-100"
    }`;
  return (
    <Container>
      <form onSubmit={handleSubmit} className="p-7 sm:p-9 flex flex-col gap-4">
        {fields.map(
          ({ id, label, type, icon: Icon, placeholder, required, options }) => (
            <div key={id} className="flex flex-col gap-1.5">
              <label
                htmlFor={id}
                className="text-[11px] font-bold uppercase tracking-widest text-slate-500"
              >
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Icon
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
                />

                {type === "select" ? (
                  <select
                    id={id}
                    name={id}
                    required={required}
                    value={formData[id] || ""}
                    onChange={handleCountryChange}
                    className={inputBase(id)}
                  >
                    <option value="">-- Select Country --</option>
                    {options.map((c) => (
                      <option key={c.iso2 || c.name} value={c.name}>
                        {c.flag ? `${c.flag} ` : ""}
                        {c.name}
                        {c.dial_code ? ` (${c.dial_code})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    name={id}
                    type={type}
                    required={required}
                    value={formData[id] || ""}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={inputBase(id)}
                  />
                )}
              </div>

              {fieldWarnings[id] && (
                <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                  {fieldWarnings[id]}
                </p>
              )}
            </div>
          ),
        )}

        {/* Message textarea */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="message"
            className="text-[11px] font-bold uppercase tracking-widest text-slate-500"
          >
            Message <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <AlignLeft
              size={15}
              className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none"
            />
            <textarea
              id="message"
              name="message"
              required
              rows={4}
              value={formData.message}
              onChange={handleChange}
              placeholder="Describe your request or question…"
              className={`${inputBase("message")} pl-10 pt-3 resize-none w-full`}
            />
          </div>
          {fieldWarnings["message"] && (
            <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
              {fieldWarnings["message"]}
            </p>
          )}
        </div>

        {/* Dynamic Math CAPTCHA */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Security Check:{" "}
            <strong className="text-red-600 dark:text-red-400">
              {captcha.question}
            </strong>{" "}
            *
          </label>
          <input
            type="hidden"
            name="_captcha_token"
            value={formData._captcha_token || ""}
          />
          <input
            type="text"
            id="_captcha_answer"
            name="_captcha_answer"
            placeholder="Enter answer (e.g. 10 or ten)"
            required
            autoComplete="off"
            value={formData._captcha_answer || ""}
            onChange={handleChange}
            className={`${inputBase("_captcha_answer")} pl-10 pt-3 resize-none w-full`}
          />
          {fieldWarnings["_captcha_answer"] && (
            <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
              {fieldWarnings["_captcha_answer"]}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status?.loading}
          className="mt-2 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-brand/90 hover:bg-brand disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold transition-all duration-200 active:translate-y-0"
        >
          {status.loading ? (
            <>
              <Loader2 size={15} />
              Sending…
            </>
          ) : (
            <>
              <Send size={14} />
              Send Message
            </>
          )}
        </button>

        {/* BITSS Branding Footer */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center font-sans">
          <div className="w-16 h-16 mx-auto relative">
            <Image
              src="https://bitssc.bitss.one/assets/image.png"
              alt="BITSS Cyber Security"
              fill
              className=" object-contain mx-auto"
            />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">
            This form is powered by <strong>BITSS Cyber Security</strong>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} BFIN. BITSS by BFIN. All rights
            reserved.
          </p>
        </div>
      </form>
    </Container>
  );
}
