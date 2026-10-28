import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  type: 'hospital' | 'blood_bank' | 'donor';
  bloodGroup?: string;
  rank?: number;
}

interface MapViewerProps {
  center?: [number, number];
  zoom?: number;
  locations?: MapLocation[];
  height?: string;
  highlightRadiusKm?: number;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  center = [12.9716, 77.5946], // Bangalore default
  zoom = 12,
  locations = [],
  height = '360px',
  highlightRadiusKm
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }

    const map = mapInstanceRef.current;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // Custom icons
    const createMarkerIcon = (type: string, text?: string) => {
      let bg = '#dc2626'; // red
      if (type === 'hospital') bg = '#2563eb'; // blue
      if (type === 'blood_bank') bg = '#059669'; // emerald

      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="background-color: ${bg}; color: white; border: 2px solid white; border-radius: 9999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);">
            ${text || (type === 'hospital' ? 'H' : type === 'blood_bank' ? 'BB' : 'D')}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    };

    // Add radius circle around center if provided
    if (highlightRadiusKm) {
      L.circle(center, {
        radius: highlightRadiusKm * 1000,
        color: '#dc2626',
        fillColor: '#fee2e2',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(map);
    }

    // Add location markers
    locations.forEach((loc) => {
      const label = loc.type === 'donor' ? `#${loc.rank || 1}` : loc.type === 'hospital' ? '🏥' : '🏦';
      const marker = L.marker([loc.lat, loc.lng], {
        icon: createMarkerIcon(loc.type, label)
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <strong style="color: #0f172a; font-size: 13px;">${loc.title}</strong>
          ${loc.subtitle ? `<div style="color: #64748b; font-size: 11px; margin-top: 2px;">${loc.subtitle}</div>` : ''}
          ${loc.bloodGroup ? `<div style="margin-top: 4px; display: inline-block; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">${loc.bloodGroup}</div>` : ''}
        </div>
      `);
    });

    return () => {
      // Keep map clean
    };
  }, [center, zoom, locations, highlightRadiusKm]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200/80 shadow-xs">
      <div ref={mapContainerRef} style={{ height, width: '100%', zIndex: 10 }} />
      <div className="absolute bottom-2 right-2 z-20 bg-white/90 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] flex items-center gap-3 shadow-xs">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Hospital
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Blood Bank
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> Matched Donor
        </span>
      </div>
    </div>
  );
};
