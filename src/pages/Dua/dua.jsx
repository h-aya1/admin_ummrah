import { useState, useEffect } from "react"
import "./dua.css"

const Dua = () => {
  const [duas, setDuas] = useState([])
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
    loadDuas()
  }, [])

  // Persist categories when they change
  useEffect(() => {
    localStorage.setItem("duaCategories", JSON.stringify(categories))
  }, [categories])

  const loadDuas = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockDuas = [
      {
        id: 1,
        title: "Dua for Travel",
        arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
        translation: {
          english: "Glory be to Him who has subjected this to us, and we could never have it (by our efforts).",
          amharic: "ይህንን ለእኛ ያስገዛልን ለእርሱ ክብር ይሁን፣ እኛም በራሳችን ጥረት ሊኖረን አይችልም።",
          oromo: "Ulfinni kan kana nuuf bulchee jiru haa ta'u, nuti mataa keenyaan argachuu hin dandeenyu.",
        },
        category: "travel",
        createdAt: "2024-01-15",
        updatedAt: "2024-01-20",
        audio: "sample-audio-1.mp3",
      },
      {
        id: 2,
        title: "Dua for Protection",
        arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        translation: {
          english: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
          amharic: "በአላህ ፍጹም ቃላት ከፈጠራቸው ክፋት እጠብቃለሁ።",
          oromo: "Jecha Allah kan mudaa hin qabne sanaan waan uume hundumaa irraa nan eega.",
        },
        category: "protection",
        createdAt: "2024-01-10",
        updatedAt: "2024-01-18",
        audio: "sample-audio-2.mp3",
      },
    ]

    setDuas(mockDuas)
    setLoading(false)
  }

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

  const handleAddDua = () => {
    setEditingDua(null)
    setShowAddModal(true)
  }

  const handleEditDua = (dua) => {
    setEditingDua(dua)
    setShowAddModal(true)
  }

  const handleDeleteDua = (id) => {
    if (window.confirm("Are you sure you want to delete this dua?")) {
      setDuas(duas.filter((dua) => dua.id !== id))
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
          <button className="btn btn-primary" onClick={handleAddDua}>
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
                  <strong>English:</strong> {dua.translation.english}
                </div>
                <div className="translation">
                  <strong>Amharic:</strong> {dua.translation.amharic}
                </div>
                <div className="translation">
                  <strong>Oromo:</strong> {dua.translation.oromo}
                </div>
              </div>
              <div className="audio-section">
                <audio controls src={dua.audio} style={{ width: "100%", marginTop: "8px" }}>
                  Your browser does not support the audio element.
                </audio>
              </div>
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
          onSave={(duaData) => {
            if (editingDua) {
              setDuas(duas.map((d) => (d.id === editingDua.id ? { ...d, ...duaData } : d)))
            } else {
              setDuas([...duas, { ...duaData, id: Date.now(), createdAt: new Date().toISOString().split("T")[0] }])
            }
            setShowAddModal(false)
          }}
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

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "audio" && files && files[0]) {
      // Convert audio file to a local URL for preview
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
    onSave(formData)
  }

  return (
    <div className="modal-overlay">
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
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="input" required />
          </div>

          <div className="form-group">
            <label>Arabic Text</label>
            <textarea
              name="arabic"
              value={formData.arabic}
              onChange={handleChange}
              className="input arabic-input"
              rows="3"
              required
            />
          </div>


          <div className="form-group">
            <label>Audio</label>
            <input type="file" name="audio" accept="audio/*" onChange={handleChange} className="input" required />
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
              <select name="category" value={formData.category} onChange={handleChange} className="input" required>
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

export default Dua

const CategoryModal = ({ categories = [], onClose, onAddCategory, onDeleteCategory, onRenameCategory }) => {
  const [newName, setNewName] = useState("")
  const [editing, setEditing] = useState(null) // category name being edited
  const [editValue, setEditValue] = useState("")

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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Manage Categories</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dua-form" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="form-group" style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
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
                    <input className="input" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
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
