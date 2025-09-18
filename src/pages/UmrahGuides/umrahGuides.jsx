import React, { useMemo, useState, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { guidesAPI } from "../../services/api";
import toast from "react-hot-toast";
import "./umrahGuides.css";

const UMRAH_STEPS = [
  { id: 1, name: "Ihram", description: "Entering the state of Ihram" },
  { id: 2, name: "Tawaf", description: "Circumambulation around the Kaaba" },
  { id: 3, name: "Sa'i", description: "Walking between Safa and Marwa" },
  { id: 4, name: "Tahallul", description: "Shaving or trimming hair" },
  { id: 5, name: "Completion", description: "Umrah completion and celebration" }
];

function UmrahGuides() {
  const { language } = useApp();
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStep, setSelectedStep] = useState("");
  const [form, setForm] = useState({ 
    stepName: "",
    stepOrder: 1,
    description: {
      en: "",
      ar: "",
      am: "",
      or: ""
    },
    instructions: {
      en: "",
      ar: "",
      am: "",
      or: ""
    },
    tips: {
      en: "",
      ar: "",
      am: "",
      or: ""
    },
    imageUrl: "", 
    audioUrl: "", 
    videoUrl: "",
    duration: "",
    location: "",
    prerequisites: []
  });

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      setLoading(true);
      const response = await guidesAPI.getAll();
      setItems(response.data || []);
    } catch (error) {
      console.error('Error loading guides:', error);
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { 
    setEditingIndex(-1); 
    setForm({ 
      stepName: "",
      stepOrder: 1,
      description: { en: "", ar: "", am: "", or: "" },
      instructions: { en: "", ar: "", am: "", or: "" },
      tips: { en: "", ar: "", am: "", or: "" },
      imageUrl: "", 
      audioUrl: "", 
      videoUrl: "",
      duration: "",
      location: "",
      prerequisites: []
    }); 
    setShowModal(true); 
  };
  
  const openEdit = (idx) => { 
    setEditingIndex(idx); 
    setForm(items[idx]); 
    setShowModal(true); 
  };
  
  const close = () => setShowModal(false);

  const save = async (e) => {
    e?.preventDefault?.();
    
    if (!form.stepName || !form.description.en) {
      toast.error("Step name and English description are required");
      return;
    }

    try {
      setLoading(true);
      
      if (editingIndex >= 0) {
        const response = await guidesAPI.update(items[editingIndex].id, form);
        setItems((prev) => prev.map((x, i) => (i === editingIndex ? response.data : x)));
        toast.success("Guide updated successfully");
      } else {
        const response = await guidesAPI.create(form);
        setItems((prev) => [response.data, ...prev]);
        toast.success("Guide added successfully");
      }
      
    setShowModal(false);
    } catch (error) {
      console.error('Error saving guide:', error);
      toast.error("Failed to save guide");
    } finally {
      setLoading(false);
    }
  };

  const deleteGuide = async (id) => {
    if (!window.confirm("Are you sure you want to delete this guide?")) return;
    
    try {
      await guidesAPI.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success("Guide deleted successfully");
    } catch (error) {
      console.error('Error deleting guide:', error);
      toast.error("Failed to delete guide");
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.stepName.toLowerCase().includes(query) ||
        item.description.en.toLowerCase().includes(query) ||
        item.description.ar.toLowerCase().includes(query) ||
        item.description.am.toLowerCase().includes(query) ||
        item.description.or.toLowerCase().includes(query) ||
        item.instructions.en.toLowerCase().includes(query)
      );
    }
    
    if (selectedStep) {
      filtered = filtered.filter(item => item.stepName === selectedStep);
    }
    
    return filtered.sort((a, b) => a.stepOrder - b.stepOrder);
  }, [items, searchQuery, selectedStep]);

  return (
    <div className="page guides-page">
      <div className="page-header">
        <h2>Umrah Guides</h2>
        <button className="btn primary" onClick={openAdd} disabled={loading}>
          {loading ? "Loading..." : "Add Guide"}
        </button>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="step-filter">
          <select
            value={selectedStep}
            onChange={(e) => setSelectedStep(e.target.value)}
          >
            <option value="">All Steps</option>
            {UMRAH_STEPS.map(step => (
              <option key={step.id} value={step.name}>{step.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="guides-timeline">
        {filteredItems.map((item, idx) => (
          <div key={item.id || idx} className="guide-step">
            <div className="step-number">{item.stepOrder}</div>
            <div className="step-content">
              <div className="step-header">
                <h3 className="step-title">{item.stepName}</h3>
                <div className="step-actions">
                  <button className="btn-icon" onClick={() => openEdit(idx)} title="Edit">
                    ✏️
                  </button>
                  <button className="btn-icon danger" onClick={() => deleteGuide(item.id)} title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
              
              {item.imageUrl && (
                <div className="step-image">
                  <img src={item.imageUrl} alt={`${item.stepName} guide`} />
                </div>
              )}
              
              <div className="step-description">
                <h4>Description</h4>
                <div className="multilingual-content">
                  <div className="content-item en">
                    <strong>English:</strong> {item.description.en}
                  </div>
                  {item.description.ar && (
                    <div className="content-item ar" dir="rtl">
                      <strong>العربية:</strong> {item.description.ar}
                    </div>
                  )}
                  {item.description.am && (
                    <div className="content-item am">
                      <strong>Amharic:</strong> {item.description.am}
                    </div>
                  )}
                  {item.description.or && (
                    <div className="content-item or">
                      <strong>Oromo:</strong> {item.description.or}
                    </div>
                  )}
                </div>
              </div>

              {item.instructions.en && (
                <div className="step-instructions">
                  <h4>Instructions</h4>
                  <div className="multilingual-content">
                    <div className="content-item en">
                      <strong>English:</strong> {item.instructions.en}
                    </div>
                    {item.instructions.ar && (
                      <div className="content-item ar" dir="rtl">
                        <strong>العربية:</strong> {item.instructions.ar}
                      </div>
                    )}
                    {item.instructions.am && (
                      <div className="content-item am">
                        <strong>Amharic:</strong> {item.instructions.am}
                      </div>
                    )}
                    {item.instructions.or && (
                      <div className="content-item or">
                        <strong>Oromo:</strong> {item.instructions.or}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.tips.en && (
                <div className="step-tips">
                  <h4>Tips & Reminders</h4>
                  <div className="multilingual-content">
                    <div className="content-item en">
                      <strong>English:</strong> {item.tips.en}
                    </div>
                    {item.tips.ar && (
                      <div className="content-item ar" dir="rtl">
                        <strong>العربية:</strong> {item.tips.ar}
                      </div>
                    )}
                    {item.tips.am && (
                      <div className="content-item am">
                        <strong>Amharic:</strong> {item.tips.am}
                      </div>
                    )}
                    {item.tips.or && (
                      <div className="content-item or">
                        <strong>Oromo:</strong> {item.tips.or}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="step-meta">
                {item.duration && (
                  <div className="meta-item">
                    <span className="meta-label">Duration:</span>
                    <span className="meta-value">{item.duration}</span>
                  </div>
                )}
                {item.location && (
                  <div className="meta-item">
                    <span className="meta-label">Location:</span>
                    <span className="meta-value">{item.location}</span>
                  </div>
                )}
              </div>

              <div className="step-media">
                {item.audioUrl && (
                  <div className="media-item">
                    <h5>Audio Guide</h5>
                    <audio controls>
                      <source src={item.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                
                {item.videoUrl && (
                  <div className="media-item">
                    <h5>Video Guide</h5>
                    <video controls width="100%">
                      <source src={item.videoUrl} type="video/mp4" />
                      Your browser does not support the video element.
                    </video>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredItems.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📘</div>
            <h3>No guides found</h3>
            <p>
              {searchQuery || selectedStep 
                ? "Try adjusting your search or filter criteria" 
                : "Click 'Add Guide' to create your first Umrah guide"
              }
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>{editingIndex >= 0 ? "Edit Guide" : "Add Guide"}</h3>
            <form onSubmit={save} className="guide-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="stepName">Step Name *</label>
                  <input
                    id="stepName"
                    type="text"
                    value={form.stepName}
                    onChange={(e) => setForm({ ...form, stepName: e.target.value })}
                    placeholder="e.g., Ihram, Tawaf, Sa'i"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="stepOrder">Step Order *</label>
                  <input
                    id="stepOrder"
                    type="number"
                    min="1"
                    value={form.stepOrder}
                    onChange={(e) => setForm({ ...form, stepOrder: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description-en">Description (English) *</label>
                <textarea
                  id="description-en"
                  value={form.description.en}
                  onChange={(e) => setForm({ 
                    ...form, 
                    description: { ...form.description, en: e.target.value }
                  })}
                  placeholder="Enter step description in English"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description-ar">Description (Arabic)</label>
                <textarea
                  id="description-ar"
                  dir="rtl"
                  value={form.description.ar}
                  onChange={(e) => setForm({ 
                    ...form, 
                    description: { ...form.description, ar: e.target.value }
                  })}
                  placeholder="أدخل وصف الخطوة بالعربية"
                />
              </div>

              <div className="form-group">
                <label htmlFor="instructions-en">Instructions (English)</label>
                <textarea
                  id="instructions-en"
                  value={form.instructions.en}
                  onChange={(e) => setForm({ 
                    ...form, 
                    instructions: { ...form.instructions, en: e.target.value }
                  })}
                  placeholder="Enter detailed instructions"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tips-en">Tips & Reminders (English)</label>
                <textarea
                  id="tips-en"
                  value={form.tips.en}
                  onChange={(e) => setForm({ 
                    ...form, 
                    tips: { ...form.tips, en: e.target.value }
                  })}
                  placeholder="Enter helpful tips and reminders"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration</label>
                  <input
                    id="duration"
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g., 30 minutes, 1 hour"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g., Masjid al-Haram, Safa-Marwa"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="imageUrl">Image URL</label>
                  <input
                    id="imageUrl"
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="audioUrl">Audio URL</label>
                  <input
                    id="audioUrl"
                    type="url"
                    value={form.audioUrl}
                    onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="videoUrl">Video URL</label>
                <input
                  id="videoUrl"
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-actions">
                <button className="btn" type="button" onClick={close}>
                  Cancel
                </button>
                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Guide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UmrahGuides;


