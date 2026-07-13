"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SalesChartData } from "@/types";

interface SalesChartProps {
  data: SalesChartData[];
  loading?: boolean;
}

function formatRupiahShort(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs">
        <p className="font-semibold mb-2">{label}</p>
        <p className="text-green-400">
          Omset:{" "}
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(payload[0]?.value ?? 0)}
        </p>
        <p className="text-blue-300">
          Transaksi: {payload[1]?.value ?? 0} kali
        </p>
      </div>
    );
  }
  return null;
};

export default function SalesChart({ data, loading }: SalesChartProps) {
  if (loading) {
    return (
      <div className="h-[260px] flex items-center justify-center">
        <div className="animate-pulse text-gray-300 text-sm">Memuat grafik...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-gray-300 text-sm">
        Belum ada data penjualan
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="omset"
          orientation="left"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatRupiahShort}
          width={70}
        />
        <YAxis
          yAxisId="transaksi"
          orientation="right"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          yAxisId="omset"
          type="monotone"
          dataKey="omset"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={{ fill: "#22c55e", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: "#16a34a" }}
        />
        <Line
          yAxisId="transaksi"
          type="monotone"
          dataKey="transaksi"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={{ fill: "#60a5fa", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: "#3b82f6" }}
          strokeDasharray="5 3"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
