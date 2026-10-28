import React from 'react';
import { Shield, Globe, Activity, AlertTriangle, Flame, UserCheck, PhoneCall, Mountain } from 'lucide-react';
import { EmergencyCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface EmergencyTypeOption {
  category: EmergencyCategory;
  labelKey: keyof typeof import('../utils/translations').translations['en'];
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_EMERGENCY_TYPES: EmergencyTypeOption[] = [
  { category: 'WOMEN_SAFETY', labelKey: 'womenSafety', icon: Shield },
  { category: 'NATURAL_DISASTER', labelKey: 'naturalDisaster', icon: Globe },
  { category: 'MEDICAL_EMERGENCY', labelKey: 'medicalEmergency', icon: Activity },
  { category: 'ROAD_ACCIDENT', labelKey: 'roadAccident', icon: AlertTriangle },
];

const ADDITIONAL_EMERGENCY_TYPES: EmergencyTypeOption[] = [
  { category: 'FIRE_EMERGENCY', labelKey: 'fireEmergency', icon: Flame },
  { category: 'PERSONAL_SAFETY', labelKey: 'personalSafety', icon: UserCheck },
  { category: 'POLICE_ASSISTANCE', labelKey: 'policeAssistance', icon: PhoneCall },
  { category: 'DISASTER_EMERGENCY', labelKey: 'disasterEmergency', icon: Mountain },
];

interface EmergencyCardProps {
  selectedCategory: EmergencyCategory | null;
  onSelectCategory: (category: EmergencyCategory) => void;
  showAll?: boolean;
}

export const EmergencyCard: React.FC<EmergencyCardProps> = ({
  selectedCategory,
  onSelectCategory,
  showAll = false,
}) => {
  const { t } = useLanguage();

  const options = showAll ? [...PRIMARY_EMERGENCY_TYPES, ...ADDITIONAL_EMERGENCY_TYPES] : PRIMARY_EMERGENCY_TYPES;

  return (
    <div className="grid grid-cols-2 gap-3.5">
      {options.map((item) => {
        const isSelected = selectedCategory === item.category;
        const IconComponent = item.icon;
        const labelText = (t as any)[item.labelKey] || item.category;

        return (
          <button
            key={item.category}
            type="button"
            onClick={() => onSelectCategory(item.category)}
            className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all text-center select-none active:scale-[0.98] ${
              isSelected
                ? 'border-critical-red bg-red-50/50 shadow-sm ring-1 ring-critical-red'
                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl mb-2.5 transition-colors ${
                isSelected ? 'text-critical-red' : 'text-slate-600'
              }`}
            >
              <IconComponent className="w-8 h-8 stroke-[1.75]" />
            </div>

            <span
              className={`text-xs uppercase tracking-wider font-extrabold transition-colors leading-tight ${
                isSelected ? 'text-critical-red font-black' : 'text-slate-700'
              }`}
            >
              {labelText}
            </span>
          </button>
        );
      })}
    </div>
  );
};
