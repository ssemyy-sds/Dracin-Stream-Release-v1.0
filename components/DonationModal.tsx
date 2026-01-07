
import React, { useState, useEffect } from 'react';
import { X, Coffee } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  // Gunakan path absolut standard. Pastikan file "qrcode_sds.png" ada di folder "public" root project.
  const DEFAULT_QR = "/qrcode_sds.png";
  
  // Fallback ke QR Generator jika file lokal benar-benar tidak ada/gagal load
  const FALLBACK_QR = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://dracin.stream&color=000000";

  const [imgSrc, setImgSrc] = useState(DEFAULT_QR);
  const [hasError, setHasError] = useState(false);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
        // Tambahkan timestamp untuk menghindari cache browser menyimpan status 404 sebelumnya
        setImgSrc(`${DEFAULT_QR}?t=${new Date().getTime()}`);
        setHasError(false);
    }
  }, [isOpen]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Jika sudah error sekali (sudah mencoba fallback), jangan loop
    if (hasError) return;
    
    // Switch ke fallback online secara diam-diam tanpa spam console.warn
    setHasError(true);
    setImgSrc(FALLBACK_QR);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[#121212] border border-white/10 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-brand-orange">Traktir Kopi</h2>
            <Coffee className="h-6 w-6 text-brand-orange fill-current" />
          </div>
          <p className="text-gray-300 text-sm">
            Bantu kami agar tetap semangat update konten!
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl mx-auto w-64 h-64 flex items-center justify-center mb-6 shadow-lg shadow-brand-orange/10">
            <img 
              src={imgSrc} 
              alt="QRIS Code SDS" 
              className="w-full h-full object-contain mix-blend-multiply"
              onError={handleImageError}
            />
        </div>

        {/* Footer */}
        <div className="space-y-3">
          <div className="text-xs tracking-[0.2em] text-gray-500 font-mono uppercase">
            Scan QRIS (All E-Wallet)
          </div>
          
          <div className="text-sm text-gray-400 italic">
            "Donasi untuk bayar server & kopi fix bug" ✌️
          </div>
        </div>
      </div>
    </div>
  );
};
