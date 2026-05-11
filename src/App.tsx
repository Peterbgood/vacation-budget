import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// --- Firebase Setup ---
const firebaseConfig = {
  apiKey: "AIzaSyAV046KUBTHvxZUg3zuSiE5KLGm20MEuzA",
  authDomain: "vacation-ef39f.firebaseapp.com",
  projectId: "vacation-ef39f",
  storageBucket: "vacation-ef39f.firebasestorage.app",
  messagingSenderId: "1032501279884",
  appId: "1:1032501279884:web:a36860f006b8bba17e0fa9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Icons ---
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>;
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;

interface Row {
  id: string;
  label: string;
  costs: Record<number, number>;
}

export default function App() {
  const [locations, setLocations] = useState([{ id: 1, name: "Maui" }, { id: 2, name: "Tokyo" }]);
  const [rows, setRows] = useState<Row[]>([
    { id: '1', label: 'Flights', costs: { 1: 0, 2: 0 } },
    { id: '2', label: 'Hotel', costs: { 1: 0, 2: 0 } }
  ]);
  const [currency, setCurrency] = useState('$');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "budgets", "spreadsheet-data"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLocations(data.locations || []);
        setRows(data.rows || []);
      }
    });
    return () => unsub();
  }, []);

  const save = (l: any, r: any) => setDoc(doc(db, "budgets", "spreadsheet-data"), { locations: l, rows: r });

  const addCol = () => {
    const id = Date.now();
    const l = [...locations, { id, name: "New City" }];
    const r = rows.map(row => ({ ...row, costs: { ...row.costs, [id]: 0 } }));
    setLocations(l); setRows(r); save(l, r);
  };

  const addRow = () => {
    const costs: Record<number, number> = {};
    locations.forEach(loc => costs[loc.id] = 0);
    const r = [...rows, { id: crypto.randomUUID(), label: '', costs }];
    setRows(r); save(locations, r);
  };

  const deleteCol = (id: number) => {
    if (locations.length <= 1) return;
    const l = locations.filter(loc => loc.id !== id);
    const r = rows.map(row => {
        const c = { ...row.costs }; delete c[id];
        return { ...row, costs: c };
    });
    setLocations(l); setRows(r); save(l, r);
  };

  const deleteRow = (id: string) => {
    const r = rows.filter(row => row.id !== id);
    setRows(r); save(locations, r);
  };

  const exportCSV = () => {
    const headers = ["Category", ...locations.map(l => l.name)].join(",");
    const data = rows.map(r => [r.label, ...locations.map(l => r.costs[l.id])].join(",")).join("\n");
    const blob = new Blob([[headers, data].join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'budget.csv'; a.click();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Vacation Planner Pro</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cloud Sync Active</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold shadow-sm outline-none" onChange={(e) => setCurrency(e.target.value)}>
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
            </select>
            <button onClick={exportCSV} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 shadow-sm transition-all"><IconDownload /> Export</button>
            <button onClick={addCol} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md transition-all"><IconPlus /> Add Destination</button>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="w-48 p-4 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Category</th>
                  {locations.map(loc => (
                    <th key={loc.id} className="p-4 border-b border-l border-slate-200 group relative">
                      <div className="flex items-center justify-between">
                        <input className="w-full bg-transparent font-bold text-sm outline-none focus:text-blue-600" value={loc.name} onChange={(e) => {
                          const next = locations.map(l => l.id === loc.id ? {...l, name: e.target.value} : l);
                          setLocations(next); save(next, rows);
                        }} />
                        <button onClick={() => deleteCol(loc.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><IconX /></button>
                      </div>
                    </th>
                  ))}
                  <th className="w-12 p-4 border-b border-l border-slate-200"></th> {/* Action Column Header */}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-3 px-4 bg-slate-50/30">
                      <input placeholder="Item..." className="w-full bg-transparent outline-none font-semibold text-slate-600 text-xs" value={row.label} onChange={(e) => {
                        const next = rows.map(r => r.id === row.id ? {...r, label: e.target.value} : r);
                        setRows(next); save(locations, next);
                      }} />
                    </td>
                    {locations.map(loc => (
                      <td key={loc.id} className="p-3 px-4 border-l border-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-300 font-bold text-xs">{currency}</span>
                          <input type="number" className="w-full bg-transparent outline-none font-bold text-slate-800 text-sm"
                            value={row.costs[loc.id] === 0 ? 0 : row.costs[loc.id] || ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              const next = rows.map(r => r.id === row.id ? {...r, costs: {...r.costs, [loc.id]: val}} : r);
                              setRows(next); save(locations, next);
                            }} />
                        </div>
                      </td>
                    ))}
                    {/* The "Missing" Delete Row Button */}
                    <td className="p-3 border-l border-slate-100 text-center">
                      <button onClick={() => deleteRow(row.id)} className="opacity-0 group-hover:opacity-100 text-slate-200 hover:text-red-500 transition-all">
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="p-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Grand Total</td>
                  {locations.map(loc => (
                    <td key={loc.id} className="p-5 px-4 border-l border-slate-800">
                      <div className="text-xl font-black tracking-tighter">
                        {currency}{rows.reduce((sum, r) => sum + (r.costs[loc.id] || 0), 0).toLocaleString()}
                      </div>
                    </td>
                  ))}
                  <td className="p-5 border-l border-slate-800"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <button onClick={addRow} className="mt-6 flex items-center gap-2 bg-slate-200/50 text-slate-600 font-bold text-xs px-6 py-3 rounded-xl hover:bg-slate-200 transition-all shadow-sm">
          <IconPlus /> Add Row Item
        </button>
      </div>
    </div>
  );
}