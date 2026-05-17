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
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IconUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>;
const IconDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Tracks which row ID is currently awaiting a delete confirmation
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "budgets", "spreadsheet-data"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLocations(data.locations || []);
        setRows(data.rows || []);
        setStartDate(data.startDate || '');
        setEndDate(data.endDate || '');
      }
    });
    return () => unsub();
  }, []);

  const save = (l: any, r: any, start = startDate, end = endDate) => {
    setDoc(doc(db, "budgets", "spreadsheet-data"), { 
      locations: l, 
      rows: r,
      startDate: start,
      endDate: end
    });
  };

  // --- Date Math Calculations ---
  const calculateNights = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateDaysUntil = () => {
    if (!startDate) return null;
    
    // Create dates strictly set to local midnight to prevent time-of-day offsets
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate + 'T00:00:00'); 
    
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today!";
    if (diffDays < 0) return "Passed";
    return `${diffDays} days left`;
  };

  const nights = calculateNights();
  const daysUntil = calculateDaysUntil();

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
    setDeletingRowId(null); // Reset confirmation state
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= rows.length) return;

    const updatedRows = [...rows];
    const temp = updatedRows[index];
    updatedRows[index] = updatedRows[nextIndex];
    updatedRows[nextIndex] = temp;

    setRows(updatedRows);
    save(locations, updatedRows);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-3 md:p-5 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- COMPACT HEADER WITH DATE METRICS --- */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 pb-2 border-b border-slate-200 gap-2 lg:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4 flex-wrap">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-black tracking-tight text-slate-800">Vacation Planner Pro</h1>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 italic">Cloud Sync</p>
            </div>
            
            {/* --- DATE PICKERS & CALCULATED METRICS --- */}
            <div className="flex items-center gap-2 text-slate-500 flex-wrap">
              <div className="flex items-center bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-1.5">Start:</span>
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer [color-scheme:light]"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    save(locations, rows, e.target.value, endDate);
                  }}
                />
              </div>
              
              <span className="text-xs font-bold text-slate-300">to</span>
              
              <div className="flex items-center bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold uppercase text-slate-400 mr-1.5">End:</span>
                <input 
                  type="date" 
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer [color-scheme:light]"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    save(locations, rows, startDate, e.target.value);
                  }}
                />
              </div>

              {/* Dynamic Vacation Badges */}
              {(nights !== null || daysUntil !== null) && (
                <div className="flex items-center gap-1.5 ml-1">
                  {nights !== null && (
                    <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">
                      {nights} {nights === 1 ? 'Night' : 'Nights'}
                    </span>
                  )}
                  {daysUntil !== null && (
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">
                      {daysUntil}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button onClick={addRow} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all border border-slate-200">
              <IconPlus /> Add Row Item
            </button>
            <button onClick={addCol} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-blue-700 shadow-sm transition-all">
              <IconPlus /> Add Destination
            </button>
          </div>
        </header>

        {/* --- MOBILE STACKED VIEW --- */}
        <div className="block md:hidden space-y-4">
          {locations.map(loc => (
            <div key={loc.id} className="bg-white rounded-xl p-4 shadow-md border border-slate-100 relative">
              <button onClick={() => deleteCol(loc.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500"><IconTrash /></button>
              <input 
                className="w-full bg-transparent font-black text-lg mb-2 outline-none text-blue-600 pr-8" 
                value={loc.name} 
                onChange={(e) => {
                  const next = locations.map(l => l.id === loc.id ? {...l, name: e.target.value} : l);
                  setLocations(next); save(next, rows);
                }} 
              />
              <div className="space-y-2">
                {rows.map((row, rIdx) => (
                  <div key={row.id} className="border-b border-slate-50 pb-2 group">
                    <div className="flex items-center justify-between font-bold text-base gap-2">
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 bg-slate-50 p-0.5 rounded">
                        <button disabled={rIdx === 0} onClick={() => moveRow(rIdx, 'up')} className="text-slate-400 hover:text-blue-500 p-0.5 disabled:opacity-20"><IconUp /></button>
                        <button disabled={rIdx === rows.length - 1} onClick={() => moveRow(rIdx, 'down')} className="text-slate-400 hover:text-blue-500 p-0.5 disabled:opacity-20"><IconDown /></button>
                      </div>

                      <input 
                        className="flex-1 min-w-0 bg-transparent text-[11px] font-black uppercase text-slate-400 outline-none placeholder-slate-300"
                        value={row.label}
                        placeholder="Item..."
                        onChange={(e) => {
                          const next = rows.map(r => r.id === row.id ? {...r, label: e.target.value} : r);
                          setRows(next); save(locations, next);
                        }}
                      />

                      <div className="shrink-0 flex items-center min-w-[20px] justify-center">
                        {deletingRowId === row.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded border border-red-100">
                            <button onClick={() => deleteRow(row.id)} className="bg-red-500 text-white text-[8px] font-black uppercase px-1 py-0.5 rounded">Del</button>
                            <button onClick={() => setDeletingRowId(null)} className="text-slate-400 text-[8px] font-black uppercase px-1">X</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingRowId(row.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-0.5 transition-opacity"><IconTrash /></button>
                        )}
                      </div>

                      <div className="flex items-center shrink-0 ml-1 bg-slate-50/50 px-1.5 py-0.5 rounded border border-slate-100">
                        <span className="text-slate-300 mr-0.5 text-xs">$</span>
                        <input 
                          type="number" 
                          className="w-16 bg-transparent outline-none text-right font-bold text-slate-800 text-xs"
                          value={row.costs[loc.id] === 0 ? 0 : row.costs[loc.id] || ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            const next = rows.map(r => r.id === row.id ? {...r, costs: {...r.costs, [loc.id]: val}} : r);
                            setRows(next); save(locations, next);
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-dashed border-slate-100 flex justify-between items-end">
                <span className="text-[9px] font-black uppercase text-slate-400">Total Est.</span>
                <p className="text-2xl font-black tracking-tighter">
                  ${rows.reduce((sum, r) => sum + (r.costs[loc.id] || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* --- DESKTOP SPREADSHEET VIEW --- */}
        <div className="hidden md:block bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="w-64 p-2.5 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Expense Category</th>
                  {locations.map(loc => (
                    <th key={loc.id} className="p-2.5 border-b border-l border-slate-200 group relative">
                      <div className="flex items-center justify-between">
                        <input className="w-full bg-transparent font-bold text-xs outline-none focus:text-blue-600" value={loc.name} onChange={(e) => {
                          const next = locations.map(l => l.id === loc.id ? {...l, name: e.target.value} : l);
                          setLocations(next); save(next, rows);
                        }} />
                        <button onClick={() => deleteCol(loc.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><IconX /></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rIdx) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-2 px-3 bg-slate-50/30 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-0.5 shrink-0 bg-slate-100/60 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button disabled={rIdx === 0} onClick={() => moveRow(rIdx, 'up')} className="text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors">
                          <IconUp />
                        </button>
                        <button disabled={rIdx === rows.length - 1} onClick={() => moveRow(rIdx, 'down')} className="text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors">
                          <IconDown />
                        </button>
                      </div>

                      <input placeholder="Item..." className="w-full bg-transparent outline-none font-semibold text-slate-600 text-xs px-1.5" value={row.label} onChange={(e) => {
                        const next = rows.map(r => r.id === row.id ? {...r, label: e.target.value} : r);
                        setRows(next); save(locations, next);
                      }} />

                      <div className="shrink-0 flex items-center min-w-[24px]">
                        {deletingRowId === row.id ? (
                          <div className="flex items-center gap-1 animation-fadeIn">
                            <button onClick={() => deleteRow(row.id)} className="bg-red-500 hover:bg-red-600 text-[9px] text-white font-extrabold uppercase px-1.5 py-0.5 rounded shadow-sm">
                              Delete
                            </button>
                            <button onClick={() => setDeletingRowId(null)} className="text-[9px] text-slate-400 font-bold hover:text-slate-600 uppercase px-0.5">
                              X
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingRowId(row.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-0.5">
                            <IconTrash />
                          </button>
                        )}
                      </div>
                    </td>
                    {locations.map(loc => (
                      <td key={loc.id} className="p-2 px-3 border-l border-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-300 font-bold text-xs">$</span>
                          <input type="number" className="w-full bg-transparent outline-none font-bold text-slate-800 text-xs"
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
                  </tr>
                ))}
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="p-3 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-center">Grand Total</td>
                  {locations.map(loc => (
                    <td key={loc.id} className="p-3 px-3 border-l border-slate-800">
                      <div className="text-lg font-black tracking-tighter">
                        ${rows.reduce((sum, r) => sum + (r.costs[loc.id] || 0), 0).toLocaleString()}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}