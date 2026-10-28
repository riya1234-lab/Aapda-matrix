import React, { useState } from 'react';
import { Bot, X, Send, PhoneCall, AlertTriangle, ShieldAlert, Sparkles, Mic } from 'lucide-react';
import { api } from '../services/api';
import { AIClassificationResult, EmergencyCategory } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onActivateSosWithAI: (category: EmergencyCategory, description: string, priority: any) => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  isOpen,
  onClose,
  onActivateSosWithAI,
}) => {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIClassificationResult | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      const data = await api.classifyEmergency(inputText);
      setResult(data);
    } catch {
      // Direct local fallback in case of complete client offline
      const mockFallback: AIClassificationResult = {
        category: 'MEDICAL_EMERGENCY',
        priority: 'CRITICAL',
        rationale: 'Reported symptoms indicate possible physiological distress.',
        recommendedActions: [
          'Keep patient seated upright and loosen tight clothing',
          'Call 108 Ambulance immediately',
          'Broadcast SOS location to local rescue units',
        ],
        requiresImmediateServices: true,
        suggestedEmergencyNumber: '108',
        isFallback: true,
      };
      setResult(mockFallback);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-600 text-white animate-pulse';
      case 'HIGH':
        return 'bg-amber-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                <span>AAPDA MATRIX AI TRIAGE</span>
                <span className="text-[10px] bg-red-500/30 text-red-300 font-bold px-1.5 py-0.2 rounded border border-red-500/40">
                  REAL-TIME
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Emergency assessment & immediate safety guidance</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Preset quick prompt examples */}
          {!result && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Example Emergency Situations:</p>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setInputText('My father has severe chest pain and difficulty breathing')}
                  className="text-left text-xs bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-slate-700 transition-colors"
                >
                  "My father has severe chest pain and difficulty breathing"
                </button>
                <button
                  type="button"
                  onClick={() => setInputText('There is a fire in my kitchen and thick black smoke')}
                  className="text-left text-xs bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-slate-700 transition-colors"
                >
                  "There is a fire in my kitchen and thick black smoke"
                </button>
                <button
                  type="button"
                  onClick={() => setInputText('Landslide blocked highway, 4 people trapped near mountain')}
                  className="text-left text-xs bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-slate-700 transition-colors"
                >
                  "Landslide blocked highway, 4 people trapped near mountain"
                </button>
              </div>
            </div>
          )}

          {/* Classification Output Card */}
          {result && (
            <div className="space-y-3.5 bg-slate-50 border border-slate-200 p-4 rounded-2xl animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  {result.category.replace('_', ' ')}
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${getPriorityBadgeClass(result.priority)}`}>
                  {result.priority} PRIORITY
                </span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100">
                {result.rationale}
              </p>

              {/* Recommended Actions */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Life-Saving Immediate Steps:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {result.recommendedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-critical-red font-bold">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onActivateSosWithAI(result.category as EmergencyCategory, inputText, result.priority);
                    onClose();
                  }}
                  className="py-3 px-3 bg-critical-red hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 transition-all"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>ACTIVATE SOS</span>
                </button>

                <a
                  href={`tel:${result.suggestedEmergencyNumber || '112'}`}
                  className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-center"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>CALL {result.suggestedEmergencyNumber || '112'}</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Input Form Footer */}
        <form onSubmit={handleAnalyze} className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.aiPlaceholder}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-sm active:scale-95"
            title="Analyze"
          >
            {isLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
