
import { GoogleGenAI, Type } from "@google/genai";
import { ParkingRecord } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Instrucción mínima para reducir tokens en lecturas frecuentes
const READ_INSTRUCTION = "Eres un API JSON. Retorna datos de parking_records de Mercedes, Corrientes.";

const WRITE_INSTRUCTION = `Motor DB SEM Mercedes. 
Reglas: $1500/hr (redondeo arriba), montos en centavos, UTC ISO 8601, auditoría obligatoria.`;

export const startParking = async (licensePlate: string, userId: string, coords: {lat: number, lng: number}) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `START: ${licensePlate}, Coords: ${coords.lat},${coords.lng}, User: ${userId}`,
    config: {
      systemInstruction: WRITE_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          record: { 
            type: Type.OBJECT, 
            properties: {
              id: { type: Type.STRING },
              license_plate: { type: Type.STRING },
              start_time: { type: Type.STRING },
              status: { type: Type.STRING }
            }
          },
          error: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const fetchDashboardData = async () => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "GET_ALL: { activeRecords: [], mapMarkers: [] }",
    config: {
      systemInstruction: READ_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          activeRecords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                license_plate: { type: Type.STRING },
                start_time: { type: Type.STRING },
                latitude: { type: Type.NUMBER },
                longitude: { type: Type.NUMBER },
                status: { type: Type.STRING }
              }
            }
          },
          mapMarkers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                status: { type: Type.STRING },
                license_plate: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const finishParking = async (recordId: string, userId: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `FINISH: ${recordId}, User: ${userId}`,
    config: {
      systemInstruction: WRITE_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text);
};

export const fetchActiveParking = async () => (await fetchDashboardData()).activeRecords;
export const fetchMapMarkers = async () => (await fetchDashboardData()).mapMarkers;
