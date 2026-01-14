
import { ParkingRecord } from '../types';

/**
 * Servicio de API para el Sistema de Estacionamiento Medido.
 */

const API_BASE = '/api'; 

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Error SEM: ${response.status}`);
  }
  return data;
};

export const startParking = async (licensePlate: string, userId: string, coords: {lat: number, lng: number, address?: string}) => {
  const response = await fetch(`${API_BASE}/parking/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      license_plate: licensePlate,
      created_by: userId,
      latitude: coords.lat,
      longitude: coords.lng,
      address: coords.address,
      start_time: new Date().toISOString()
    })
  });
  return await handleResponse(response);
};

export const fetchActiveParking = async (): Promise<ParkingRecord[]> => {
  const response = await fetch(`${API_BASE}/parking/active`);
  return await handleResponse(response);
};

export const finishParking = async (recordId: string, userId: string) => {
  const response = await fetch(`${API_BASE}/parking/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: recordId,
      ended_by: userId,
      end_time: new Date().toISOString()
    })
  });
  return await handleResponse(response);
};

export const fetchMapMarkers = async () => {
  const response = await fetch(`${API_BASE}/map/markers`);
  if (!response.ok) return [];
  return await response.json();
};
