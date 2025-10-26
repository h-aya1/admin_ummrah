import { useState, useEffect, useRef } from "react"
import { useAppContext } from "../../contexts/AppContext"
import "./dua.css"

const Dua = () => {
  const {
    duas,
    duaCategories,
    refreshDuas,
    refreshDuaCategories,
    addDua,
    updateDua,
    deleteDua,
    addNotification
  } = useAppContext()
  
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDua, setEditingDua] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Dynamic categories state with persistence
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("duaCategories")
    return saved ? JSON.parse(saved) : ["all", "travel", "prayer", "protection", "gratitude", "guidance"]
  })
  const [newCategory, setNewCategory] = useState("")
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([refreshDuas(), refreshDuaCategories()])
      } catch (error) {
        console.error('Failed to load duas:', error)
        addNotification({
          type: 'error',
          message: 'Failed to load duas',
          duration: 5000,
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [refreshDuas, refreshDuaCategories, addNotification])

  // Debug effect to check duas data
  useEffect(() => {
    console.log('=== DUAS DEBUG ===', new Date().toISOString());
    console.log('Duas data:', duas);
    console.log('Number of duas:', duas.length);
    console.log('First dua:', duas[0]);
    if (duas[0]) {
      console.log('First dua translation:', duas[0].translation);
      console.log('Translation type:', typeof duas[0].translation);
      console.log('Translation english:', duas[0].translation?.english);
      console.log('Audio:', duas[0].audio);
    }
  }, [duas])

  // Sync categories with API data
  useEffect(() => {
    if (duaCategories && duaCategories.length > 0) {
      // Filter out "all" from API categories and add it only once at the beginning
      const apiCategories = duaCategories.filter(cat => cat !== "all");
      setCategories(["all", ...apiCategories]);
    }
  }, [duaCategories])

  // Persist categories when they change
  useEffect(() => {
    localStorage.setItem("duaCategories", JSON.stringify(categories))
  }, [categories])

  const filteredDuas = duas.filter((dua) => {
    const matchesSearch = dua.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || dua.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddCategory = (e) => {
    e?.preventDefault()
    const name = newCategory.trim().toLowerCase()
    if (!name) return
    if (name === "all") {
      alert("'all' is a reserved category and cannot be added.")
      return
    }
    if (categories.includes(name)) {
      alert("Category already exists.")
      return
    }
    setCategories((prev) => [...prev, name])
    setNewCategory("")
  }

  const handleDeleteCategory = (name) => {
    if (name === "all") {
      alert("The 'all' category cannot be deleted.")
      return
    }
    const inUse = duas.some((d) => d.category === name)
    if (inUse) {
      alert("This category is currently used by one or more duas. Remove or reassign those duas first.")
      return
    }
    if (window.confirm(`Delete category "${name}"?`)) {
      setCategories((prev) => prev.filter((c) => c !== name))
      if (selectedCategory === name) setSelectedCategory("all")
    }
  }

  const handleRenameCategory = (oldName, newNameRaw) => {
    const newName = newNameRaw.trim().toLowerCase()
    if (!newName) return { success: false, message: "Name is required" }
    if (oldName === "all") return { success: false, message: "'all' cannot be renamed" }
    if (newName === "all") return { success: false, message: "'all' is reserved" }
    if (newName === oldName) return { success: true }
    if (categories.includes(newName)) return { success: false, message: "Category already exists" }

    // Update categories list
    setCategories((prev) => prev.map((c) => (c === oldName ? newName : c)))

    // Update existing duas using this category
    setDuas((prev) => prev.map((d) => (d.category === oldName ? { ...d, category: newName } : d)))

    // Update selected filter if needed
    if (selectedCategory === oldName) setSelectedCategory(newName)

    return { success: true }
  }

  const handleAddDua = async (duaData) => {
    try {
      await addDua(duaData)
      setShowAddModal(false)
      setEditingDua(null)
      addNotification({
        type: 'success',
        message: 'Dua added successfully',
        duration: 3000,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: error.message || 'Failed to add dua',
        duration: 5000,
      })
    }
  }

  const handleEditDua = (dua) => {
    setEditingDua(dua)
    setShowAddModal(true)
  }

  const handleUpdateDua = async (duaData) => {
    try {
      await updateDua(editingDua.id, duaData)
      setShowAddModal(false)
      setEditingDua(null)
      addNotification({
        type: 'success',
        message: 'Dua updated successfully',
        duration: 3000,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        message: error.message || 'Failed to update dua',
        duration: 5000,
      })
    }
  }

  const handleDeleteDua = async (id) => {
    if (window.confirm("Are you sure you want to delete this dua?")) {
      try {
        await deleteDua(id)
        addNotification({
          type: 'success',
          message: 'Dua deleted successfully',
          duration: 3000,
        })
      } catch (error) {
        addNotification({
          type: 'error',
          message: error.message || 'Failed to delete dua',
          duration: 5000,
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="dua-loading">
        <div className="loading-spinner"></div>
        <p>Loading duas...</p>
      </div>
    )
  }

  return (
    <div className="dua-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Dua Management</h1>
          <p>Manage prayers and supplications for pilgrims</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Add New Dua
          </button>
          <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
            Add Category
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            id="search-duas"
            name="searchDuas"
            placeholder="Search duas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>

        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-btn ${selectedCategory === category ? "active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        
      </div>

      <div className="duas-grid">
        {filteredDuas.map((dua) => (
          <div key={dua.id} className="dua-card">
            <div className="dua-header">
              <h3 className="dua-title">{dua.title}</h3>
              <div className="dua-actions">
                <button className="action-btn edit" onClick={() => handleEditDua(dua)}>
                  ✏️
                </button>
                <button className="action-btn delete" onClick={() => handleDeleteDua(dua.id)}>
                  🗑️
                </button>
              </div>
            </div>

            <div className="dua-content">
              <div className="arabic-text">{dua.arabic}</div>

              <div className="translations">
                <div className="translation">
                  <strong>English:</strong> {dua.translation?.english || 'No translation'}
                </div>
                <div className="translation">
                  <strong>Amharic:</strong> {dua.translation?.amharic || 'No translation'}
                </div>
                <div className="translation">
                  <strong>Oromo:</strong> {dua.translation?.oromo || 'No translation'}
                </div>
              </div>
              {dua.audio && (
                <div className="audio-section">
                  <audio controls src={dua.audio} style={{ width: "100%", marginTop: "8px" }}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>

            <div className="dua-footer">
              <span className={`category-badge ${dua.category}`}>{dua.category}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredDuas.length === 0 && (
        <div className="no-results">
          <p>No duas found matching your criteria.</p>
        </div>
      )}

      {showAddModal && (
        <DuaModal
          dua={editingDua}
          onClose={() => setShowAddModal(false)}
          onSave={editingDua ? handleUpdateDua : handleAddDua}
          categories={categories}
        />
      )}
      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onAddCategory={(name) => {
            const n = (name || "").trim().toLowerCase()
            if (!n) return
            if (n === "all") return alert("'all' is reserved")
            if (categories.includes(n)) return alert("Category already exists")
            setCategories((prev) => [...prev, n])
          }}
          onDeleteCategory={handleDeleteCategory}
          onRenameCategory={(oldName, newName) => {
            const res = handleRenameCategory(oldName, newName)
            if (!res.success) alert(res.message)
          }}
        />
      )}
    </div>
  )
}

const DuaModal = ({ dua, onClose, onSave, categories = [] }) => {
  const modalRef = useRef(null)
  const [formData, setFormData] = useState({
    title: dua?.title || "",
    arabic: dua?.arabic || "",
    translation: {
      english: dua?.translation?.english || "",
      amharic: dua?.translation?.amharic || "",
      oromo: dua?.translation?.oromo || "",
    },
    category: dua?.category || (categories.find((c) => c !== "all") || ""),
    audio: dua?.audio || "",
  })
  const [audioFile, setAudioFile] = useState(null) // Store the actual file

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && event.target === modalRef.current) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "audio" && files && files[0]) {
      // Store the file for upload
      setAudioFile(files[0])
      // Create preview URL
      setFormData({ ...formData, audio: URL.createObjectURL(files[0]) })
    } else if (name.startsWith("translation.")) {
      const lang = name.split(".")[1]
      setFormData({
        ...formData,
        translation: {
          ...formData.translation,
          [lang]: value,
        },
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Pass the file separately for the API call
    const duaData = {
      ...formData,
      audioFile: audioFile, // Only include file if it's a new upload
    }
    onSave(duaData)
  }

  return (
    <div className="modal-overlay" ref={modalRef}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{dua ? "Edit Dua" : "Add New Dua"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dua-form">
          <div className="form-group">
            <label>Title</label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="input" required />
          </div>

          <div className="form-group">
            <label>Arabic Text</label>
            <textarea
              id="arabic"
              name="arabic"
              value={formData.arabic}
              onChange={handleChange}
              className="input arabic-input"
              rows="3"
              required
            />
          </div>


          <div className="form-group">
            <label>Audio {dua ? "(optional - leave empty to keep current)" : ""}</label>
            <input type="file" id="audio" name="audio" accept="audio/*" onChange={handleChange} className="input" />
            {formData.audio && (
              <audio controls src={formData.audio} style={{ width: "100%", marginTop: "8px" }}>
                Your browser does not support the audio element.
              </audio>
            )}
          </div>

          <div className="translations-section">
            <h3>Translations</h3>

            <div className="form-group">
              <label>English</label>
              <textarea
                id="translation-english"
                name="translation.english"
                value={formData.translation.english}
                onChange={handleChange}
                className="input"
                rows="2"
                required
              />
            </div>

            <div className="form-group">
              <label>Amharic</label>
              <textarea
                id="translation-amharic"
                name="translation.amharic"
                value={formData.translation.amharic}
                onChange={handleChange}
                className="input"
                rows="2"
                required
              />
            </div>

            <div className="form-group">
              <label>Oromo</label>
              <textarea
                id="translation-oromo"
                name="translation.oromo"
                value={formData.translation.oromo}
                onChange={handleChange}
                className="input"
                rows="2"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange} className="input" required>
                {categories
                  .filter((c) => c !== "all")
                  .map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
              </select>
            </div>

          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {dua ? "Update Dua" : "Add Dua"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const CategoryModal = ({ categories = [], onClose, onAddCategory, onDeleteCategory, onRenameCategory }) => {
  const modalRef = useRef(null)
  const [newName, setNewName] = useState("")
  const [editing, setEditing] = useState(null) // category name being edited
  const [editValue, setEditValue] = useState("")

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && event.target === modalRef.current) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const startEdit = (name) => {
    setEditing(name)
    setEditValue(name)
  }

  const saveEdit = () => {
    if (!editing) return
    onRenameCategory(editing, editValue)
    setEditing(null)
    setEditValue("")
  }

  return (
    <div className="modal-overlay" ref={modalRef}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Manage Categories</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dua-form" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="form-group" style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              id="new-category-name"
              name="newCategoryName"
              placeholder="New category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input"
            />
            <button type="button" className="btn btn-primary" onClick={() => { onAddCategory(newName); setNewName("") }}>Add</button>
          </div>

          <div style={{ maxHeight: 280, overflowY: "auto", borderTop: "1px solid #eee", paddingTop: 8 }}>
            {categories.filter((c) => c !== "all").map((c) => (
              <div key={c} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                {editing === c ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                    <input 
                      id={`edit-category-${c}`}
                      name={`editCategory${c}`}
                      className="input" 
                      value={editValue} 
                      onChange={(e) => setEditValue(e.target.value)} 
                    />
                    <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                    <button className="btn btn-secondary" onClick={() => { setEditing(null); setEditValue("") }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                    <span style={{ fontWeight: 500 }}>{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                    <span style={{ color: "#888" }}>({c})</span>
                  </div>
                )}
                {editing !== c && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => startEdit(c)}>Rename</button>
                    <button className="btn btn-secondary" onClick={() => onDeleteCategory(c)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
            {categories.filter((c) => c !== "all").length === 0 && (
              <div style={{ color: "#666", fontStyle: "italic" }}>No custom categories yet.</div>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dua
