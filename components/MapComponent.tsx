
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { Rider } from '../types';

interface MapComponentProps {
  riders: Rider[];
  center?: [number, number];
}

const MapComponent: React.FC<MapComponentProps> = ({ riders, center }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter = center || [17.3850, 78.4867];
    
    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(initialCenter, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map view when the center prop changes
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView(center, mapRef.current.getZoom());
    }
  }, [center]);

  useEffect(() => {
    if (!mapRef.current) return;

    riders.forEach((rider) => {
      const { id, name, location, color } = rider;
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center overflow-hidden" style="background-color: ${color}">
              <span class="text-[10px] font-bold text-white uppercase">${name.substring(0, 2)}</span>
            </div>
            <div class="absolute -bottom-1 w-2 h-2 rotate-45" style="background-color: ${color}; transform: translateX(-50%) rotate(45deg); left: 50%;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      if (markersRef.current[id]) {
        markersRef.current[id].setLatLng([location.lat, location.lng]);
        // Update popup info
        markersRef.current[id].getPopup()?.setContent(`<b class="text-slate-900">${name}</b><br/><span class="text-slate-600">Speed: ${location.speed?.toFixed(1) || 0} km/h</span>`);
      } else {
        const marker = L.marker([location.lat, location.lng], { icon }).addTo(mapRef.current!);
        marker.bindPopup(`<b class="text-slate-900">${name}</b><br/><span class="text-slate-600">Speed: ${location.speed?.toFixed(1) || 0} km/h</span>`);
        markersRef.current[id] = marker;
      }
    });

    // Cleanup markers for removed riders
    const riderIds = new Set(riders.map(r => r.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!riderIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

  }, [riders]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full bg-[#020617]" 
    />
  );
};

export default MapComponent;
