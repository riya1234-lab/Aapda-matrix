import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { api } from '../services/api';
import { AIClassificationResult, EmergencyCategory } from '../types';
import { useIncident } from '../context/IncidentContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { useBattery } from '../hooks/useBattery';
import { Bot, Send, Sparkles, PhoneCall, ShieldAlert, ArrowLeft } from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { createIncident } = useIncident();
  const { latitude, longitude, accuracy, protocol } = useGeolocation();
  const { level: batteryLevel } = useBattery();

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIClassificationResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const data = await api.classifyEmergency(prompt);
      setResult(data);
    } catch {
      // Deterministic fallback
      setResult({
        category: 'MEDICAL_EMERGENCY',
        priority: 'CRITICAL',
        rationale: 'Reported symptoms indicate possible physiological distress.',
        recommendedActions: [
          'Keep patient seated upright and loosen tight clothing',
          'Call 108 Ambulance immediately',
        ],
        requiresImmediateServices: true,
        suggestedEmergencyNumber: '108',
        isFallback: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerSOS = (category: EmergencyCategory) => {
    createIncident({
      emergencyCategory: category,
      priority: result?.priority || 'HIGH',
      description: prompt,
      latitude,
      longitude,
      locationAccuracy: accuracy,
      locationProtocol: protocol,
      batteryLevel,
    }).then((res) => {
      navigate(`/incidents/${res.incidentId}`);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/home')}
              className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Bot className="w-5 h-5 text-critical-red" />
                <span>AI Emergency Triage</span>
              </h2>
              <p className="text-xs text-slate-500">
                Natural language emergency priority classification & safety guidance
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAnalyze} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Describe Emergency Situation:
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "My father has chest pain and is having difficulty breathing."'
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-critical-red"
            />

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full py-3 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Evaluating Urgency & Hazards...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Analyze Emergency Urgency</span>
                </>
              )}
            </button>
          </form>

          {/* Result Card */}
          {result && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  {result.category.replace('_', ' ')}
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    result.priority === 'CRITICAL'
                      ? 'bg-red-100 text-critical-red'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {result.priority} PRIORITY
                </span>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-medium">
                {result.rationale}
              </p>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Immediate Life-Safety Protocols:
                </span>
                <div className="space-y-1.5">
                  {result.recommendedActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                      <span className="text-critical-red font-bold">•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleTriggerSOS(result.category as EmergencyCategory)}
                  className="py-3 px-3 bg-critical-red hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>ACTIVATE SOS</span>
                </button>

                <a
                  href={`tel:${result.suggestedEmergencyNumber || '112'}`}
                  className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 text-center"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>CALL {result.suggestedEmergencyNumber || '112'}</span>
                </a>
              </div>
            </div>
          )}
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
