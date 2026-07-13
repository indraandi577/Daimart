"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ChartPoint } from "@/lib/hooks/useLaporan";

interface LaporanChartProps {
  data: ChartPoint[];
  loading?: boolean;
}

function fmtShort(value: number) {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp${(value / 1_000).toFixed(0)}rb`;
  return `Rp${value}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs space-y-1">
      <p className="font-semibold text-gray-300 mb-1">{label}</p>
      <p className="text-green-400">
        Omset: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(payload[0]?.value ?? 0)}
      </p>
      <p className="text-blue-300">Transaksi: {payload[1]?.value ?? 0}x</p>
    </div>
  );
};

export default function LaporanChart({ data, loading }: LaporanChartProps) {
  if (loading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="animate-pulse text-gray-300 text-sm">Memuat grafik...</div>
      </div>
    );
  }
  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center text-gray-300 text-sm">
        Tidak ada data untuk periode ini
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="gradOmset" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradTrx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="omset" orientation="left" tickFormatter={fmtShort} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={72} />
        <YAxis yAxisId="transaksi" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={36} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-gray-500">
              {value === "omset" ? "Omset" : "Transaksi"}
            </span>
          )}
        />
        <Area yAxisId="omset" type="monotone" dataKey="omset" name="omset"
          stroke="#22c55e" strokeWidth={2.5} fill="url(#gradOmset)"
          dot={{ fill: "#22c55e", strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
        <Area yAxisId="transaksi" type="monotone" dataKey="transaksi" name="transaksi"
          stroke="#60a5fa" strokeWidth={2} fill="url(#gradTrx)" strokeDasharray="5 3"
          dot={{ fill: "#60a5fa", strokeWidth: 0, r: 3 }} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
