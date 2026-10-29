/**
 * AAPDA MATRIX — Centralized Disaster Category & Severity Configuration
 * 
 * Use this file as the single source of truth for:
 * - Which emergency categories are natural disasters (enables voice recording)
 * - Disaster-specific severity assessment rules
 * - Severity rationale for Command Center triage records
 */

export type DisasterSeverity = 'CRITICAL' | 'HIGH';

export interface SeverityAssessment {
  severity: DisasterSeverity;
  rationale: string;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  criticalIndicatorsFound: string[];
}

// ─── Natural Disaster Categories ──────────────────────────────────────────────
// Voice recording is ONLY available for these categories.

export const NATURAL_DISASTER_EMERGENCY_CATEGORIES = new Set([
  'NATURAL_DISASTER',
  'DISASTER_EMERGENCY',
]);

/**
 * Returns true if the given EmergencyCategory is a natural disaster.
 * Voice recording, disaster-specific severity, and disaster navigation
 * are all gated on this check.
 */
export function isNaturalDisasterCategory(category: string): boolean {
  return NATURAL_DISASTER_EMERGENCY_CATEGORIES.has(category);
}

// ─── Natural Disaster Subtypes ─────────────────────────────────────────────────
// These are the disaster subtypes that have voice recording and severity rules.

export const NATURAL_DISASTER_SUBTYPES = new Set([
  'FLOOD',
  'EARTHQUAKE',
  'LANDSLIDE',
  'CYCLONE',
  'TSUNAMI',
  'FIRE',           // Wildfire / disaster-scale fire (not routine structural fire)
  'BUILDING_COLLAPSE',
  'EXTREME_WEATHER',
  'OTHER',
]);

// ─── Critical Indicator Keywords ───────────────────────────────────────────────
// Used by the client-side pre-assessment to flag likely CRITICAL incidents.
// The backend re-validates with its own engine before storing.

const CRITICAL_KEYWORDS_UNIVERSAL = [
  'trapped', 'buried', 'swept', 'drowning', 'unconscious', 'unconscious',
  'collapse', 'collapsed', 'bleeding', 'critical', 'dying', 'dead', 'no escape',
  'cannot escape', 'cannot move', 'stuck', 'rescue', 'mayday',
];

// ─── Per-Disaster Critical Keyword Sets ────────────────────────────────────────

const CRITICAL_KEYWORDS_BY_SUBTYPE: Record<string, string[]> = {
  FLOOD: [
    'water rising', 'submerged', 'swept away', 'roof', 'second floor',
    'cut off', 'drowning', 'can\'t swim', 'flood rising fast',
  ],
  EARTHQUAKE: [
    'building collapse', 'rubble', 'debris', 'gas leak', 'fire after quake',
    'aftershock', 'wall fell', 'ceiling fell', 'trapped under',
  ],
  LANDSLIDE: [
    'buried', 'mudslide', 'rocks falling', 'slope moving', 'road blocked',
    'car buried', 'house buried',
  ],
  CYCLONE: [
    'roof blown', 'wall down', 'wind tearing', 'cannot leave', 'tree fell',
    'power line', 'flooding inside',
  ],
  TSUNAMI: [
    'wave coming', 'ocean receding', 'wave', 'coastal flooding', 'sea water',
    'cannot evacuate', 'warning siren',
  ],
  FIRE: [
    'fire spreading fast', 'surrounded by fire', 'smoke inhalation', 'no exit',
    'children inside', 'trapped by fire', 'wildfire approaching',
  ],
  BUILDING_COLLAPSE: [
    'fell on me', 'concrete on', 'pinned', 'structure cracking', 'pillar broke',
    'floor gave', 'ceiling collapsed',
  ],
  EXTREME_WEATHER: [
    'lightning struck', 'struck by lightning', 'flash flood', 'hail', 'zero visibility',
    'road washed', 'bridge washed',
  ],
};

// ─── Client-Side Pre-Assessment ────────────────────────────────────────────────
// This is used on the frontend to provide an initial severity estimate to the
// backend. The backend re-validates this with its own deterministic engine.
// This does NOT delay SOS creation — it runs synchronously.

/**
 * Assess the severity of a natural disaster incident based on available evidence.
 *
 * Rules:
 *  - CRITICAL: universal critical keywords OR subtype-specific critical keywords found in description
 *  - HIGH: natural disaster reported without explicit critical indicators
 *
 * Never returns MEDIUM or LOW for natural disasters.
 */
export function assessDisasterSeverity(
  disasterSubtype: string,
  description: string,
  trappedCount?: number | null,
): SeverityAssessment {
  const desc = (description || '').toLowerCase();
  const subtype = (disasterSubtype || 'OTHER').toUpperCase();

  const criticalIndicatorsFound: string[] = [];

  // Check universal critical keywords
  for (const keyword of CRITICAL_KEYWORDS_UNIVERSAL) {
    if (desc.includes(keyword)) {
      criticalIndicatorsFound.push(keyword);
    }
  }

  // Check subtype-specific critical keywords
  const subtypeKeywords = CRITICAL_KEYWORDS_BY_SUBTYPE[subtype] || [];
  for (const keyword of subtypeKeywords) {
    if (desc.includes(keyword) && !criticalIndicatorsFound.includes(keyword)) {
      criticalIndicatorsFound.push(keyword);
    }
  }

  // Trapped count is a strong critical indicator
  if (trappedCount && trappedCount > 0) {
    criticalIndicatorsFound.push(`${trappedCount} person(s) reported trapped`);
  }

  const isCritical = criticalIndicatorsFound.length > 0;

  if (isCritical) {
    return {
      severity: 'CRITICAL',
      rationale: `CRITICAL indicators detected: ${criticalIndicatorsFound.join(', ')}. Immediate life-safety threat confirmed.`,
      confidence: criticalIndicatorsFound.length >= 2 ? 'HIGH' : 'MODERATE',
      criticalIndicatorsFound,
    };
  }

  return {
    severity: 'HIGH',
    rationale: `${subtype} natural disaster SOS reported. No specific CRITICAL indicators found in description; classified HIGH pending operator triage. Conservative policy: operators should escalate if field evidence differs.`,
    confidence: 'MODERATE',
    criticalIndicatorsFound: [],
  };
}
