import { useState, useEffect } from "react"
import "./visitPlaces.css"

const VisitPlaces = () => {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPlace, setEditingPlace] = useState(null)
  const [selectedCity, setSelectedCity] = useState("all")

  const cities = ["all", "makkah", "medina", "other"]

  useEffect(() => {
    loadPlaces()
  }, [])

  const loadPlaces = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockPlaces = [
      {
        id: 1,
        name: "Masjid al-Haram",
        description: {
          english: "The holiest mosque in Islam, surrounding the Kaaba",
          amharic: "በእስላም ሃይማኖት የሆነ ተቀዳሚ መስጊድ፣ ካዕባን ከተለወጠበት",
          oromo: "Masjiid al-Haram, ka'abaa naannoo keessa jiru, islaama keessatti kan qubata"
        },
        city: "makkah",
        mapLocation: "https://maps.google.com/?q=21.4225,39.8262",
        images: ["/masjid-al-haram.jpg"],
        createdAt: "2024-01-15",
      },
      {
        id: 2,
        name: "Masjid an-Nabawi",
        description: {
          english: "The Prophet's Mosque in Medina",
          amharic: "በመዲና ሆነው የነቢዩ መስጊድ",
          oromo: "Masjiid an-Nabawi, magaalaa Madinaa keessatti argamu"
        },
        city: "medina",
        mapLocation: "https://maps.google.com/?q=24.4672,39.6117",
        images: ["/masjid-an-nabawi.jpg"],    
        createdAt: "2024-01-10",
      },
      {
        id: 3,
        name: "Mount Arafat",
        description: {
          english: "The hill where Prophet Muhammad delivered his farewell sermon",
          amharic: "ነቢዩ ሙሃመድ የራሱን የተለያዩ ማብራሪያ ያቀረባበት ኮሌ",
          oromo: "Duka'a Arafat, nabiyyi Muhammad (s.w.t.) yaad-annoo jalqabaa isaaniif dubbate"
        },
        city: "makkah",
        mapLocation: "https://maps.google.com/?q=21.3544,39.9857",
        images: ["/mount-arafat.jpg"],
        createdAt: "2024-01-08",
      },
    ]

    setPlaces(mockPlaces)
    setLoading(false)
  }

  const filteredPlaces = places.filter((place) => {
    return selectedCity === "all" || place.city === selectedCity
  })

  const handleAddPlace = () => {
    setEditingPlace(null)
    setShowAddModal(true)
  }

  const handleEditPlace = (place) => {
    setEditingPlace(place)
    setShowAddModal(true)
  }

  const handleDeletePlace = (id) => {
    if (window.confirm("Are you sure you want to delete this place?")) {
      setPlaces(places.filter((place) => place.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="places-loading">
        <div className="loading-spinner"></div>
        <p>Loading places...</p>
      </div>
    )
  }

  return (
    <div className="places-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Visit Places</h1>
          <p>Manage sacred and historical places for pilgrims</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddPlace}>
          Add New Place
        </button>
      </div>

      <div className="filters-section">
        <div className="city-filters">
          {cities.map((city) => (
            <button
              key={city}
              className={`filter-btn ${selectedCity === city ? "active" : ""}`}
              onClick={() => setSelectedCity(city)}
            >
              {city.charAt(0).toUpperCase() + city.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="places-grid">
        {filteredPlaces.map((place) => (
          <div key={place.id} className="place-card">
            <div className="place-image">
              <img src={place.images[0] || "/placeholder.svg"} alt={place.name} />
            </div>

            <div className="place-content">
              <div className="place-header">
                <h3 className="place-name">{place.name}</h3>
                <div className="place-actions">
                  <button className="action-btn edit" onClick={() => handleEditPlace(place)}>
                    ✏️
                  </button>
                  <button className="action-btn delete" onClick={() => handleDeletePlace(place.id)}>
                    🗑️
                  </button>
                </div>
              </div>

              <div className="place-description">
                <h4>Description</h4>
                <div className="description-translations">
                  <p><strong>English:</strong> {place.description.english}</p>
                  <p><strong>Amharic:</strong> {place.description.amharic}</p>
                  <p><strong>Oromo:</strong> {place.description.oromo}</p>
                </div>
              </div>

              <div className="place-meta">
                <div className="meta-item">
                  <span className="meta-icon">📍</span>
                  <span className="meta-text">{place.city.charAt(0).toUpperCase() + place.city.slice(1)}</span>
                </div>
              </div>

              <div className="place-footer">
                {place.mapLocation && (
                  <a 
                    href={place.mapLocation} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="view-map-btn"
                    style={{ textDecoration: "none" }}
                  >
                    View on Map
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <PlaceModal
          place={editingPlace}
          onClose={() => setShowAddModal(false)}
          onSave={(placeData) => {
            if (editingPlace) {
              setPlaces(places.map((p) => (p.id === editingPlace.id ? { ...p, ...placeData } : p)))
            } else {
              setPlaces([
                ...places,
                { ...placeData, id: Date.now(), createdAt: new Date().toISOString().split("T")[0] },
              ])
            }
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

const PlaceModal = ({ place, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: place?.name || "",
    description: {
      english: place?.description?.english || "",
      amharic: place?.description?.amharic || "",
      oromo: place?.description?.oromo || "",
    },
    city: place?.city || "makkah",
    mapLocation: place?.mapLocation || "",
    images: place?.images || [],
  })

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "images" && files && files[0]) {
      const newImages = [...formData.images, URL.createObjectURL(files[0])]
      setFormData({ ...formData, images: newImages })
    } else if (name.startsWith("description.")) {
      const lang = name.split(".")[1]
      setFormData({
        ...formData,
        description: {
          ...formData.description,
          [lang]: value
        }
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const removeImage = (indexToRemove) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, index) => index !== indexToRemove)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{place ? "Edit Place" : "Add New Place"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="place-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" required />
          </div>

          <div className="form-group">
            <label>Description (English)</label>
            <textarea
              name="description.english"
              value={formData.description.english}
              onChange={handleChange}
              className="input"
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Description (Amharic)</label>
            <textarea
              name="description.amharic"
              value={formData.description.amharic}
              onChange={handleChange}
              className="input"
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Description (Oromo)</label>
            <textarea
              name="description.oromo"
              value={formData.description.oromo}
              onChange={handleChange}
              className="input"
              rows="3"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <select name="city" value={formData.city} onChange={handleChange} className="input">
                <option value="makkah">Makkah</option>
                <option value="medina">Medina</option>
                <option value="other">Other</option>
              </select>
            </div>


    
          </div>


          <div className="form-group">
            <label>Images</label>
            <input 
              type="file" 
              name="images" 
              accept="image/*" 
              onChange={handleChange} 
              className="input" 
              multiple
            />
            {formData.images.length > 0 && (
              <div className="images-preview">
                {formData.images.map((image, index) => (
                  <div key={index} className="image-preview-item" style={{ position: "relative", display: "inline-block", margin: "8px" }}>
                    <img 
                      src={image} 
                      alt={`Preview ${index + 1}`} 
                      style={{ width: "150px", height: "100px", objectFit: "cover", borderRadius: "8px" }} 
                    />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)}
                      style={{ 
                        position: "absolute", 
                        top: "4px", 
                        right: "4px", 
                        background: "red", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "50%", 
                        width: "24px", 
                        height: "24px", 
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Map Location</label>
            <input
              type="text"
              name="mapLocation"
              value={formData.mapLocation}
              onChange={handleChange}
              className="input"
              placeholder="e.g., https://maps.google.com/... or Google Maps link"
            />
            <small style={{ color: "#666", fontSize: "12px", marginTop: "4px", display: "block" }}>
              Paste a Google Maps link or any map service URL for this location
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {place ? "Update Place" : "Add Place"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VisitPlaces
