"use client";

import { cn } from "@/lib/utils";
import type { FilterPeriod } from "@/lib/hooks/useLaporan";
import { Calendar } from "lucide-react";

interface FilterBarProps {
  period: FilterPeriod;
  onPeriodChange: (p: FilterPeriod) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
  onApply: () => void;
  loading: boolean;
}

const PERIODS: { value: FilterPeriod; label: string }[] = [
  { value: "today", label: "Hari Ini" },
  { value: "7days", label: "7 Hari" },
  { value: "30days", label: "30 Hari" },
  { value: "thismonth", label: "Bulan Ini" },
  { value: "custom", label: "Custom" },
];

export default function FilterBar({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  onApply,
  loading,
}: FilterBarProps) {
  return (
    <div className="card p-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              period === p.value
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {period === "custom" && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => onCustomStartChange(e.target.value)}
              className="text-sm bg-transparent outline-none text-gray-700"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => onCustomEndChange(e.target.value)}
              className="text-sm bg-transparent outline-none text-gray-700"
            />
          </div>
        </div>
      )}

      {/* Apply button */}
      <button
        onClick={onApply}
        disabled={loading}
        className="ml-auto px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        Tampilkan
      </button>
    </div>
  );
}
