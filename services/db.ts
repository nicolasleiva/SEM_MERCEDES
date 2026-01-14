
import { DB_NAME, STORE_NAME } from '../constants';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // Versión 2 para nuevas tablas
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      
      // Cola de sincronización offline
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      
      // Espejo local de parking_records (Google Sheets)
      if (!db.objectStoreNames.contains('parking_records')) {
        db.createObjectStore('parking_records', { keyPath: 'id' });
      }

      // Registro de auditoría local
      if (!db.objectStoreNames.contains('audit_log')) {
        db.createObjectStore('audit_log', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const addToQueue = async (data: any) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({ ...data, synced: false });
  return new Promise((resolve) => (tx.oncomplete = resolve));
};

export const getQueue = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const removeFromQueue = async (id: string) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return new Promise((resolve) => (tx.oncomplete = resolve));
};
