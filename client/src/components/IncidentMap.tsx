import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Incident } from '../types';
import { Layers, Volume2, ShieldCheck, MapPin } from 'lucide-react';

interface IncidentMapProps {
  incidents: Incident[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incident: Incident) => void;
  heightClass?: string;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  heightClass = 'h-full min-h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const [mapLayer, setMapLayer] = useState<'satellite' | 'street'>('satellite');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6139, 77.2090], // India central theater
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add default Esri Satellite layer
      const esriSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        }
      );
      esriSatellite.addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Update markers
    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    incidents.forEach((inc) => {
      if (inc.latitude && inc.longitude) {
        const isCritical = inc.priority === 'CRITICAL';
        const color = isCritical ? '#DC2626' : inc.priority === 'HIGH' ? '#F97316' : '#EAB308';

        // Custom tactical pulsating HTML marker icon
        const customIcon = L.divIcon({
          className: 'tactical-custom-marker',
          html: `
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <span style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: ${color}; opacity: 0.45; animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 0 10px ${color};"></span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="padding: 10px; font-family: sans-serif; font-size: 12px; color: #F8FAFC;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 800; color: #FFFFFF; font-size: 13px;">${inc.id}</span>
              <span style="background: ${color}; color: #FFFFFF; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${inc.priority}</span>
            </div>
            <div style="color: #38BDF8; font-weight: 700; margin-bottom: 4px;">${inc.emergencyCategory} ${inc.disasterSubtype ? `(${inc.disasterSubtype})` : ''}</div>
            <div style="color: #94A3B8; font-size: 11px; margin-bottom: 6px;">${inc.description || 'Distress signal received'}</div>
            <div style="display: flex; gap: 8px; font-size: 11px; color: #CBD5E1; margin-bottom: 8px;">
              <span>📍 ${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}</span>
              <span>🔋 ${inc.batteryLevel || 65}%</span>
              <span>📡 Hops: ${inc.hopCount}</span>
            </div>
            <div style="font-size: 10px; color: #10B981; font-weight: 700;">Status: ${inc.status}</div>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          if (onSelectIncident) {
            onSelectIncident(inc);
          }
        });

        markersRef.current[inc.id] = marker;
      }
    });

    // If an incident is selected, fly to it
    if (selectedIncidentId && markersRef.current[selectedIncidentId]) {
      const selected = incidents.find((i) => i.id === selectedIncidentId);
      if (selected && selected.latitude && selected.longitude) {
        map.flyTo([selected.latitude, selected.longitude], 12, { duration: 1.5 });
        markersRef.current[selectedIncidentId].openPopup();
      }
    }
  }, [incidents, selectedIncidentId, onSelectIncident]);

  const toggleLayer = () => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove all layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (mapLayer === 'satellite') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      setMapLayer('street');
    } else {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
      setMapLayer('satellite');
    }
  };

  return (
    <div className={`relative w-full ${heightClass} bg-slate-950 overflow-hidden`}>
      {/* Tactical Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 tactical-grid-bg opacity-40" />

      {/* Top HUD Banner (Matching Screenshot 2) */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl text-[11px] font-mono font-bold tracking-tight text-slate-300 shadow-xl space-y-0.5">
          <div className="flex items-center gap-2 text-sky-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>CURRENT FOCUS: SURVEILLANCE MODE</span>
          </div>
          <div>G-IMAGE: {mapLayer === 'satellite' ? 'SATELLITE (ESRI-WORLD)' : 'VECTOR (OSM-TACTICAL)'}</div>
          <div className="text-slate-400">ZOOM: 12.0X (STRATEGIC) | THEATRE: ACTIVE</div>
        </div>
      </div>

      {/* Layer Toggle Button */}
      <div className="absolute top-3 right-12 z-20">
        <button
          onClick={toggleLayer}
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 p-2 rounded-xl shadow-lg transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
          title="Toggle Satellite / Tactical Street Layer"
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline capitalize">{mapLayer}</span>
        </button>
      </div>

      {/* Bottom Priority Legend (Matching Screenshot 2) */}
      <div className="absolute bottom-3 right-3 z-20">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-3 text-[10px] font-mono font-extrabold uppercase text-slate-300 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-critical-red animate-pulse" />
            <span>CRITICAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emergency-orange" />
            <span>HIGH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span>MODERATE</span>
          </div>
        </div>
      </div>

      {/* Leaflet DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
