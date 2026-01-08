
import React from 'react';
import { X, Gift, Heart, Coffee, Star, Copy, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Nomor disalin ke clipboard!');
  };

  const donateMethods = [
    { name: 'DANA', value: '08123456789', icon: <div className="w-8 h-8 bg-blue-500 rounded-lg" /> },
    { name: 'GOPAY', value: '08123456789', icon: <div className="w-8 h-8 bg-green-500 rounded-lg" /> },
    { name: 'SAWERIA', value: 'saweria.co/dracin', icon: <div className="w-8 h-8 bg-orange-500 rounded-lg" />, isUrl: true },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-brand-dark border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
        
        {/* Header Decor */}
        <div className="h-32 bg-gradient-to-r from-orange-600 to-brand-orange flex items-center justify-center relative">
          <Gift className="h-16 w-16 text-white/20 animate-bounce" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 text-center">
          <h2 className="text-3xl font-black text-white mb-2">Dukungan Kopi ☕</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Setiap dukungan Anda sangat berarti untuk membantu kami membayar sewa server bulanan dan update konten setiap hari.
          </p>

          <div className="space-y-4">
            {donateMethods.map((method) => (
              <div 
                key={method.name}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-brand-orange/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {method.icon}
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{method.name}</p>
                    <p className="text-white font-mono font-bold tracking-wider">{method.value}</p>
                  </div>
                </div>
                
                {method.isUrl ? (
                  <a 
                    href={`https://${method.value}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-brand-orange/20 text-brand-orange rounded-xl hover:bg-brand-orange hover:text-white transition-all"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                ) : (
                  <button 
                    onClick={() => copyToClipboard(method.value)}
                    className="p-3 bg-white/5 text-gray-400 rounded-xl hover:bg-brand-orange hover:text-white transition-all group-hover:bg-brand-orange/20 group-hover:text-brand-orange"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-red-500/10 rounded-full mb-1">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Donatur</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-3 bg-yellow-500/10 rounded-full mb-1">
                <Coffee className="h-5 w-5 text-yellow-500" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Maintain</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-3 bg-blue-500/10 rounded-full mb-1">
                <Star className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Update</span>
            </div>
          </div>

          <Button 
            onClick={onClose}
            className="w-full mt-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-orange/20"
          >
            SAYA SUDAH DONASI
          </Button>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-black/40 text-center">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            Terima kasih atas dukungannya! — SDS TECH
          </p>
        </div>
      </div>
    </div>
  );
};
