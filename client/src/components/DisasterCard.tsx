import React from 'react';
import { DisasterType } from '../types';
import { Waves, Mountain, Flame, Building2, Wind, Factory, CloudLightning, ShieldAlert, AlertCircle } from 'lucide-react';

export interface DisasterItem {
  type: DisasterType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sops: string[];
}

export const DISASTER_DIRECTORY: DisasterItem[] = [
  {
    type: 'LANDSLIDE',
    title: 'Landslide / Mudflow',
    icon: Mountain,
    color: 'from-amber-600 to-amber-800',
    sops: [
      'Evacuate steep slope path immediately; move to stable high ground',
      'Listen for unusual cracking trees or rumbling boulder sounds',
      'Watch for sudden increase or decrease in water flow in mountain streams',
      'Do not cross bridges if water is high and carrying debris',
    ],
  },
  {
    type: 'FLOOD',
    title: 'Flash Flood / Inundation',
    icon: Waves,
    color: 'from-blue-600 to-cyan-700',
    sops: [
      'Climb to roof or top floor of reinforced concrete building',
      'Do not walk or drive through flowing water; 6 inches can knock you down',
      'Disconnect power mains before water reaches electrical sockets',
      'Signal your position using flashlight, whistle, or brightly colored cloth',
    ],
  },
  {
    type: 'EARTHQUAKE',
    title: 'Earthquake / Seismic Shock',
    icon: AlertCircle,
    color: 'from-orange-600 to-red-700',
    sops: [
      'DROP, COVER, and HOLD ON under heavy desk or interior wall',
      'Stay away from glass windows, exterior doors, and hanging fixtures',
      'If trapped, cover mouth with cloth and tap loudly on pipes or walls',
      'Do not use elevators or light matches (gas leak danger)',
    ],
  },
  {
    type: 'BUILDING_COLLAPSE',
    title: 'Building Collapse / Rubble',
    icon: Building2,
    color: 'from-stone-600 to-stone-800',
    sops: [
      'Protect head and chest with arms or sturdy objects',
      'Create an airway pocket and breathe slowly to conserve oxygen',
      'Tap in rhythmic bursts (3 taps) so acoustic SAR sensors locate you',
      'Do not shout unnecessarily to avoid inhaling dust particles',
    ],
  },
  {
    type: 'FIRE',
    title: 'Industrial / Structural Fire',
    icon: Flame,
    color: 'from-red-600 to-amber-600',
    sops: [
      'Crawl low under smoke; toxic carbon monoxide collects near ceilings',
      'Test closed door handles with back of hand before opening',
      'If clothing catches fire: STOP, DROP, and ROLL',
      'Close doors behind you to slow down fire propagation',
    ],
  },
  {
    type: 'CYCLONE',
    title: 'Cyclone / High Storm',
    icon: Wind,
    color: 'from-teal-600 to-emerald-700',
    sops: [
      'Remain indoors in strongest part of house away from glass',
      'Do not venture out during the "eye" of the cyclone; winds reverse abruptly',
      'Store adequate drinking water and non-perishable food',
      'Unplug non-essential appliances to prevent power surge damage',
    ],
  },
  {
    type: 'INDUSTRIAL_ACCIDENT',
    title: 'Chemical / Gas Leak',
    icon: Factory,
    color: 'from-purple-600 to-indigo-800',
    sops: [
      'Move crosswind or upwind immediately from hazardous source',
      'Cover nose and mouth with wet handkerchief or cloth',
      'Seal doors and windows with damp towels if advised to shelter-in-place',
      'Wash eyes and skin with clean running water if irritated',
    ],
  },
  {
    type: 'EXTREME_WEATHER',
    title: 'Cloudburst / Lightning',
    icon: CloudLightning,
    color: 'from-slate-700 to-slate-900',
    sops: [
      'Seek shelter in an enclosed building or all-metal hardtop vehicle',
      'Avoid isolated trees, hilltops, and metal fences',
      'Stay away from gullies and natural drainage ravines',
      'Keep communications devices charged and on battery saver mode',
    ],
  },
  {
    type: 'OTHER',
    title: 'Other Major Emergency',
    icon: ShieldAlert,
    color: 'from-red-700 to-rose-900',
    sops: [
      'Stay calm and broadcast current GPS coordinates via AAPDA MATRIX',
      'Keep phone volume on and monitor Command Center instructions',
      'Assist children, elderly, and mobility-impaired neighbors if safe',
    ],
  },
];

interface DisasterCardProps {
  disaster: DisasterItem;
  isSelected?: boolean;
  onSelect: (type: DisasterType) => void;
}

export const DisasterCard: React.FC<DisasterCardProps> = ({ disaster, isSelected, onSelect }) => {
  const IconComp = disaster.icon;

  return (
    <div
      onClick={() => onSelect(disaster.type)}
      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
        isSelected
          ? 'border-critical-red bg-red-50/60 shadow-md ring-2 ring-critical-red'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${disaster.color} text-white shadow-sm`}>
          <IconComp className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h4 className="font-extrabold text-sm text-slate-900">{disaster.title}</h4>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {disaster.sops.length} Safety Protocols Ready
          </span>
        </div>
      </div>
    </div>
  );
};
