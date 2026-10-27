import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

export interface AIClassificationResult {
  category: string;
  disasterSubtype?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
  recommendedActions: string[];
  requiresImmediateServices: boolean;
  suggestedEmergencyNumber: string;
  isFallback: boolean;
}

export class AIService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      } catch (e) {
        console.warn('Failed to initialize Google GenAI SDK, using fallback:', e);
      }
    }
  }

  public async classifyEmergency(text: string): Promise<AIClassificationResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return this.localFallbackClassifier('Emergency assistance requested');
    }

    // Try Google Gemini if configured
    if (this.genAI && config.geminiApiKey) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI Service Timeout')), 4500)
        );

        const aiPromise = this.callGemini(trimmed);
        const result = await Promise.race([aiPromise, timeoutPromise]);
        return result;
      } catch (err) {
        console.warn('Gemini AI classification failed or timed out, activating local rule-based fallback:', err);
        return this.localFallbackClassifier(trimmed);
      }
    }

    // Default to instant deterministic local fallback
    return this.localFallbackClassifier(trimmed);
  }

  private async callGemini(userInput: string): Promise<AIClassificationResult> {
    if (!this.genAI) throw new Error('GenAI not initialized');

    const prompt = `
You are the AAPDA MATRIX Emergency Triage AI Engine.
Analyze the following distress or emergency message and classify it into triage priority and response category.

USER DISTRESS INPUT:
"${userInput}"

RULES:
- Do NOT diagnose medical diseases. Only evaluate urgency, life threat, and immediate hazard.
- Priority MUST be one of: "CRITICAL", "HIGH", "MEDIUM", "LOW".
  * CRITICAL: Immediate threat to life, airway compromise, severe bleed, entrapment in disaster/fire, unconsciousness, violent assault.
  * HIGH: Severe injury, expanding structural danger, rising water, bone fractures.
  * MEDIUM: Urgent situation needing assistance but not immediate death risk.
  * LOW: Informational or general assistance.
- Category MUST be one of: "MEDICAL_EMERGENCY", "FIRE_EMERGENCY", "ROAD_ACCIDENT", "WOMEN_SAFETY", "NATURAL_DISASTER", "POLICE_ASSISTANCE", "DISASTER_EMERGENCY", "OTHER".
- If disaster, disasterSubtype can be: "FLOOD", "EARTHQUAKE", "LANDSLIDE", "CYCLONE", "FIRE", "BUILDING_COLLAPSE", "INDUSTRIAL_ACCIDENT", "EXTREME_WEATHER", "OTHER".
- suggestedEmergencyNumber: "112" (Unified), "108" (Medical), "101" (Fire), "100" (Police), "1091" (Women Safety), "1070" (Disaster).

Respond ONLY with valid JSON in this exact structure:
{
  "category": "MEDICAL_EMERGENCY",
  "disasterSubtype": null,
  "priority": "CRITICAL",
  "rationale": "Breathing difficulty and chest pain indicate acute cardiovascular emergency requiring rapid medical intervention.",
  "recommendedActions": [
    "Keep patient seated in an upright position",
    "Loosen tight clothing around neck and chest",
    "Keep airway open and monitor breathing continuously"
  ],
  "requiresImmediateServices": true,
  "suggestedEmergencyNumber": "108"
}
`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const response = await model.generateContent(prompt);
    const responseText = response.response.text() || '';
    const parsed = JSON.parse(responseText);

    return {
      category: parsed.category || 'OTHER',
      disasterSubtype: parsed.disasterSubtype || undefined,
      priority: parsed.priority || 'HIGH',
      rationale: parsed.rationale || 'Categorized via emergency priority guidelines.',
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : ['Stay calm and move to safe ground'],
      requiresImmediateServices: parsed.requiresImmediateServices ?? true,
      suggestedEmergencyNumber: parsed.suggestedEmergencyNumber || '112',
      isFallback: false,
    };
  }

  public localFallbackClassifier(rawText: string): AIClassificationResult {
    const text = rawText.toLowerCase();

    // 1. Critical Medical (Heart attack, breathing, stroke, severe bleeding, unconscious)
    if (
      text.includes('chest pain') ||
      text.includes('breathing') ||
      text.includes('breath') ||
      text.includes('heart attack') ||
      text.includes('unconscious') ||
      text.includes('stroke') ||
      text.includes('bleeding heavily') ||
      text.includes('severe bleed') ||
      text.includes('choking') ||
      text.includes('seizure') ||
      text.includes('snake bite') ||
      text.includes('poison')
    ) {
      return {
        category: 'MEDICAL_EMERGENCY',
        priority: 'CRITICAL',
        rationale: 'Reported symptoms indicate possible immediate life-threatening physiological distress requiring rapid medical resuscitation.',
        recommendedActions: [
          'Keep patient seated upright and loosen tight collar or clothing',
          'Do NOT give solid food or liquids to an unconscious or choking person',
          'Stay on the line with 108 / 112 emergency dispatchers',
          'Ensure clear access for incoming ambulance team',
        ],
        requiresImmediateServices: true,
        suggestedEmergencyNumber: '108',
        isFallback: true,
      };
    }

    // 2. Fire Emergency
    if (
      text.includes('fire') ||
      text.includes('smoke') ||
      text.includes('gas leak') ||
      text.includes('cylinder blast') ||
      text.includes('flame') ||
      text.includes('burning')
    ) {
      const isCritical = text.includes('trapped') || text.includes('huge') || text.includes('gas leak') || text.includes('blast');
      return {
        category: 'FIRE_EMERGENCY',
        disasterSubtype: 'FIRE',
        priority: isCritical ? 'CRITICAL' : 'HIGH',
        rationale: 'Active fire or hazardous combustion detected. Immediate evacuation and fire suppression required.',
        recommendedActions: [
          'Evacuate immediately to an open area away from structure',
          'Stay low to avoid toxic smoke and heated gases',
          'Do NOT use elevators; use designated stairwells',
          'Turn off main gas valve if safely accessible without entering smoke',
        ],
        requiresImmediateServices: true,
        suggestedEmergencyNumber: '101',
        isFallback: true,
      };
    }

    // 3. Women Safety & Harassment
    if (
      text.includes('stalk') ||
      text.includes('follow') ||
      text.includes('attack') ||
      text.includes('harass') ||
      text.includes('unsafe') ||
      text.includes('women') ||
      text.includes('girl') ||
      text.includes('molest') ||
      text.includes('threat')
    ) {
      return {
        category: 'WOMEN_SAFETY',
        priority: 'CRITICAL',
        rationale: 'Personal safety threat detected. Rapid police interception and protective response initiated.',
        recommendedActions: [
          'Move toward well-lit public or populated commercial areas immediately',
          'Keep phone volume on and location broadcast enabled',
          'Trigger SOS beacon so command center and nearby responders are alerted',
          'Contact Women Safety Helpline 1091 or 112',
        ],
        requiresImmediateServices: true,
        suggestedEmergencyNumber: '1091',
        isFallback: true,
      };
    }

    // 4. Road Accident
    if (
      text.includes('accident') ||
      text.includes('crash') ||
      text.includes('hit and run') ||
      text.includes('vehicle') ||
      text.includes('car') ||
      text.includes('bike') ||
      text.includes('highway') ||
      text.includes('pedestrian')
    ) {
      const isTrapped = text.includes('trapped') || text.includes('crush') || text.includes('unconscious');
      return {
        category: 'ROAD_ACCIDENT',
        priority: isTrapped ? 'CRITICAL' : 'HIGH',
        rationale: 'Motor vehicle collision reported. Requires roadside trauma triage and traffic safety clearance.',
        recommendedActions: [
          'Turn on hazard lights and place warning triangles to alert oncoming traffic',
          'Do not move seriously injured patients unless direct fire risk exists',
          'Check for responsiveness and stem bleeding with clean pressure cloth',
          'Keep roadway perimeter clear for emergency rescue vehicles',
        ],
        requiresImmediateServices: true,
        suggestedEmergencyNumber: '112',
        isFallback: true,
      };
    }

    // 5. Landslide
    if (text.includes('landslide') || text.includes('mudslide') || text.includes('debris') || text.includes('mountain')) {
      return {
        category: 'NATURAL_DISASTER',
        disasterSubtype: 'LANDSLIDE',
        priority: 'CRITICAL',
        rationale: 'Mass soil and boulder movement reported. Extreme danger of secondary collapses.',
        recommendedActions: [
          'Move away from the path of the slide or steep slope immediately',
          'Seek shelter in sturdy structure or behind strong trees if escape is blocked',
          'Listen for unusual rumbling sounds or snapping trees',
          'Report exact road kilometer stone or GPS coordinates to SAR teams',
        ],
        requiresImmediateServices: true,
        suggestedEmergencyNumber: '1070',
        isFallback: true,
      };
    }

    // 6. Flood
    if (text.includes('flood') || text.includes('water rising') || text.includes('drown') || text.includes('submerged') || text.includes('river')) {
      return {
        category: 'NATURAL_DISASTER',
        disasterSubtype: 'FLOOD',
        priority: 'CRITICAL',
        rationale: 'Rising floodwaters posing imminent risk of entrapment or drowning.',
        recommendedActions: [
          'Move immediately to higher ground or upper floor of reinforced building',
          'Do not walk, swim, or drive through moving water',
          'Disconnect electricity and gas main switches before water reaches them',
          'Signal your position using flashlight, bright cloth, or audio beacon',
        ],
        requiresImmediateServices: true,
        suggestedEmergencyNumber: '1070',
        isFallback: true,
      };
    }

    // 7. Earthquake / Collapse
    if (text.includes('earthquake') || text.includes('quake') || text.includes('tremor') || text.includes('collapse') || text.includes('rubble')) {
      return {
        category: 'DISASTER_EMERGENCY',
        disasterSubtype: text.includes('collapse') ? 'BUILDING_COLLAPSE' : 'EARTHQUAKE',
        priority: 'CRITICAL',
        rationale: 'Structural collapse or seismic shaking with hazard of falling debris and entrapment.',
        recommendedActions: [
          'DROP, COVER, and HOLD ON under heavy furniture or sturdy interior wall',
          'Stay away from windows, outer walls, and unanchored overhead objects',
          'If trapped, tap on a pipe or wall so rescuers can locate audio pulses',
          'Do not light matches or flick electrical switches due to possible gas leaks',
        ],
        requiresImmediateServices: true,
        suggestedEmergencyNumber: '1070',
        isFallback: true,
      };
    }

    // 8. General Emergency fallback
    return {
      category: 'OTHER',
      priority: 'HIGH',
      rationale: 'Emergency alert registered. Priority dispatcher notified for immediate response.',
      recommendedActions: [
        'Keep phone active and maintain GPS location broadcast',
        'Stay in a secure location and await operator acknowledgement',
        'Directly dial 112 if condition worsens',
      ],
      requiresImmediateServices: true,
      suggestedEmergencyNumber: '112',
      isFallback: true,
    };
  }
}

export const aiService = new AIService();
