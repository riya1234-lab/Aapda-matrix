import React from 'react';
import { PhoneCall } from 'lucide-react';

interface EmergencyCallButtonProps {
  telephoneNumber?: string;
  serviceName?: string;
  variant?: 'primary' | 'warning' | 'outline' | 'success';
  label?: string;
}

export const EmergencyCallButton: React.FC<EmergencyCallButtonProps> = ({
  telephoneNumber = '112',
  serviceName = 'Emergency Helpline',
  variant = 'warning',
  label,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-critical-red hover:bg-red-700 text-white shadow-red-500/20';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20 font-black';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 font-black';
      case 'outline':
        return 'border border-slate-300 hover:bg-slate-100 text-slate-700';
    }
  };

  const cleanNumber = telephoneNumber.replace(/[^0-9+]/g, '');

  return (
    <a
      href={`tel:${cleanNumber}`}
      className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm select-none ${getVariantStyles()}`}
      title={`Direct Call ${cleanNumber}`}
    >
      <PhoneCall className="w-4 h-4 flex-shrink-0 animate-pulse" />
      <span>{label || `Call Direct: ${telephoneNumber} (${serviceName})`}</span>
    </a>
  );
};
