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

const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>;
const IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;

interface Row {
  id: string;
  label: string;
  costs: Record<number, number>;
}

export default function App() {
  const [locations, setLocations] = useState([
    { id: 1, name: "Maui" }, { id: 2, name: "Tokyo" }
  ]);

  const [rows, setRows] = useState<Row[]>([
    { id: '1', label: 'Flights', costs: { 1: 0, 2: 0 } },
    { id: '2', label: 'Hotel', costs: { 1: 0, 2: 0 } }
  ]);

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

  const saveToFirebase = async (newLocs: any, newRows: any) => {
    await setDoc(doc(db, "budgets", "spreadsheet-data"), { locations: newLocs, rows: newRows });
  };

  const addLocation = () => {
    if (locations.length >= 10) return; // Cap at 10
    const newId = Date.now();
    const newLocs = [...locations, { id: newId, name: "New City" }];
    const newRows = rows.map(row => ({ ...row, costs: { ...row.costs, [newId]: 0 } }));
    setLocations(newLocs);
    setRows(newRows);
    saveToFirebase(newLocs, newRows);
  };

  const deleteLocation = (locId: number) => {
    if (locations.length <= 1) return;
    const newLocs = locations.filter(l => l.id !== locId);
    const newRows = rows.map(row => {
      const updatedCosts = { ...row.costs };
      delete updatedCosts[locId];
      return { ...row, costs: updatedCosts };
    });
    setLocations(newLocs);
    setRows(newRows);
    saveToFirebase(newLocs, newRows);
  };

  const updateLocation = (id: number, val: string) => {
    const next = locations.map(l => l.id === id ? { ...l, name: val } : l);
    setLocations(next);
    saveToFirebase(next, rows);
  };

  const updateRowLabel = (rowId: string, val: string) => {
    const next = rows.map(r => r.id === rowId ? { ...r, label: val } : r);
    setRows(next);
    saveToFirebase(locations, next);
  };

  const updateCost = (rowId: string, locId: number, val: string) => {
    const next = rows.map(r => {
      if (r.id === rowId) {
        return { ...r, costs: { ...r.costs, [locId]: parseFloat(val) || 0 } };
      }
      return r;
    });
    setRows(next);
    saveToFirebase(locations, next);
  };

  const addRow = () => {
    const newCosts: Record<number, number> = {};
    locations.forEach(l => newCosts[l.id] = 0);
    const next = [...rows, { id: crypto.randomUUID(), label: '', costs: newCosts }];
    setRows(next);
    saveToFirebase(locations, next);
  };

  const deleteRow = (rowId: string) => {
    const next = rows.filter(r => r.id !== rowId);
    setRows(next);
    saveToFirebase(locations, next);
  };

  const getColTotal = (locId: number) => {
    return rows.reduce((sum, row) => sum + (row.costs[locId] || 0), 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2 md:p-6 text-slate-900 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Vacation Budget</h1>
            <p className="text-slate-400 font-medium text-xs">Side-by-side comparison</p>
          </div>
          <button 
            onClick={addLocation}
            className="flex items-center justify-center gap-1 bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md"
          >
            <IconPlus /> Add Column
          </button>
        </header>

        {/* MOBILE VIEW */}
        <div className="block md:hidden space-y-4">
          {locations.map(loc => (
            <div key={loc.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative">
              <button onClick={() => deleteLocation(loc.id)} className="absolute top-3 right-3 text-slate-200"><IconTrash /></button>
              <input className="w-full bg-transparent font-bold text-lg mb-4 outline-none text-blue-600" value={loc.name} onChange={(e) => updateLocation(loc.id, e.target.value)} />
              <div className="space-y-2">
                {rows.map(row => (
                  <div key={row.id} className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{row.label || 'Item'}</span>
                    <div className="flex items-center text-sm font-bold">
                      <span className="text-slate-300 mr-0.5">$</span>
                      <input type="number" className="w-16 bg-transparent text-right outline-none" value={row.costs[loc.id] || ''} onChange={(e) => updateCost(row.id, loc.id, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-dashed border-slate-100 text-right">
                <p className="text-xl font-black tracking-tighter">${getColTotal(loc.id).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* COMPACT DESKTOP VIEW */}
        <div className="hidden md:block shadow-xl rounded-2xl border border-slate-100 bg-white">
          <table className="w-full border-collapse text-left table-fixed">
            <thead>
              <tr className="bg-slate-50/30">
                <th className="p-3 border-b border-slate-100 w-40 text-[9px] font-black uppercase tracking-widest text-slate-400">Category</th>
                {locations.map(loc => (
                  <th key={loc.id} className="p-3 border-b border-slate-100 group relative">
                    <div className="flex items-center justify-between gap-1">
                      <input className="w-full bg-transparent font-bold text-xs outline-none focus:text-blue-600" value={loc.name} onChange={(e) => updateLocation(loc.id, e.target.value)} />
                      <button onClick={() => deleteLocation(loc.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><IconX /></button>
                    </div>
                  </th>
                ))}
                <th className="p-3 border-b border-slate-100 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-2 px-3">
                    <input placeholder="Expense..." className="w-full bg-transparent outline-none font-medium text-slate-500 text-xs" value={row.label} onChange={(e) => updateRowLabel(row.id, e.target.value)} />
                  </td>
                  {locations.map(loc => (
                    <td key={loc.id} className="p-2 px-3 border-l border-slate-50/50">
                      <div className="flex items-center">
                        <span className="text-slate-300 font-bold text-[10px]">$</span>
                        <input type="number" className="w-full bg-transparent outline-none font-bold text-slate-800 text-sm" value={row.costs[loc.id] || ''} onChange={(e) => updateCost(row.id, loc.id, e.target.value)} />
                      </div>
                    </td>
                  ))}
                  <td className="p-2 text-center">
                    <button onClick={() => deleteRow(row.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100"><IconTrash /></button>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white">
                <td className="p-4 px-3 text-[9px] font-black uppercase tracking-widest">Total</td>
                {locations.map(loc => (
                  <td key={loc.id} className="p-4 px-3 border-l border-slate-800">
                    <div className="text-base font-black tracking-tighter">${getColTotal(loc.id).toLocaleString()}</div>
                  </td>
                ))}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <button 
          onClick={addRow}
          className="mt-4 flex items-center justify-center gap-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-500 font-bold text-xs px-6 py-2.5 rounded-xl transition-all w-full md:w-auto"
        >
          <IconPlus /> Add Row
        </button>
      </div>
    </div>
  );
}