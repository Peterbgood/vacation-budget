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
  
  // Tracks which row ID is currently awaiting a delete confirmation
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Vacation Planner Pro</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 italic">Real-time Cloud Sync</p>
          </div>
          
          <button onClick={addCol} className="md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md transition-all">
            <IconPlus /> Add Destination
          </button>
        </header>

        {/* --- MOBILE STACKED VIEW --- */}
        <div className="block md:hidden space-y-6">
          {locations.map(loc => (
            <div key={loc.id} className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 relative">
              <button onClick={() => deleteCol(loc.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><IconTrash /></button>
              <input 
                className="w-full bg-transparent font-black text-xl mb-4 outline-none text-blue-600 pr-10" 
                value={loc.name} 
                onChange={(e) => {
                  const next = locations.map(l => l.id === loc.id ? {...l, name: e.target.value} : l);
                  setLocations(next); save(next, rows);
                }} 
              />
              <div className="space-y-3">
                {rows.map((row, rIdx) => (
                  <div key={row.id} className="flex flex-col border-b border-slate-50 pb-3 gap-2">
                    {/* Header line for Mobile Item containing separate Reorder and Delete zones */}
                    <div className="flex items-center justify-between bg-slate-50/50 p-1.5 rounded-lg">
                      <div className="flex items-center gap-1">
                        <button disabled={rIdx === 0} onClick={() => moveRow(rIdx, 'up')} className="text-slate-400 hover:text-blue-500 p-1 disabled:opacity-20"><IconUp /></button>
                        <button disabled={rIdx === rows.length - 1} onClick={() => moveRow(rIdx, 'down')} className="text-slate-400 hover:text-blue-500 p-1 disabled:opacity-20"><IconDown /></button>
                      </div>
                      
                      {/* In-line Delete Confirmation for Mobile */}
                      {deletingRowId === row.id ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => deleteRow(row.id)} className="bg-red-500 text-white text-[10px] font-bold uppercase px-2 py-1 rounded">Confirm</button>
                          <button onClick={() => setDeletingRowId(null)} className="text-slate-400 text-[10px] font-bold uppercase px-1">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingRowId(row.id)} className="text-slate-300 hover:text-red-500 p-1"><IconTrash /></button>
                      )}
                    </div>

                    <div className="flex items-center font-bold text-lg">
                      <input 
                        className="flex-1 bg-transparent text-[10px] font-black uppercase text-slate-400 outline-none"
                        value={row.label}
                        placeholder="Item..."
                        onChange={(e) => {
                          const next = rows.map(r => r.id === row.id ? {...r, label: e.target.value} : r);
                          setRows(next); save(locations, next);
                        }}
                      />
                      <div className="flex items-center ml-2">
                        <span className="text-slate-300 mr-1 text-sm">$</span>
                        <input 
                          type="number" 
                          className="w-24 bg-transparent outline-none text-right font-bold text-slate-800"
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
              <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-100 flex justify-between items-end">
                <span className="text-[10px] font-black uppercase text-slate-400">Total Est.</span>
                <p className="text-3xl font-black tracking-tighter">
                  ${rows.reduce((sum, r) => sum + (r.costs[loc.id] || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* --- DESKTOP SPREADSHEET VIEW --- */}
        <div className="hidden md:block bg-white rounded-xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-slate-50">
                  {/* Left column expanded slightly to safely separate controls */}
                  <th className="w-72 p-4 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Expense Category</th>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rIdx) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-3 px-4 bg-slate-50/30 flex items-center justify-between gap-2">
                      
                      {/* Left Side: Reorder Buttons (Always accessible or on-hover) */}
                      <div className="flex items-center gap-0.5 shrink-0 bg-slate-100/60 p-1 rounded-md">
                        <button disabled={rIdx === 0} onClick={() => moveRow(rIdx, 'up')} className="text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors">
                          <IconUp />
                        </button>
                        <button disabled={rIdx === rows.length - 1} onClick={() => moveRow(rIdx, 'down')} className="text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors">
                          <IconDown />
                        </button>
                      </div>

                      {/* Middle: Text Input */}
                      <input placeholder="Item..." className="w-full bg-transparent outline-none font-semibold text-slate-600 text-xs px-2" value={row.label} onChange={(e) => {
                        const next = rows.map(r => r.id === row.id ? {...r, label: e.target.value} : r);
                        setRows(next); save(locations, next);
                      }} />

                      {/* Right Side: Non-popup Confirm Delete */}
                      <div className="shrink-0 flex items-center min-w-[24px]">
                        {deletingRowId === row.id ? (
                          <div className="flex items-center gap-1.5 animation-fadeIn">
                            <button onClick={() => deleteRow(row.id)} className="bg-red-500 hover:bg-red-600 text-[9px] text-white font-extrabold uppercase px-1.5 py-1 rounded shadow-sm">
                              Delete
                            </button>
                            <button onClick={() => setDeletingRowId(null)} className="text-[9px] text-slate-400 font-bold hover:text-slate-600 uppercase px-0.5">
                              X
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingRowId(row.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1">
                            <IconTrash />
                          </button>
                        )}
                      </div>
                      
                    </td>
                    {locations.map(loc => (
                      <td key={loc.id} className="p-3 px-4 border-l border-slate-100">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-300 font-bold text-xs">$</span>
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
                  </tr>
                ))}
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="p-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Grand Total</td>
                  {locations.map(loc => (
                    <td key={loc.id} className="p-5 px-4 border-l border-slate-800">
                      <div className="text-xl font-black tracking-tighter">
                        ${rows.reduce((sum, r) => sum + (r.costs[loc.id] || 0), 0).toLocaleString()}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <button onClick={addRow} className="mt-6 flex items-center justify-center gap-2 bg-white md:bg-slate-200/50 text-slate-600 font-bold text-xs px-6 py-4 md:py-3 rounded-xl hover:bg-slate-200 transition-all w-full md:w-auto shadow-sm">
          <IconPlus /> Add Row Item
        </button>
      </div>
    </div>
  );
}
