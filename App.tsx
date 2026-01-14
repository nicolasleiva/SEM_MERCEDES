
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, ParkingRecord } from './types';
import { startParking, fetchDashboardData, finishParking } from './services/api';
import { REFRESH_INTERVAL_MS } from './constants';
import ParkingCard from './components/ParkingCard';
import ParkingMap from './components/ParkingMap';

const App: React.FC = () => {
  const [view, setView] = useState<'panel' | 'mapa'>('panel');
  const [user, setUser] = useState<User | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [activeRecords, setActiveRecords] = useState<ParkingRecord[]>([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  const backoffMultiplier = useRef(1);
  // Fix: Use 'any' or 'number' for browser setTimeout reference to avoid NodeJS.Timeout error
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setUser({
      id: 'usr-admin-mercedes',
      email: 'operaciones@mercedes.gob.ar',
      name: 'Admin SEM',
      role: UserRole.ADMIN,
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
      const data = await fetchDashboardData();
      setActiveRecords(data.activeRecords || []);
      setMapMarkers(data.mapMarkers || []);
      setQuotaExceeded(false);
      backoffMultiplier.current = 1;
    } catch (err: any) {
      if (err?.message?.includes('429')) {
        setQuotaExceeded(true);
        // Incrementar tiempo de espera: 15s -> 30s -> 60s -> 120s -> 240s
        backoffMultiplier.current = Math.min(backoffMultiplier.current * 2, 16);
        console.error(`Cuota excedida. Pausando refresco por ${backoffMultiplier.current * REFRESH_INTERVAL_MS / 1000}s`);
      } else {
        console.error("Error de datos:", err);
      }
    }
  }, [isOnline]);

  useEffect(() => {
    const runTick = async () => {
      await loadData();
      const delay = REFRESH_INTERVAL_MS * backoffMultiplier.current;
      timerRef.current = setTimeout(runTick, delay);
    };

    runTick();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loadData]);

  const handleStartParking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate || loading) return;
    setLoading(true);

    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 })
      );
      
      const result = await startParking(licensePlate, user!.id, { 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude 
      });

      if (result.success) {
        setLicensePlate('');
        backoffMultiplier.current = 1; // Resetear backoff tras acción exitosa
        await loadData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err: any) {
      if (err?.message?.includes('429')) {
        alert("Límite de la Municipalidad alcanzado. Por favor, espere 1 minuto.");
      } else {
        alert("Error de conexión o GPS. Asegúrese de tener el GPS encendido.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async (id: string) => {
    if (!confirm("Confirmar cobro y finalización")) return;
    setLoading(true);
    try {
      await finishParking(id, user!.id);
      backoffMultiplier.current = 1;
      await loadData();
    } catch (err: any) {
      alert(err?.message?.includes('429') ? "Error de cuota. Reintente." : "Error al procesar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto bg-gray-50 border-x border-gray-200 shadow-2xl overflow-hidden font-sans">
      {/* Aviso de Cuota */}
      {quotaExceeded && (
        <div className="bg-amber-500 text-white text-[10px] py-1 text-center font-black animate-pulse uppercase tracking-widest z-[60] relative">
          Modo Ahorro de Cuota Activo - Reintentando en {Math.round((REFRESH_INTERVAL_MS * backoffMultiplier.current) / 1000)}s
        </div>
      )}

      <header className="bg-blue-900 text-white p-5 shadow-lg sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tighter italic leading-none">SEM MERCEDES</h1>
            <p className="text-[10px] font-bold text-blue-300 mt-1 uppercase">Municipalidad de Mercedes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-bold uppercase">{isOnline ? 'Conectado' : 'Offline'}</span>
          </div>
        </div>
      </header>

      <main className="p-4">
        {view === 'mapa' ? (
          <div className="animate-fade-in">
            <h2 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">Ocupación de Calzada</h2>
            <ParkingMap markers={mapMarkers} />
          </div>
        ) : (
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
              <form onSubmit={handleStartParking} className="space-y-4">
                <div className="text-center">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Ingreso de Patente</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="ABC 123"
                    className="w-full text-4xl font-black text-center border-b-4 border-blue-50 focus:border-blue-600 focus:outline-none py-2 placeholder-gray-100 transition-all uppercase"
                    required
                  />
                </div>
                <button
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-3 transition-transform active:scale-95"
                >
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-play"></i> REGISTRAR</>}
                </button>
              </form>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Registros Activos ({activeRecords.length})</h2>
              </div>
              <div className="space-y-3">
                {activeRecords.map(record => (
                  <ParkingCard key={record.id} record={record} onFinish={handleFinish} />
                ))}
                {activeRecords.length === 0 && !loading && (
                  <div className="bg-white/50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold text-sm italic">Sin actividad registrada</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 backdrop-blur-md border-t border-gray-100 h-20 flex items-center justify-around px-6 z-50">
        <button onClick={() => setView('panel')} className={`flex flex-col items-center gap-1 ${view === 'panel' ? 'text-blue-600' : 'text-gray-400'}`}>
          <i className="fas fa-layer-group text-2xl"></i>
          <span className="text-[10px] font-black uppercase">Panel</span>
        </button>
        <button onClick={() => setView('mapa')} className={`flex flex-col items-center gap-1 ${view === 'mapa' ? 'text-blue-600' : 'text-gray-400'}`}>
          <i className="fas fa-map-marked-alt text-2xl"></i>
          <span className="text-[10px] font-black uppercase">Mapa</span>
        </button>
      </nav>
    </div>
  );
};

export default App;