import React, { useState, useEffect } from 'react';
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
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>;

export default function App() {
  const [locations, setLocations] = useState([
    { id: 1, name: "Maui" },
    { id: 2, name: "Tokyo" },
    { id: 3, name: "Paris" },
    { id: 4, name: "London" }
  ]);

  const [rows, setRows] = useState([
    { id: '1', label: 'Flights', costs: { 1: 0, 2: 0, 3: 0, 4: 0 } },
    { id: '2', label: 'Hotel', costs: { 1: 0, 2: 0, 3: 0, 4: 0 } }
  ]);

  // Sync from Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "budgets", "spreadsheet-data"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setLocations(data.locations);
        setRows(data.rows);
      }
    });
    return () => unsub();
  }, []);

  const saveToFirebase = async (newLocs: any, newRows: any) => {
    await setDoc(doc(db, "budgets", "spreadsheet-data"), { 
      locations: newLocs, 
      rows: newRows 
    });
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
    const next = [...rows, { id: crypto.randomUUID(), label: '', costs: { 1: 0, 2: 0, 3: 0, 4: 0 } }];
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
    <div className="min-h-screen bg-white p-4 md:p-12 font-sans text-slate-900">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-2">Vacation Budget Pro</h1>
          <p className="text-slate-400 font-medium">Multi-Destination Comparison Spreadsheet</p>
        </header>

        <div className="overflow-x-auto shadow-2xl shadow-slate-200/50 rounded-3xl border border-slate-100">
          <table className="w-full border-collapse bg-white text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 border-b border-slate-100 w-64 text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Category</th>
                {locations.map(loc => (
                  <th key={loc.id} className="p-6 border-b border-slate-100 min-w-[200px]">
                    <input 
                      className="w-full bg-transparent font-bold text-xl outline-none focus:text-blue-600 transition-colors"
                      value={loc.name}
                      onChange={(e) => updateLocation(loc.id, e.target.value)}
                    />
                  </th>
                ))}
                <th className="p-6 border-b border-slate-100 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="p-4 px-6">
                    <input 
                      placeholder="e.g. Flights"
                      className="w-full bg-transparent outline-none font-medium text-slate-600 placeholder:text-slate-300"
                      value={row.label}
                      onChange={(e) => updateRowLabel(row.id, e.target.value)}
                    />
                  </td>
                  {locations.map(loc => (
                    <td key={loc.id} className="p-4 px-6">
                      <div className="relative flex items-center">
                        <span className="absolute left-0 text-slate-300 font-bold">$</span>
                        <input 
                          type="number"
                          className="w-full bg-transparent pl-4 outline-none font-mono font-bold text-slate-800"
                          value={row.costs[loc.id] || ''}
                          onChange={(e) => updateCost(row.id, loc.id, e.target.value)}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="p-4 px-6 text-center">
                    <button 
                      onClick={() => deleteRow(row.id)}
                      className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {/* TOTAL ROW */}
              <tr className="bg-slate-900 text-white">
                <td className="p-8 px-6 text-[10px] font-black uppercase tracking-[0.3em]">Estimated Total</td>
                {locations.map(loc => (
                  <td key={loc.id} className="p-8 px-6">
                    <div className="text-3xl font-black tracking-tighter">
                      ${getColTotal(loc.id).toLocaleString()}
                    </div>
                  </td>
                ))}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <button 
          onClick={addRow}
          className="mt-8 flex items-center gap-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 font-bold px-8 py-4 rounded-2xl transition-all active:scale-95"
        >
          <IconPlus /> Add Row
        </button>
      </div>
    </div>
  );
}