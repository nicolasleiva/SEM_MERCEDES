
import React, { useEffect, useRef } from 'react';
import { MERCEDES_COORDS } from '../constants';

// Declare google namespace to fix compilation errors when using Google Maps JS API
declare global {
  interface Window {
    google: any;
  }
}
declare var google: any;

interface MarkerData {
  lat: number;
  lng: number;
  status: 'estacionado' | 'disponible';
  license_plate?: string;
}

interface Props {
  markers: MarkerData[];
}

const ParkingMap: React.FC<Props> = ({ markers }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);

  useEffect(() => {
    /* Fix: Ensuring google maps is available before initializing */
    if (mapRef.current && !googleMap.current && typeof google !== 'undefined') {
      googleMap.current = new google.maps.Map(mapRef.current, {
        center: MERCEDES_COORDS,
        zoom: 15,
        mapId: 'SEM_MERCEDES_MAP',
        disableDefaultUI: true,
        zoomControl: true,
      });
    }

    if (googleMap.current && typeof google !== 'undefined') {
      markers.forEach(m => {
        new google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map: googleMap.current!,
          title: m.license_plate || 'Disponible',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: m.status === 'estacionado' ? '#EF4444' : '#10B981',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
            scale: 10,
          }
        });
      });
    }
  }, [markers]);

  return <div id="map" ref={mapRef} className="shadow-inner border border-gray-200 h-[400px] w-full rounded-2xl mb-4"></div>;
};

export default ParkingMap;
