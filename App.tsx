
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, ParkingRecord } from './types';
import { startParking, fetchActiveParking, finishParking } from './services/api';
import { REFRESH_INTERVAL_MS, MERCEDES_COORDS } from './constants';
import ParkingCard from './components/ParkingCard';
import ParkingMap from './components/ParkingMap';

const App: React.FC = () => {
  const [view, setView] = useState<'panel' | 'mapa'>('panel');
  const [user, setUser] = useState<User | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [address, setAddress] = useState('');
  const [activeRecords, setActiveRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setUser({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'operador@mercedes.gob.ar',
      name: 'Operador Mercedes',
      role: UserRole.OPERATOR,
      created_at: new Date().toISOString()
    });

    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!isOnline) return;
    try {
      const records = await fetchActiveParking();
      setActiveRecords(records);
    } catch (err) {
      console.error("Error cargando datos:", err);
    }
  }, [isOnline]);

  useEffect(() => {
    loadData();
    timerRef.current = setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [loadData]);

  const geocodeAddress = async (query: string): Promise<{lat: number, lng: number}> => {
    if (!query) return MERCEDES_COORDS;
    try {
      // Buscamos la dirección específicamente en Mercedes, Corrientes, Argentina
      const fullQuery = `${query}, Mercedes, Corrientes, Argentina`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (e) {
      console.warn("Geocoding failed, using default coords", e);
    }
    return MERCEDES_COORDS;
  };

  const handleStartParking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate || loading || !user) return;
    
    setLoading(true);
    try {
      // 1. Obtener coordenadas reales de la dirección
      const coords = await geocodeAddress(address);
      
      // 2. Iniciar estacionamiento con datos precisos
      await startParking(licensePlate.toUpperCase(), user.id, {
        ...coords,
        address: address || 'Mercedes, Centro'
      });
      
      setLicensePlate('');
      setAddress('');
      await loadData();
      
      // Feedback visual: Si se ingresó dirección, ir al mapa para ver el punto
      if (address) {
        setView('mapa');
      }
    } catch (err: any) {
      alert("Error al iniciar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (id: string) => {
    if (!user) return;
    setActiveRecords(prev => prev.filter(r => r.id !== id));
    try {
      await finishParking(id, user.id);
    } catch (err: any) {
      alert("Error al finalizar: " + err.message);
      loadData();
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto bg-gray-50 border-x border-gray-200 shadow-2xl font-sans relative">
      <header className="bg-blue-900 text-white p-5 shadow-lg sticky top-0 z-[100] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter">SEM MERCEDES</h1>
          <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Municipalidad de Mercedes</p>
        </div>
        <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-red-500'}`}></div>
      </header>

      <main className="p-4">
        {view === 'mapa' ? (
          <div className="animate-fade-in">
             <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Mapa de Ocupación</h2>
             <ParkingMap markers={activeRecords.map(r => ({ 
               lat: r.latitude, 
               lng: r.longitude, 
               status: 'estacionado', 
               license_plate: r.license_plate, 
               address: r.address 
             }))} />
             <p className="text-[10px] text-center text-gray-400 mt-2 font-bold italic uppercase">Los puntos rojos indican vehículos activos geolocalizados</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-fade-in">
              <form onSubmit={handleStartParking} className="space-y-5">
                <div className="text-center">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Patente</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="ABC 123"
                    className="w-full text-4xl font-black text-center border-b-2 border-gray-100 focus:border-blue-600 focus:outline-none py-2 uppercase placeholder-gray-200"
                    required
                  />
                </div>
                
                <div className="text-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Dirección en Mercedes</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej: San Martin 1230"
                    className="w-full text-xl font-bold text-center border-b-2 border-gray-100 focus:border-blue-600 focus:outline-none py-2 placeholder-gray-200"
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-car-side"></i>}
                  {loading ? 'GEOLOCALIZANDO...' : 'REGISTRAR ESTACIONAMIENTO'}
                </button>
              </form>
            </section>

            <section className="space-y-3">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activos ({activeRecords.length})</h2>
              </div>
              {activeRecords.map(record => (
                <ParkingCard key={record.id} record={record} onFinish={handleFinish} />
              ))}
              {activeRecords.length === 0 && !loading && (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                  <i className="fas fa-parking text-gray-100 text-4xl mb-3 block"></i>
                  <p className="text-gray-300 font-bold italic">No hay registros activos</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t h-20 flex items-center justify-around z-[1000] shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <button onClick={() => setView('panel')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'panel' ? 'text-blue-600' : 'text-gray-400'}`}>
          <i className="fas fa-clipboard-list text-xl"></i>
          <span className="text-[9px] font-black uppercase">Ingreso</span>
        </button>
        <button onClick={() => setView('mapa')} className={`flex flex-col items-center gap-1 flex-1 ${view === 'mapa' ? 'text-blue-600' : 'text-gray-400'}`}>
          <i className="fas fa-map-location-dot text-xl"></i>
          <span className="text-[9px] font-black uppercase">Mapa SEM</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
