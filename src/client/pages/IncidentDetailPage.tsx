import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { AudioPlayer } from '../components/AudioPlayer';
import { IncidentMap } from '../components/IncidentMap';
import { api } from '../services/api';
import { Incident } from '../types';
import { ArrowLeft, Clock, ShieldCheck, MapPin, Truck, Radio, CheckCircle, AlertTriangle } from 'lucide-react';
import { getSocket } from '../services/socket';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    api.getIncidentById(id).then((data) => {
      setIncident(data);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    const socket = getSocket();
    socket.emit('join:incident', id);

    const handleUpdate = (updated: Incident) => {
      if (updated.id === id) {
        setIncident(updated);
      }
    };

    socket.on('incident:updated', handleUpdate);

    return () => {
      socket.off('incident:updated', handleUpdate);
    };
  }, [id]);

  const STATUS_STEPS = ['PENDING', 'ACKNOWLEDGED', 'DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED'];

  const getCurrentStepIndex = () => {
    if (!incident) return 0;
    const idx = STATUS_STEPS.indexOf(incident.status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <button
            onClick={() => navigate('/incidents')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Incidents</span>
          </button>

          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-slate-500">
              Loading incident details...
            </div>
          ) : !incident ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="font-extrabold text-sm text-slate-800">Incident Not Found</h4>
              <p className="text-xs text-slate-500">Could not retrieve incident {id}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Incident Header Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-slate-900">
                    {incident.id}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      incident.priority === 'CRITICAL'
                        ? 'bg-red-100 text-critical-red animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {incident.priority} PRIORITY
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                    {incident.emergencyCategory.replace('_', ' ')}{' '}
                    {incident.disasterSubtype ? `(${incident.disasterSubtype})` : ''}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {incident.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-t border-slate-100 pt-3">
                  <span>🔋 {incident.batteryLevel || 70}% Battery</span>
                  <span>📡 {incident.communicationMethod}</span>
                  <span>{new Date(incident.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Status Progression Timeline */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Rescue Response Timeline
                </h4>

                <div className="relative flex items-center justify-between pt-2">
                  <div className="absolute top-4 left-2 right-2 h-0.5 bg-slate-200 -z-0" />
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx <= getCurrentStepIndex();
                    const isCurrent = idx === getCurrentStepIndex();

                    return (
                      <div key={step} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors ${
                            isCurrent
                              ? 'bg-critical-red text-white ring-4 ring-red-100 animate-pulse'
                              : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-tighter">
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Tactical Map for Coordinates */}
              {incident.latitude && incident.longitude && (
                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-sm">
                  <div className="px-4 py-2.5 bg-slate-900 text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-critical-red" />
                      <span>VICTIM COORDINATES</span>
                    </span>
                    <span>{incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</span>
                  </div>

                  <div className="h-48 w-full">
                    <IncidentMap
                      incidents={[incident]}
                      selectedIncidentId={incident.id}
                      heightClass="h-48"
                    />
                  </div>
                </div>
              )}

              {/* Audio Playback if attached */}
              {incident.attachments && incident.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Emergency Audio Log
                  </span>
                  <AudioPlayer
                    src={api.getAudioStreamUrl(incident.id, incident.attachments[0].id)}
                    durationSeconds={incident.attachments[0].durationSeconds || 5}
                  />
                </div>
              )}

              {/* Assigned Response Unit */}
              {incident.responseTeam && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-brand-blue font-black text-xs uppercase tracking-wider">
                    <Truck className="w-4 h-4" />
                    <span>Assigned Tactical Unit</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    {incident.responseTeam.teamName}
                  </h4>
                  <p className="text-xs text-slate-600">
                    Service Type: {incident.responseTeam.serviceType} | Status:{' '}
                    <strong className="text-emerald-700">{incident.responseTeam.availabilityStatus}</strong>
                  </p>
                  {incident.responseTeam.contactNumber && (
                    <a
                      href={`tel:${incident.responseTeam.contactNumber}`}
                      className="inline-block mt-1 text-xs font-bold text-brand-blue underline"
                    >
                      Call Unit Dispatch ({incident.responseTeam.contactNumber})
                    </a>
                  )}
                </div>
              )}

              {/* Operator Notes */}
              {incident.operatorNotes && (
                <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-xs space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Command Center Advisory Notes:
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {incident.operatorNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
