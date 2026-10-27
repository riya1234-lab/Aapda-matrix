import React, { useState } from 'react';
import { PhoneCall, AlertCircle, X, Check } from 'lucide-react';

interface EmergencyCallButtonProps {
  telephoneNumber?: string;
  serviceName?: string;
  variant?: 'primary' | 'warning' | 'outline';
  label?: string;
}

export const EmergencyCallButton: React.FC<EmergencyCallButtonProps> = ({
  telephoneNumber = '112',
  serviceName = 'National Emergency Helpline',
  variant = 'warning',
  label,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-critical-red hover:bg-red-700 text-white shadow-red-500/20';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20 font-black';
      case 'outline':
        return 'border border-slate-300 hover:bg-slate-100 text-slate-700';
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${telephoneNumber}`;
    setShowConfirm(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm ${getVariantStyles()}`}
      >
        <PhoneCall className="w-4 h-4" />
        <span>{label || `Call ${telephoneNumber} (${serviceName})`}</span>
      </button>

      {/* Confirmation Modal Safeguard */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-amber-100 text-amber-700">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">Confirm Emergency Call</h4>
                <p className="text-xs text-slate-500">{serviceName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              You are about to initiate a priority telephone call to <strong className="text-slate-900">{telephoneNumber}</strong>. Your native phone dialer will open immediately.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCall}
                className="py-2.5 px-3 rounded-xl bg-critical-red hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Call Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
