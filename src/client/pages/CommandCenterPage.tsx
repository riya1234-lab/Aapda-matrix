import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Radio,
  Search,
  Users,
  AlertOctagon,
  Volume2,
  CheckCircle,
  Truck,
  RotateCw,
  Clock,
  MapPin,
  PhoneCall,
  User,
  Heart,
  Activity,
  AlertTriangle,
  Key,
  SlidersHorizontal,
} from 'lucide-react';
import { IncidentMap } from '../components/IncidentMap';
import { AudioPlayer } from '../components/AudioPlayer';
import { useIncident } from '../context/IncidentContext';
import { useAuth } from '../context/AuthContext';
import { api, apiClient } from '../services/api';
import { Incident, ResponseTeam, Priority } from '../types';
import { getSocket } from '../services/socket';

export const CommandCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { incidents, fetchIncidents } = useIncident();
  const { user, isCommander, authorizeOperatorWorkstation } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRIT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [responseTeams, setResponseTeams] = useState<ResponseTeam[]>([]);
  const [nearestTeams, setNearestTeams] = useState<ResponseTeam[]>([]);
  const [relayNodesCount, setRelayNodesCount] = useState<number>(5);
  const [relayNodes, setRelayNodes] = useState<any[]>([]);
  const [isAssigningTeam, setIsAssigningTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [dispatchReason, setDispatchReason] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Operator Workstation Auth State (Separate from civilian login)
  const [operatorPasskey, setOperatorPasskey] = useState('AAPDA_OPS_TACTICAL_2026');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState('');

  // Triage Override State
  const [isOverridingTriage, setIsOverridingTriage] = useState(false);
  const [overridePriority, setOverridePriority] = useState<Priority>('HIGH');
  const [overrideReason, setOverrideReason] = useState('');

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

  // Join command center socket channel and fetch telemetry
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:command_center');

    api.getResponseTeams().then((data) => {
      if (data?.teams) setResponseTeams(data.teams);
    }).catch(() => {});

    api.getRelayNodes().then((data) => {
      if (data?.activeNodes !== undefined) {
        setRelayNodesCount(data.activeNodes);
        setRelayNodes(data.nodes || []);
      }
    }).catch(() => {});
  }, []);

  // Fetch nearest response units when incident is selected
  useEffect(() => {
    if (selectedIncident) {
      const lat = selectedIncident.latitude;
      const lng = selectedIncident.longitude;
      if (lat !== null && lng !== null) {
        api.getNearestResponseTeams(lat, lng, selectedIncident.emergencyCategory).then((data) => {
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
    } else {
      setNearestTeams(responseTeams);
    }
  }, [selectedIncident, responseTeams]);

  // Handle Workstation Operator Unlock
  const handleAuthorizeWorkstation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthorizing(true);
    setAuthError('');
    const success = await authorizeOperatorWorkstation(operatorPasskey);
    setIsAuthorizing(false);
    if (!success) {
      setAuthError('Access denied: Invalid operational terminal passkey.');
    } else {
      await fetchIncidents();
    }
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (activeFilter === 'CRIT' && inc.priority !== 'CRITICAL') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.id.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.emergencyCategory.toLowerCase().includes(q) ||
        (inc.user?.displayName && inc.user.displayName.toLowerCase().includes(q))
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
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident((prev) => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (err) {
      console.warn('Status update fallback:', err);
    }
  };

  const handleAssignTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !selectedTeamId) return;

    try {
      await apiClient.post('/response-teams/assign', {
        incidentId: selectedIncident.id,
        responseTeamId: selectedTeamId,
        reason: dispatchReason.trim() || undefined,
      });

      setIsAssigningTeam(false);
      setSelectedTeamId('');
      setDispatchReason('');
      alert(`Tactical dispatch authorized! Status set to IN ACTION. Real-time alert dispatched to ${selectedIncident.user?.displayName || 'victim'}.`);
      await fetchIncidents();
    } catch (err: any) {
      alert(`Dispatch error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleOverrideTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !overrideReason.trim()) return;

    try {
      await apiClient.patch(`/incidents/${selectedIncident.id}/override-triage`, {
        priority: overridePriority,
        reason: overrideReason.trim(),
      });
      setIsOverridingTriage(false);
      setOverrideReason('');
      alert(`Priority updated to ${overridePriority}. Audit log recorded.`);
      await fetchIncidents();
      if (selectedIncident) {
        setSelectedIncident((prev) => prev ? { ...prev, priority: overridePriority, triageOverridden: true } : null);
      }
    } catch (err: any) {
      alert(`Triage override error: ${err.response?.data?.error || err.message}`);
    }
  };

  // If user is a civilian CITIZEN or unauthenticated, require operational workstation unlock
  const isOperatorAuthorized = user?.role === 'OPERATOR' || user?.role === 'COMMANDER';

  if (!isOperatorAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-100 selection:bg-critical-red selection:text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-critical-red flex items-center justify-center mx-auto shadow-lg shadow-red-600/20">
              <Shield className="w-7 h-7 text-critical-red" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">Operational Workstation Access</h1>
            <p className="text-xs text-slate-400 font-mono">Restricted Tactical Dispatch Terminal</p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed text-center">
            The Command Center is protected by server-side role-based access control. Enter your operational station passkey to authorize this terminal session.
          </p>

          {authError && (
            <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs p-3 rounded-xl">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthorizeWorkstation} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Workstation Passkey
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={operatorPasskey}
                  onChange={(e) => setOperatorPasskey(e.target.value)}
                  placeholder="Operational Passkey"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-critical-red font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthorizing}
              className="w-full py-3.5 bg-critical-red hover:bg-red-700 disabled:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <span>{isAuthorizing ? 'Authorizing Station...' : 'Authorize Tactical Station'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              &larr; Return to Citizen Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tactical-dark text-slate-100 flex flex-col font-sans selection:bg-critical-red selection:text-white">
      {/* Tactical Top Bar */}
      <header className="h-14 bg-slate-950 border-b border-tactical-border px-4 flex items-center justify-between text-xs font-mono">
        {/* Brand & Telemetry */}
        <div className="flex items-center gap-3">
          <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer group">
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

          <div className="hidden sm:flex items-center gap-1.5 bg-brand-blue/20 text-sky-300 border border-brand-blue/50 px-3 py-1.5 rounded-full font-bold ml-2">
            <Users className="w-3.5 h-3.5" />
            <span>AVAILABLE UNITS ({responseTeams.length || 4})</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan Victims, IDs, Coordinates, or Calamities..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Tactical Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono text-slate-200">{currentTime || '12:59:49'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>COMMANDER MODE</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-critical-red/50 text-white px-3 py-1 rounded-lg font-black tracking-wider text-[11px]">
            <span className="w-2 h-2 rounded-full bg-critical-red animate-pulse" />
            <span>{user?.displayName || 'HQ COMMANDER'}</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-full md:w-[410px] bg-slate-950 border-r border-tactical-border flex flex-col p-3.5 space-y-3.5 overflow-y-auto">
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

          {/* 4 Stat Cards */}
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
                RELAY NODES (DTN MESH)
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
                HIGH
              </span>
            </div>
          </div>

          {/* Filter Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-black text-slate-300 tracking-wider">ACTIVE INCIDENTS</span>
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-2 py-0.5 rounded ${
                  activeFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                ALL ({incidents.length})
              </button>
              <button
                onClick={() => setActiveFilter('CRIT')}
                className={`px-2 py-0.5 rounded ${
                  activeFilter === 'CRIT' ? 'bg-critical-red text-white' : 'text-slate-400'
                }`}
              >
                CRIT ({criticalCount})
              </button>
            </div>
          </div>

          {/* Incidents Feed */}
          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-2xl p-6">
                NO ACTIVE INCIDENTS IN THEATRE
              </div>
            ) : (
              filteredIncidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id;
                const isCritical = inc.priority === 'CRITICAL';
                const victimName = inc.user?.displayName || 'Name Unavailable';

                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer font-sans space-y-2 ${
                      isSelected
                        ? 'border-sky-500 bg-slate-900 shadow-xl ring-1 ring-sky-500/50'
                        : isCritical
                        ? 'border-red-900/60 bg-slate-900/50 hover:border-red-600'
                        : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
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

                    {/* Prominent Victim Name (Critical Requirement 4) */}
                    <div className="bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Victim: <strong className="text-emerald-300">{victimName}</strong></span>
                      </div>
                      {inc.user?.bloodGroup && (
                        <span className="text-[10px] font-mono text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900">
                          {inc.user.bloodGroup}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-sky-400 font-bold">
                      {inc.emergencyCategory.replace('_', ' ')}{' '}
                      {inc.disasterSubtype ? `(${inc.disasterSubtype})` : ''}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-medium">
                      {inc.description}
                    </p>

                    {/* Location Status Indicator */}
                    {inc.locationStatus === 'LOCATION_UNAVAILABLE' ? (
                      <div className="text-[10px] font-bold text-red-400 bg-red-950/50 border border-red-900/60 px-2 py-1 rounded-lg flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-red-400 flex-shrink-0" />
                        <span>Location Unavailable (No GPS Fix)</span>
                      </div>
                    ) : inc.locationStatus === 'USER_PROVIDED' ? (
                      <div className="text-[10px] font-bold text-amber-300 bg-amber-950/40 border border-amber-900/60 px-2 py-1 rounded-lg flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="truncate">Landmark: {inc.userProvidedAddress}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>GPS Verified ({inc.latitude?.toFixed(4)}, {inc.longitude?.toFixed(4)})</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                      <span>🔋 {inc.batteryLevel || 72}%</span>
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
                            <option value="LOCAL_PENDING">LOCAL PENDING</option>
                            <option value="RECEIVED">RECEIVED</option>
                            <option value="TRIAGE_PENDING">TRIAGE PENDING</option>
                            <option value="VERIFIED">VERIFIED</option>
                            <option value="DISPATCH_PENDING">DISPATCH PENDING</option>
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
        </aside>

        {/* Right Tactical Map Area */}
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

              {/* Registered Victim Identity (Requirement 4) */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Victim Name:</span>
                  <strong className="text-emerald-300 font-bold text-xs">
                    {selectedIncident.user?.displayName || 'Name Unavailable'}
                  </strong>
                </div>
                {selectedIncident.user?.phoneNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Direct Phone:</span>
                    <a
                      href={`tel:${selectedIncident.user.phoneNumber}`}
                      className="text-emerald-400 underline font-bold flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>{selectedIncident.user.phoneNumber}</span>
                    </a>
                  </div>
                )}
                {selectedIncident.user?.bloodGroup && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Blood Group:</span>
                    <span className="text-red-400 font-bold">{selectedIncident.user.bloodGroup}</span>
                  </div>
                )}
                {selectedIncident.user?.allergies && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Medical Notes:</span>
                    <span className="text-amber-300">{selectedIncident.user.allergies}</span>
                  </div>
                )}
              </div>

              {/* Calamity & Intel */}
              <div>
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wide block">
                  {selectedIncident.emergencyCategory.replace('_', ' ')}
                </span>
                <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed line-clamp-3">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Triage Rationale & Override */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Triage Logic:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOverridePriority(selectedIncident.priority);
                      setIsOverridingTriage(true);
                    }}
                    className="text-[10px] font-bold text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Override Priority</span>
                  </button>
                </div>
                <p className="text-slate-300 italic">
                  {selectedIncident.triageRationale || 'Standard triage protocol applied.'}
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

              {/* Location Status in HUD */}
              {selectedIncident.locationStatus === 'LOCATION_UNAVAILABLE' ? (
                <div className="bg-red-950/80 border border-critical-red p-2.5 rounded-xl text-xs text-red-300 font-bold flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-critical-red" />
                  <span>⚠️ LOCATION UNAVAILABLE (Dispatch via phone/radio)</span>
                </div>
              ) : selectedIncident.locationStatus === 'USER_PROVIDED' ? (
                <div className="bg-amber-950/80 border border-amber-600 p-2.5 rounded-xl text-xs text-amber-200 font-mono">
                  <span>📍 Landmark: <strong>{selectedIncident.userProvidedAddress}</strong></span>
                </div>
              ) : (
                <div className="text-[11px] font-mono text-slate-400">
                  📍 Verified Coordinates: {selectedIncident.latitude?.toFixed(4)}, {selectedIncident.longitude?.toFixed(4)}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <select
                  value={selectedIncident.status}
                  onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="LOCAL_PENDING">LOCAL PENDING</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="TRIAGE_PENDING">TRIAGE PENDING</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="DISPATCH_PENDING">DISPATCH PENDING</option>
                  <option value="IN_ACTION">IN ACTION</option>
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
        </main>
      </div>

      {/* Triage Priority Override Modal */}
      {isOverridingTriage && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm tracking-wider text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              <span>OVERRIDE TRIAGE PRIORITY FOR {selectedIncident.id}</span>
            </h3>

            <form onSubmit={handleOverrideTriage} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Select Target Priority</label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value as Priority)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">
                  Mandatory Operator Reason <span className="text-critical-red">*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={2}
                  placeholder="State justification for priority change..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOverridingTriage(false)}
                  className="py-2.5 px-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-3 rounded-xl bg-critical-red hover:bg-red-700 text-white text-xs font-bold"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Team Assignment Modal */}
      {isAssigningTeam && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm tracking-wider text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>DISPATCH RESCUE TEAM TO {selectedIncident.id}</span>
            </h3>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs space-y-1 font-mono">
              <div>Victim: <strong className="text-emerald-300">{selectedIncident.user?.displayName || 'Name Unavailable'}</strong></div>
              <div>Calamity: <strong className="text-sky-300">{selectedIncident.emergencyCategory}</strong></div>
              <div>
                Location:{' '}
                <strong>
                  {selectedIncident.locationStatus === 'LOCATION_UNAVAILABLE'
                    ? '⚠️ Location Unavailable'
                    : selectedIncident.locationStatus === 'USER_PROVIDED'
                    ? `Landmark: ${selectedIncident.userProvidedAddress}`
                    : `${selectedIncident.latitude?.toFixed(4)}, ${selectedIncident.longitude?.toFixed(4)}`}
                </strong>
              </div>
            </div>

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
                    {idx === 0 && team.distanceKm !== null ? '★ [CLOSEST] ' : ''}
                    {team.teamName} ({team.serviceType}){' '}
                    {team.distanceKm !== null
                      ? `— ${team.distanceKm} km (ETA ~${team.etaMinutes}m)`
                      : '— Coordinates Unavailable'}
                  </option>
                ))}
              </select>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Optional Dispatch Notes</label>
                <input
                  type="text"
                  value={dispatchReason}
                  onChange={(e) => setDispatchReason(e.target.value)}
                  placeholder="e.g. Deploy with oxygen kit and hydraulic shears"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

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
