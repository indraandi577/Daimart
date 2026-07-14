"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { X, Camera, SwitchCamera } from "lucide-react";
import toast from "react-hot-toast";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraIdx, setCameraIdx] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState("");

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.listVideoInputDevices().then((devices) => {
      setCameras(devices);
      // Prioritaskan kamera belakang
      const backIdx = devices.findIndex((d) =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("belakang")
      );
      setCameraIdx(backIdx >= 0 ? backIdx : 0);
    }).catch(() => {
      toast.error("Tidak bisa mengakses kamera");
    });

    return () => {
      reader.reset();
    };
  }, []);

  useEffect(() => {
    if (!readerRef.current || cameras.length === 0 || !videoRef.current) return;

    const deviceId = cameras[cameraIdx]?.deviceId;
    setScanning(true);

    readerRef.current.decodeFromVideoDevice(
      deviceId,
      videoRef.current,
      (result, err) => {
        if (result) {
          const text = result.getText();
          // Hindari duplikat deteksi dalam 1.5 detik
          if (text !== lastResult) {
            setLastResult(text);
            setTimeout(() => setLastResult(""), 1500);
            onDetected(text);
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          // Abaikan NotFoundException (normal saat belum ada barcode di frame)
        }
      }
    ).catch(() => {
      setScanning(false);
      toast.error("Gagal membuka kamera. Pastikan izin kamera sudah diberikan.");
    });

    return () => {
      readerRef.current?.reset();
      setScanning(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameras, cameraIdx]);

  const switchCamera = () => {
    readerRef.current?.reset();
    setCameraIdx((prev) => (prev + 1) % cameras.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5" />
          <span className="font-semibold text-sm">Scan Barcode</span>
        </div>
        <div className="flex items-center gap-3">
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              title="Ganti kamera"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Overlay viewfinder */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Area gelap di luar kotak scan */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Kotak scan */}
          <div className="relative w-72 h-44 z-10">
            {/* Corner brackets */}
            {[
              "top-0 left-0 border-t-4 border-l-4 rounded-tl-lg",
              "top-0 right-0 border-t-4 border-r-4 rounded-tr-lg",
              "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-lg",
              "bottom-0 right-0 border-b-4 border-r-4 rounded-br-lg",
            ].map((cls, i) => (
              <div
                key={i}
                className={`absolute w-8 h-8 border-green-400 ${cls}`}
              />
            ))}

            {/* Garis scan animasi */}
            {scanning && (
              <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400 shadow-lg shadow-green-400/50 animate-scan-line" />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-black/80 text-center">
        <p className="text-white/70 text-sm">
          Arahkan kamera ke barcode produk
        </p>
        <p className="text-white/40 text-xs mt-1">
          {cameras[cameraIdx]?.label || "Kamera aktif"}
        </p>
      </div>
    </div>
  );
}
