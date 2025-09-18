import React, { useMemo, useState, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { duasAPI } from "../../services/api";
import toast from "react-hot-toast";
import "./dua.css";

const DUA_CATEGORIES = [
  "Ihram",
  "Tawaf", 
  "Sa'i",
  "Tahallul",
  "General",
  "Prayer Times",
  "Safety",
  "Guidance"
];

function Dua() {
  const { language } = useApp();
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    category: "General",
    arabic: "", 
    transliteration: "",
    translation: {
      en: "",
      am: "",
      or: ""
    },
    audioUrl: "", 
    imageUrl: "",
    description: ""
  });

  useEffect(() => {
    loadDuas();
  }, []);

  const loadDuas = async () => {
    try {
      setLoading(true);
      const response = await duasAPI.getAll();
      setItems(response.data || []);
    } catch (error) {
      console.error('Error loading duas:', error);
      toast.error('Failed to load duas');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { 
    setEditingIndex(-1); 
    setForm({ 
      category: "General",
      arabic: "", 
      transliteration: "",
      translation: { en: "", am: "", or: "" },
      audioUrl: "", 
      imageUrl: "",
      description: ""
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
    
    if (!form.arabic || !form.translation.en) {
      toast.error("Arabic text and English translation are required");
      return;
    }

    try {
      setLoading(true);
      
      if (editingIndex >= 0) {
        const response = await duasAPI.update(items[editingIndex].id, form);
        setItems((prev) => prev.map((x, i) => (i === editingIndex ? response.data : x)));
        toast.success("Dua updated successfully");
      } else {
        const response = await duasAPI.create(form);
        setItems((prev) => [response.data, ...prev]);
        toast.success("Dua added successfully");
      }
      
    setShowModal(false);
    } catch (error) {
      console.error('Error saving dua:', error);
      toast.error("Failed to save dua");
    } finally {
      setLoading(false);
    }
  };

  const deleteDua = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dua?")) return;
    
    try {
      await duasAPI.delete(id);
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success("Dua deleted successfully");
    } catch (error) {
      console.error('Error deleting dua:', error);
      toast.error("Failed to delete dua");
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.arabic.toLowerCase().includes(query) ||
        item.transliteration.toLowerCase().includes(query) ||
        item.translation.en.toLowerCase().includes(query) ||
        item.translation.am.toLowerCase().includes(query) ||
        item.translation.or.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    return filtered;
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="page dua-page">
      <div className="page-header">
        <h2>Duas Management</h2>
        <button className="btn primary" onClick={openAdd} disabled={loading}>
          {loading ? "Loading..." : "Add Dua"}
        </button>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search duas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {DUA_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="duas-grid">
        {filteredItems.map((item, idx) => (
          <div key={item.id || idx} className="dua-card">
            <div className="dua-header">
              <span className="dua-category">{item.category}</span>
              <div className="dua-actions">
                <button className="btn-icon" onClick={() => openEdit(idx)} title="Edit">
                  ✏️
                </button>
                <button className="btn-icon danger" onClick={() => deleteDua(item.id)} title="Delete">
                  🗑️
                </button>
              </div>
            </div>
            
            {item.imageUrl && (
              <div className="dua-image">
                <img src={item.imageUrl} alt="Dua illustration" />
              </div>
            )}
            
            <div className="dua-content">
              <div className="dua-arabic" dir="rtl">
                {item.arabic}
              </div>
              
              {item.transliteration && (
                <div className="dua-transliteration">
                  {item.transliteration}
                </div>
              )}
              
              <div className="dua-translations">
                <div className="translation en">
                  <strong>English:</strong> {item.translation.en}
                </div>
                {item.translation.am && (
                  <div className="translation am">
                    <strong>Amharic:</strong> {item.translation.am}
                  </div>
                )}
                {item.translation.or && (
                  <div className="translation or">
                    <strong>Oromo:</strong> {item.translation.or}
                  </div>
                )}
      </div>

              {item.description && (
                <div className="dua-description">
                  {item.description}
                </div>
              )}
              
              {item.audioUrl && (
                <div className="dua-audio">
                  <audio controls>
                    <source src={item.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {filteredItems.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h3>No duas found</h3>
            <p>
              {searchQuery || selectedCategory 
                ? "Try adjusting your search or filter criteria" 
                : "Click 'Add Dua' to create your first dua"
              }
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>{editingIndex >= 0 ? "Edit Dua" : "Add Dua"}</h3>
            <form onSubmit={save} className="dua-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  >
                    {DUA_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="arabic">Arabic Text *</label>
                <textarea
                  id="arabic"
                  dir="rtl"
                  value={form.arabic}
                  onChange={(e) => setForm({ ...form, arabic: e.target.value })}
                  placeholder="Enter the dua in Arabic"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="transliteration">Transliteration</label>
                <textarea
                  id="transliteration"
                  value={form.transliteration}
                  onChange={(e) => setForm({ ...form, transliteration: e.target.value })}
                  placeholder="Enter the transliteration (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="translation-en">English Translation *</label>
                <textarea
                  id="translation-en"
                  value={form.translation.en}
                  onChange={(e) => setForm({ 
                    ...form, 
                    translation: { ...form.translation, en: e.target.value }
                  })}
                  placeholder="Enter English translation"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="translation-am">Amharic Translation</label>
                <textarea
                  id="translation-am"
                  value={form.translation.am}
                  onChange={(e) => setForm({ 
                    ...form, 
                    translation: { ...form.translation, am: e.target.value }
                  })}
                  placeholder="Enter Amharic translation (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="translation-or">Oromo Translation</label>
                <textarea
                  id="translation-or"
                  value={form.translation.or}
                  onChange={(e) => setForm({ 
                    ...form, 
                    translation: { ...form.translation, or: e.target.value }
                  })}
                  placeholder="Enter Oromo translation (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter description or context (optional)"
                  rows="3"
                />
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

              <div className="form-actions">
                <button className="btn" type="button" onClick={close}>
                  Cancel
                </button>
                <button className="btn primary" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Dua"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dua;





