import React, { useMemo, useState } from "react";
import "./visitPlaces.css";

function VisitPlaces() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [form, setForm] = useState({ name: "", city: "", imageUrl: "", en: "", ar: "", ur: "", lat: "", lng: "" });

  const openAdd = () => { setEditingIndex(-1); setForm({ name: "", city: "", imageUrl: "", en: "", ar: "", ur: "", lat: "", lng: "" }); setShowModal(true); };
  const openEdit = (idx) => { setEditingIndex(idx); setForm(items[idx]); setShowModal(true); };
  const close = () => setShowModal(false);
  const save = (e) => { e?.preventDefault?.(); if (editingIndex >= 0) setItems((p)=>p.map((x,i)=>i===editingIndex?form:x)); else setItems((p)=>[{...form},...p]); setShowModal(false); };
  const list = useMemo(()=>items,[items]);

  const tryUseMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
    });
  };

  return (
    <div className="page places-page">
      <div className="page-header">
        <h2>Visit Places</h2>
        <button className="btn primary" onClick={openAdd}>Add Place</button>
      </div>

      <div className="grid-cards">
        {list.map((it, idx) => (
          <div key={idx} className="card item-card">
            {it.imageUrl && <img className="thumb" src={it.imageUrl} alt="place" />}
            <div className="item-body">
              <div className="item-text en">{it.name} — {it.city}</div>
              {it.en && <div className="item-text">{it.en}</div>}
              <div className="map-preview">
                {it.lat && it.lng ? (
                  <iframe title="map" width="100%" height="180" style={{ border: 0, borderRadius: 8 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${it.lat},${it.lng}&hl=en&z=15&output=embed`} />
                ) : <span className="muted">No location</span>}
              </div>
            </div>
            <button className="edit" onClick={() => openEdit(idx)}>✏️</button>
          </div>
        ))}
        {list.length === 0 && <div className="muted">No places yet. Click "Add Place" to create one.</div>}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal card" onClick={(e)=>e.stopPropagation()}>
            <h3>{editingIndex>=0?"Edit Place":"Add Place"}</h3>
            <form onSubmit={save} className="form">
              <label>Name</label>
              <input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} />
              <label>City</label>
              <input value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})} />
              <label>Image URL</label>
              <input value={form.imageUrl} onChange={(e)=>setForm({...form,imageUrl:e.target.value})} placeholder="https://..." />
              <label>English Description</label>
              <textarea value={form.en} onChange={(e)=>setForm({...form,en:e.target.value})} />
              <label>Arabic</label>
              <textarea dir="rtl" value={form.ar} onChange={(e)=>setForm({...form,ar:e.target.value})} />
              <label>Urdu</label>
              <textarea dir="rtl" value={form.ur} onChange={(e)=>setForm({...form,ur:e.target.value})} />
              <div className="form-grid">
                <div className="form-section">
                  <label>Latitude</label>
                  <input value={form.lat} onChange={(e)=>setForm({...form,lat:e.target.value})} />
                </div>
                <div className="form-section">
                  <label>Longitude</label>
                  <input value={form.lng} onChange={(e)=>setForm({...form,lng:e.target.value})} />
                </div>
                <div className="form-section">
                  <label>Quick</label>
                  <button type="button" className="btn" onClick={tryUseMyLocation}>Use my location</button>
                </div>
              </div>
              <div className="actions">
                <button type="button" className="btn" onClick={close}>Cancel</button>
                <button type="submit" className="btn primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisitPlaces;


