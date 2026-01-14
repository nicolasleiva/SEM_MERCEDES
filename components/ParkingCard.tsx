
import React, { useState, useEffect } from 'react';
import { ParkingRecord } from '../types';
import { TARIFA_HORA_CENTS, TIMEZONE } from '../constants';

interface Props {
  record: ParkingRecord;
  onFinish: (id: string) => void;
}

const ParkingCard: React.FC<Props> = ({ record, onFinish }) => {
  const [elapsed, setElapsed] = useState('');
  const [currentCost, setCurrentCost] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const start = new Date(record.start_time).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;
      
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      
      setElapsed(`${hours}h ${minutes}m ${seconds}s`);
      
      const totalMinutes = Math.ceil(diffMs / 60000);
      const totalHours = Math.ceil(totalMinutes / 60);
      setCurrentCost(totalHours * TARIFA_HORA_CENTS);
    }, 1000);

    return () => clearInterval(timer);
  }, [record.start_time]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(cents / 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-3 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-xl font-bold text-gray-800 tracking-wider uppercase">{record.license_plate}</h3>
          <p className="text-xs text-gray-500 font-medium">Desde: {new Date(record.start_time).toLocaleTimeString('es-AR', { timeZone: TIMEZONE })}</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Activo</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 my-4">
        <div className="bg-blue-50 p-2 rounded-lg">
          <p className="text-[10px] text-blue-600 font-bold uppercase">Transcurrido</p>
          <p className="text-lg font-mono font-bold text-blue-800">{elapsed}</p>
        </div>
        <div className="bg-amber-50 p-2 rounded-lg">
          <p className="text-[10px] text-amber-600 font-bold uppercase">Costo Actual</p>
          <p className="text-lg font-mono font-bold text-amber-800">{formatCurrency(currentCost)}</p>
        </div>
      </div>

      <button
        onClick={() => onFinish(record.id)}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <i className="fas fa-sign-out-alt"></i>
        Finalizar Estacionamiento
      </button>
    </div>
  );
};

export default ParkingCard;
