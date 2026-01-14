
import { initDB } from './db';
import { TARIFA_HORA_CENTS } from '../constants';

const originalFetch = window.fetch.bind(window);

export const setupApiInterceptor = () => {
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.includes('/api/')) {
      try {
        const db = await initDB();

        // GET ACTIVE
        if (url.includes('/parking/active')) {
          return new Promise((resolve) => {
            const tx = db.transaction('parking_records', 'readonly');
            const store = tx.objectStore('parking_records');
            const req = store.getAll();
            req.onsuccess = () => {
              const active = req.result.filter((r: any) => r.status === 'estacionado');
              resolve(new Response(JSON.stringify(active), { status: 200 }));
            };
          });
        }

        // START
        if (url.includes('/parking/start') && init?.method === 'POST') {
          const body = JSON.parse(init.body as string);
          const newRecord = {
            id: crypto.randomUUID(),
            ...body,
            status: 'estacionado',
            date: new Date().toISOString().split('T')[0],
            rate_cents: TARIFA_HORA_CENTS,
            amount_cents: 0,
            paid: false,
            payment_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced: true
          };
          
          return new Promise((resolve) => {
            const tx = db.transaction('parking_records', 'readwrite');
            const store = tx.objectStore('parking_records');
            store.add(newRecord);
            tx.oncomplete = () => resolve(new Response(JSON.stringify(newRecord), { status: 201 }));
          });
        }

        // FINISH (REPARADO DEFINITIVAMENTE)
        if (url.includes('/parking/finish') && init?.method === 'POST') {
          const body = JSON.parse(init.body as string);
          
          return new Promise((resolve) => {
            const tx = db.transaction(['parking_records', 'audit_log'], 'readwrite');
            const store = tx.objectStore('parking_records');
            const audit = tx.objectStore('audit_log');
            
            const getReq = store.get(body.id);
            getReq.onsuccess = () => {
              const record = getReq.result;
              if (record) {
                const now = new Date();
                const diffMs = now.getTime() - new Date(record.start_time).getTime();
                const hours = Math.ceil(diffMs / 3600000) || 1;
                const finalAmount = hours * TARIFA_HORA_CENTS;

                record.status = 'retirado';
                record.end_time = now.toISOString();
                record.amount_cents = finalAmount;
                record.paid = true;
                record.payment_status = 'approved';
                record.updated_at = now.toISOString();

                store.put(record);
                audit.add({
                  id: crypto.randomUUID(),
                  action: 'FINISH',
                  parking_record_id: record.id,
                  user_id: body.ended_by,
                  created_at: now.toISOString()
                });

                tx.oncomplete = () => {
                  resolve(new Response(JSON.stringify({ success: true, amount: finalAmount }), { status: 200 }));
                };
              } else {
                resolve(new Response(JSON.stringify({ message: 'Registro no encontrado' }), { status: 404 }));
              }
            };
            getReq.onerror = () => resolve(new Response(null, { status: 500 }));
          });
        }

        return new Response(JSON.stringify([]), { status: 200 });
      } catch (err) {
        return new Response(JSON.stringify({ message: 'Error de servidor simulado' }), { status: 500 });
      }
    }

    return originalFetch(input, init);
  };

  Object.defineProperty(window, 'fetch', { value: customFetch, writable: true, configurable: true });
};
