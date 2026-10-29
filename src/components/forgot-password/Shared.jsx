export const inputClass = (hasError) =>
  `h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#09090b] placeholder-[#a1a1aa] outline-none transition-all duration-150 focus:ring-2 focus:ring-brand focus:ring-offset-1 ${
    hasError
      ? "border-[#ef4444] focus:ring-[#ef4444]"
      : "border-[#e4e4e7] hover:border-[#a1a1aa]"
  }`;

export const primaryBtn =
  "mt-1 h-10 w-full rounded-lg bg-brand text-sm font-medium text-white transition-all duration-150 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
