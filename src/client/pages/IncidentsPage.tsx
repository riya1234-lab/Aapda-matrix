import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { useIncident } from '../context/IncidentContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { AlertCircle, Clock, MapPin, Radio, RefreshCw, ChevronRight } from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, fetchIncidents, isLoading } = useIncident();
  const { pendingQueueCount, isSyncing, triggerManualSync } = useConnectivity();

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ACKNOWLEDGED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DISPATCHED':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between pb-24 font-sans selection:bg-critical-red selection:text-white">
      <div>
        <AppHeader />

        <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                My Emergency Incidents
              </h2>
              <p className="text-xs text-slate-500">
                Live distress logs, delivery statuses, and response coordination
              </p>
            </div>

            <button
              onClick={() => fetchIncidents()}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Pending Offline Queue Banner if present */}
          {pendingQueueCount > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-amber-600 animate-pulse" />
                <div>
                  <h4 className="font-bold text-xs text-amber-900">
                    {pendingQueueCount} Offline Distress Signal(s) Queued
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Stored in IndexedDB. Will auto-sync when connected.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => triggerManualSync()}
                disabled={isSyncing}
                className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          )}

          {/* Incidents List */}
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-800">No Incidents Recorded</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  When you activate SOS or report an emergency, your real-time incident tracking log will appear here.
                </p>
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:border-slate-400 transition-all cursor-pointer select-none space-y-2.5 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs font-mono text-slate-900">
                      {inc.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(
                        inc.status
                      )}`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                      {inc.emergencyCategory.replace('_', ' ')}{' '}
                      {inc.disasterSubtype ? `(${inc.disasterSubtype})` : ''}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                      {inc.description || 'Emergency assistance requested'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>

                    {inc.latitude && inc.longitude ? (
                      <span className="flex items-center gap-1 text-sky-600 font-bold">
                        <MapPin className="w-3 h-3" />
                        <span>GPS Fixed</span>
                      </span>
                    ) : (
                      <span>No GPS Fix</span>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
};
