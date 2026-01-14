
import React, { useEffect, useRef } from 'react';
import { MERCEDES_COORDS } from '../constants';

declare var L: any; // Global Leaflet object

interface MarkerData {
  lat: number;
  lng: number;
  status: 'estacionado' | 'disponible';
  license_plate?: string;
  address?: string;
}

interface Props {
  markers: MarkerData[];
}

const ParkingMap: React.FC<Props> = ({ markers }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || typeof L === 'undefined') return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapContainerRef.current).setView([MERCEDES_COORDS.lat, MERCEDES_COORDS.lng], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapInstance.current);

      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    if (markersLayer.current) {
      markersLayer.current.clearLayers();
      const bounds: any[] = [];

      markers.forEach(m => {
        const markerCoords = [m.lat, m.lng];
        bounds.push(markerCoords);

        const circleMarker = L.circleMarker(markerCoords, {
          radius: 12,
          fillColor: '#EF4444',
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9
        });

        circleMarker.bindPopup(`
          <div style="font-family: sans-serif; padding: 2px;">
            <div style="font-size: 14px; font-weight: 900; color: #1e3a8a; border-bottom: 1px solid #eee; margin-bottom: 4px; padding-bottom: 2px;">${m.license_plate}</div>
            <div style="font-size: 11px; color: #666; font-weight: 600;">${m.address || 'Ubicación SEM'}</div>
            <div style="font-size: 9px; color: #EF4444; font-weight: 800; text-transform: uppercase; margin-top: 4px;">Vehículo Estacionado</div>
          </div>
        `, { closeButton: false });
        
        markersLayer.current.addLayer(circleMarker);
      });

      // Si hay marcadores nuevos, ajustar la vista para verlos todos o el último
      if (bounds.length > 0 && mapInstance.current) {
        if (bounds.length === 1) {
          mapInstance.current.setView(bounds[0], 17, { animate: true });
        } else {
          mapInstance.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 17 });
        }
      }
    }
  }, [markers]);

  return (
    <div 
      ref={mapContainerRef} 
      className="shadow-xl border-4 border-white h-[450px] w-full rounded-[2rem] overflow-hidden"
      style={{ isolation: 'isolate', zIndex: 1 }}
    ></div>
  );
};

export default ParkingMap;
