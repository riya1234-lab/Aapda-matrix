import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Radio,
  Search,
  Users,
  Sun,
  Settings,
  AlertOctagon,
  Volume2,
  CheckCircle,
  Truck,
  RotateCw,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { IncidentMap } from '../components/IncidentMap';
import { AudioPlayer } from '../components/AudioPlayer';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Incident, ResponseTeam } from '../types';
import { getSocket } from '../services/socket';

export const CommandCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, fetchIncidents } = useIncident();
  const { user, isCommander, demoLogin } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([]);
  const [nearestTeams, setNearestTeams] = useState<ResponseTeam[]>([]);
  const [relayNodesCount, setRelayNodesCount] = useState<number>(5);
  const [relayNodes, setRelayNodes] = useState<any[]>([]);
  const [isAssigningTeam, setIsAssigningTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ensure socket joins command_center channel and fetch real telemetry
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:command_center');

    // Fetch response teams
    api.getResponseTeams().then((data) => {
      if (data?.teams) setResponseTeams(data.teams);
    }).catch(() => {});

    // Fetch real mesh relay nodes (Requirement: real relay nodes)
    api.getRelayNodes().then((data) => {
      if (data?.activeNodes !== undefined) {
        setRelayNodesCount(data.activeNodes);
        setRelayNodes(data.nodes || []);
      }
    }).catch(() => {});
  }, []);

  // Fetch nearest response units when incident is selected
  useEffect(() => {
    if (selectedIncident && selectedIncident.latitude && selectedIncident.longitude) {
      api.getNearestResponseTeams(selectedIncident.latitude, selectedIncident.longitude).then((data) => {
        if (data?.teams && data.teams.length > 0) {
          setNearestTeams(data.teams);
        } else {
          setNearestTeams(responseTeams);
        }
      }).catch(() => {
        setNearestTeams(responseTeams);
      });
    } else {
      setNearestTeams(responseTeams);
    }
  }, [selectedIncident, responseTeams]);

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (activeFilter === 'CRIT' && inc.priority !== 'CRITICAL') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.id.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.emergencyCategory.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = incidents.filter((i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const activeCount = incidents.filter((i) => i.status !== 'RESOLVED').length;

  const handleUpdateStatus = async (incidentId: string, newStatus: string) => {
    try {
      await api.updateIncidentStatus(incidentId, newStatus, `Operator updated status to ${newStatus}`);
      await fetchIncidents();
    } catch (err) {
      console.warn('Status update fallback:', err);
    }
  };

  const handleAssignTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !selectedTeamId) return;

    try {
      await api.assignResponseTeam(selectedIncident.id, selectedTeamId);
      setIsAssigningTeam(false);
      setSelectedTeamId('');
      alert(`Tactical dispatch authorized! Incident set to IN ACTION. Victim notified in real-time that help is on the way.`);
      await fetchIncidents();
    } catch (err) {
      console.warn('Team assignment fallback:', err);
    }
  };

  return (
    <div className="min-h-screen bg-tactical-dark text-slate-100 flex flex-col font-sans selection:bg-critical-red selection:text-white">
      {/* Tactical Top Bar (Matching Screenshot 2) */}
      <header className="h-14 bg-slate-950 border-b border-tactical-border px-4 flex items-center justify-between text-xs font-mono">
        {/* Brand & Telemetry Indicator */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-critical-red flex items-center justify-center">
              <Shield className="w-4 h-4 text-critical-red" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wider text-white">
                AAPDA MATRIX <span className="text-slate-400 font-bold text-xs">GLOBAL HQ</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE DATA STREAM SECURED</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert(`Available units: ${responseTeams.length} Active SAR & Trauma Units stationed.`)}
            className="hidden sm:flex items-center gap-1.5 bg-brand-blue/20 hover:bg-brand-blue/30 text-sky-300 border border-brand-blue/50 px-3 py-1.5 rounded-full font-bold transition-colors ml-2"
          >
            <Users className="w-3.5 h-3.5" />
            <span>AVAILABLE UNITS ({responseTeams.length || 4})</span>
          </button>
        </div>

        {/* Global Search Bar (Matching Screenshot 2) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan IDs, Coordinates, or Regions..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Tactical User Controls (Matching Screenshot 2) */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-slate-200">{currentTime || '12:59:49'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>COMMANDER MODE</span>
          </div>

          {/* Commander User Badge */}
          <div
            onClick={() => demoLogin('COMMANDER')}
            className="flex items-center gap-1.5 bg-slate-900 border border-critical-red/50 text-white px-3 py-1 rounded-lg font-black tracking-wider text-[11px] cursor-pointer hover:bg-slate-800"
            title="Logged in as Mission Commander"
          >
            <span className="w-2 h-2 rounded-full bg-critical-red animate-pulse" />
            <span>{user?.role === 'COMMANDER' ? 'COMMANDER' : 'COMMANDER'}</span>
          </div>
        </div>
      </header>

      {/* Main Mission Control Grid (Left Sidebar + Right Tactical Map) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar (Mission Control Dashboard matching Screenshot 2) */}
        <aside className="w-full md:w-[380px] bg-slate-950 border-r border-tactical-border flex flex-col p-3.5 space-y-3.5 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs tracking-wider text-slate-300">
              MISSION CONTROL DASHBOARD
            </span>
            <button
              onClick={() => fetchIncidents()}
              className="text-slate-500 hover:text-white transition-colors"
              title="Refresh Incidents"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Stat Cards Grid (Matching Screenshot 2) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                ACTIVE INCIDENTS
              </span>
              <span className="text-xl font-mono font-black text-white mt-1 block">
                {activeCount}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                CRITICAL PRIORITY
              </span>
              <span className="text-xl font-mono font-black text-critical-red mt-1 block animate-pulse">
                {criticalCount}
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                RELAY NODES (DELAY-TOLERANT)
              </span>
              <span className="text-xl font-mono font-black text-accent-cyan mt-1 block">
                {relayNodesCount} ACTIVE
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                SAR READINESS
              </span>
              <span className="text-xl font-mono font-black text-success-green mt-1 block">
                High
              </span>
            </div>
          </div>

          {/* Incidents Filter & Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-black text-slate-300 tracking-wider">ACTIVE INCIDENTS</span>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-2 py-0.5 rounded ${
                  activeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setActiveFilter('CRIT')}
                className={`px-2 py-0.5 rounded ${
                  activeFilter === 'CRIT' ? 'bg-critical-red text-white' : 'text-slate-400'
                }`}
              >
                CRIT
              </button>
            </div>
          </div>

          {/* Live Pings Scan Ticker (Matching Screenshot 2) */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-emerald-400 font-bold">SCANNING FOR LIVE PINGS...</span>
          </div>

          {/* Dynamic Incident Cards Feed */}
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                NO ACTIVE INCIDENTS DETECTED
              </div>
            ) : (
              filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isCritical = inc.priority === 'CRITICAL';

                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer font-sans ${
                      isSelected
                        ? 'border-sky-500 bg-slate-900 shadow-lg'
                        : isCritical
                        ? 'border-red-900/60 bg-slate-900/50 hover:border-red-600'
                        : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                      <span className="font-extrabold text-white flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCritical ? 'bg-critical-red animate-pulse' : 'bg-amber-400'
                          }`}
                        />
                        {inc.id}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          isCritical
                            ? 'bg-red-950 text-critical-red border border-red-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {inc.priority}
                      </span>
                    </div>

                    <div className="text-xs text-sky-400 font-bold mb-1">
                      {inc.emergencyCategory.replace('_', ' ')}{' '}
                      {inc.disasterSubtype ? `(${inc.disasterSubtype})` : ''}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2 font-medium">
                      {inc.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                      <span>🔋 {inc.batteryLevel || 72}%</span>
                      <span>📡 {inc.communicationMethod} (Hops: {inc.hopCount})</span>
                      <span className="text-emerald-400 font-bold">{inc.status}</span>
                    </div>

                    {/* Audio attachment if available */}
                    {inc.attachments && inc.attachments.length > 0 && (
                      <div className="mt-2">
                        <AudioPlayer
                          src={api.getAudioStreamUrl(inc.id, inc.attachments[0].id)}
                          durationSeconds={inc.attachments[0].durationSeconds || 5}
                        />
                      </div>
                    )}

                    {/* Quick Operator Actions when selected */}
                    {isSelected && (
                      <div className="mt-3 pt-2 border-t border-slate-800 space-y-2">
                        <div className="flex gap-1.5">
                          <select
                            value={inc.status}
                            onChange={(e) => handleUpdateStatus(inc.id, e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                            <option value="DISPATCHED">DISPATCHED</option>
                            <option value="IN_ACTION">IN ACTION</option>
                            <option value="EN_ROUTE">EN ROUTE</option>
                            <option value="ON_SCENE">ON SCENE</option>
                            <option value="RESOLVED">RESOLVED</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setIsAssigningTeam(true)}
                            className="bg-brand-blue hover:bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                        </div>

                        {inc.responseTeam && (
                          <div className="text-[11px] font-mono text-sky-300 bg-sky-950/40 border border-sky-800/60 p-2 rounded-lg">
                            Unit Assigned: <strong>{inc.responseTeam.teamName}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Active Red Alerts Footer (Matching Screenshot 2) */}
          <div className="border-t border-slate-800 pt-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              ACTIVE RED ALERTS
            </span>
            {criticalCount > 0 ? (
              <div className="bg-red-950/60 border border-red-800 p-2.5 rounded-xl text-xs text-red-200 font-mono flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-critical-red animate-pulse" />
                <span>{criticalCount} CRITICAL RED ALERTS IN THEATRE</span>
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500">NO ACTIVE RED ALERTS DETECTED</div>
            )}
          </div>
        </aside>

        {/* Right Tactical Map Area (Matching Screenshot 2) */}
        <main className="flex-1 flex flex-col relative">
          <div className="flex-1">
            <IncidentMap
              incidents={filteredIncidents}
              selectedIncidentId={selectedIncident?.id}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              heightClass="h-full min-h-[550px]"
            />
          </div>

          {/* Floating Selected Incident Tactical Audio & Intel HUD */}
          {selectedIncident && (
            <div className="absolute top-16 right-4 z-30 max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl text-slate-100 space-y-3 animate-fade-in font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-critical-red animate-pulse" />
                  <span className="font-mono font-black text-xs text-white">{selectedIncident.id}</span>
                  <span className="text-[10px] font-bold uppercase bg-red-950 text-critical-red px-2 py-0.5 rounded border border-red-800">
                    {selectedIncident.priority}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold"
                  title="Close HUD Panel"
                >
                  ✕
                </button>
              </div>

              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wide block">
                  {selectedIncident.emergencyCategory.replace('_', ' ')}
                </span>
                <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed line-clamp-3">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Emergency Audio Player */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  AUTHENTICATED AUDIO RECORDING:
                </span>
                {selectedIncident.attachments && selectedIncident.attachments.length > 0 ? (
                  <AudioPlayer
                    src={api.getAudioStreamUrl(selectedIncident.id, selectedIncident.attachments[0].id)}
                    durationSeconds={selectedIncident.attachments[0].durationSeconds || 5}
                  />
                ) : (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-slate-500 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-slate-600" />
                    <span>Silent SOS / No Audio Attached</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                <span>📍 {selectedIncident.latitude?.toFixed(4)}, {selectedIncident.longitude?.toFixed(4)}</span>
                <span>🔋 {selectedIncident.batteryLevel || 70}%</span>
                <span className="text-emerald-400 font-bold">{selectedIncident.status}</span>
              </div>

              {/* Status Update & Dispatch Action */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <select
                  value={selectedIncident.status}
                  onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                  <option value="DISPATCHED">DISPATCHED</option>
                  <option value="EN_ROUTE">EN ROUTE</option>
                  <option value="ON_SCENE">ON SCENE</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsAssigningTeam(true)}
                  className="bg-brand-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch Unit</span>
                </button>
              </div>
            </div>
          )}

          {/* Operational Theatre Active Status Bar (Matching Screenshot 2) */}
          <div className="h-9 bg-slate-950 border-t border-tactical-border px-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">OPERATIONAL THEATRE ACTIVE</span>
              <span>|</span>
              <span>ASSETS: {responseTeams.length || 4} DEPLOYED</span>
              <span>|</span>
              <span className="text-red-400 font-bold">THREATS: {criticalCount}</span>
            </div>

            <div className="hidden sm:block text-slate-500">
              AAPDA MATRIX V4.0 MISSION COMMAND
            </div>
          </div>
        </main>
      </div>

      {/* Response Team Assignment Modal */}
      {isAssigningTeam && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm tracking-wider text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>DISPATCH RESCUE TEAM TO {selectedIncident.id}</span>
            </h3>

            <p className="text-xs text-slate-300">
              Select an available tactical response unit for {selectedIncident.emergencyCategory} incident in{' '}
              {selectedIncident.latitude?.toFixed(4)}, {selectedIncident.longitude?.toFixed(4)}.
            </p>

            <form onSubmit={handleAssignTeam} className="space-y-3">
              <label className="text-[11px] font-bold text-sky-400 block uppercase tracking-wider">
                Ranked by Proximity (Haversine Distance & Tactical ETA):
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              >
                <option value="">-- Choose Nearest Tactical Unit --</option>
                {nearestTeams.map((team, idx) => (
                  <option key={team.id} value={team.id}>
                    {idx === 0 ? '★ [CLOSEST] ' : ''}{team.teamName} ({team.serviceType}) {team.distanceKm ? `— ${team.distanceKm} km (ETA ~${team.etaMinutes}m)` : ''}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssigningTeam(false)}
                  className="py-2.5 px-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!selectedTeamId}
                  className="py-2.5 px-3 rounded-xl bg-brand-blue hover:bg-blue-600 disabled:bg-slate-800 text-white text-xs font-extrabold transition-colors shadow-md shadow-blue-500/20"
                >
                  Authorize Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
