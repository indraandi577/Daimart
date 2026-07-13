"use client";

import Modal from "@/components/ui/Modal";
import { KantinPenitip, KantinSesi, totalPenitip } from "@/lib/hooks/useKantin";
import { formatRupiah } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Printer } from "lucide-react";

interface RekapSesiModalProps {
  sesi: KantinSesi;
  penitips: KantinPenitip[];
  onClose: () => void;
}

export default function RekapSesiModal({ sesi, penitips, onClose }: RekapSesiModalProps) {
  const totalKomisi = penitips.reduce((s, p) => s + totalPenitip(p).komisi_kantin, 0);
  const totalUangPenitip = penitips.reduce((s, p) => s + totalPenitip(p).uang_penitip, 0);
  const totalLaku = penitips.reduce((s, p) => s + totalPenitip(p).total_laku, 0);

  return (
    <Modal isOpen onClose={onClose} title="Rekap Sesi Kantin" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="text-center pb-4 border-b border-dashed border-gray-200">
          <p className="font-bold text-lg">DaiMart — Kantin</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(sesi.tanggal), "EEEE, dd MMMM yyyy", { locale: id })}
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Total Terjual</p>
            <p className="font-bold text-green-700 text-sm mt-1">{formatRupiah(totalLaku)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Omset Kantin</p>
            <p className="font-bold text-amber-600 text-sm mt-1">{formatRupiah(totalKomisi)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500">Bayar ke Penitip</p>
            <p className="font-bold text-blue-700 text-sm mt-1">{formatRupiah(totalUangPenitip)}</p>
          </div>
        </div>

        {/* Per Penitip */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
            Rincian per Penitip
          </h3>
          {penitips.map((penitip) => {
            const tot = totalPenitip(penitip);
            const totalSisa = penitip.snacks.reduce((s, sn) => s + sn.qty_sisa, 0);
            return (
              <div key={penitip.id} className="border border-gray-100 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                  <span className="font-semibold text-gray-800">👤 {penitip.nama}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-700 font-semibold">
                      Dapat: {formatRupiah(tot.uang_penitip)}
                    </span>
                    {totalSisa > 0 && (
                      <span className="text-amber-600">
                        Sisa: {totalSisa} pcs dikembalikan
                      </span>
                    )}
                  </div>
                </div>

                {/* Snack detail */}
                <div className="divide-y divide-gray-50">
                  {penitip.snacks.map((snack) => (
                    <div key={snack.id} className="flex items-center px-4 py-2.5 text-sm">
                      <div className="flex-1">
                        <span className="text-gray-700">{snack.nama_snack}</span>
                        <span className="text-gray-400 ml-2 text-xs">
                          {snack.qty_terjual}/{snack.qty_titip} terjual · {formatRupiah(snack.harga_jual)}/pcs
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-600">{formatRupiah(snack.total_laku)}</span>
                        <span className="text-amber-500">-{formatRupiah(snack.komisi_kantin)}</span>
                        <span className="font-semibold text-gray-800">{formatRupiah(snack.uang_penitip)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer total */}
        <div className="border-t-2 border-dashed border-gray-200 pt-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total uang yang harus dibayarkan ke penitip</span>
            <span className="font-bold text-blue-700">{formatRupiah(totalUangPenitip)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Omset kantin (15% komisi)</span>
            <span className="font-bold text-amber-600">{formatRupiah(totalKomisi)}</span>
          </div>
        </div>

        {/* Print */}
        <button
          onClick={() => window.print()}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Cetak Rekap
        </button>
      </div>
    </Modal>
  );
}
