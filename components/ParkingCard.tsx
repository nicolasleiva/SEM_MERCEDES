
import React, { useState, useEffect } from 'react';
import { ParkingRecord } from '../types';
import { TARIFA_HORA_CENTS } from '../constants';

interface Props {
  record: ParkingRecord;
  onFinish: (id: string) => void;
}

const ParkingCard: React.FC<Props> = ({ record, onFinish }) => {
  const [elapsed, setElapsed] = useState('');
  const [currentCost, setCurrentCost] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const update = () => {
      const start = new Date(record.start_time).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;
      
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      
      setElapsed(`${hours}h ${minutes}m ${seconds}s`);

      // Tarifa municipal: Mínimo 1 hora, luego se redondea hacia arriba por hora
      const totalHours = Math.ceil(diffMs / 3600000) || 1;
      setCurrentCost(totalHours * TARIFA_HORA_CENTS);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [record.start_time]);

  const handleFinishClick = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      await onFinish(record.id);
    } finally {
      setIsFinishing(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(cents / 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3 transition-all hover:shadow-md animate-fade-in relative overflow-hidden">
      {isFinishing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <i className="fas fa-circle-notch fa-spin text-blue-900 text-2xl"></i>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-xl font-black text-blue-900 tracking-wider uppercase leading-none">{record.license_plate}</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 mt-1.5">
            <i className="fas fa-map-marker-alt text-red-500"></i>
            {record.address || 'Ubicación Mercedes'}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black rounded-full uppercase tracking-widest border border-green-200">En Calzada</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-center">
          <p className="text-[8px] text-gray-400 font-black uppercase mb-0.5 tracking-widest">Tiempo Total</p>
          <p className="text-sm font-mono font-bold text-gray-800">{elapsed}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-center">
          <p className="text-[8px] text-blue-600 font-black uppercase mb-0.5 tracking-widest">Monto a Cobrar</p>
          <p className="text-sm font-black text-blue-800 italic">{formatCurrency(currentCost)}</p>
        </div>
      </div>

      <button
        disabled={isFinishing}
        onClick={handleFinishClick}
        className="w-full bg-blue-900 hover:bg-black disabled:bg-gray-400 text-white font-black py-4 rounded-xl transition-all flex flex-col items-center justify-center gap-0 active:scale-[0.98] shadow-lg shadow-blue-100"
      >
        <span className="text-xs tracking-widest">FINALIZAR Y COBRAR</span>
        <span className="text-[9px] opacity-60 font-medium uppercase mt-0.5 tracking-tighter">Confirmar retiro de {record.license_plate}</span>
      </button>
    </div>
  );
};

export default ParkingCard;
