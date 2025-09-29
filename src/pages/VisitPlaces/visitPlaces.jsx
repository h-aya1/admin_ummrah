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
        description: "The holiest mosque in Islam, surrounding the Kaaba",
        city: "makkah",
        mapLocation: "https://maps.google.com/?q=21.4225,39.8262",
        significance: "The most sacred site in Islam where Muslims perform Hajj and Umrah",
        visitingHours: "24/7",
        tips: "Arrive early for prayers, dress modestly, be respectful of other pilgrims",
        images: ["/masjid-al-haram.jpg"],
        createdAt: "2024-01-15",
      },
      {
        id: 2,
        name: "Masjid an-Nabawi",
        description: "The Prophet's Mosque in Medina",
        city: "medina",
        mapLocation: "https://maps.google.com/?q=24.4672,39.6117",
        significance: "The second holiest mosque in Islam, burial place of Prophet Muhammad",
        visitingHours: "24/7",
        tips: "Visit the Rawdah area, pay respects at the Prophet's grave",
        images: ["/masjid-an-nabawi.jpg"],    
        createdAt: "2024-01-10",
      },
      {
        id: 3,
        name: "Mount Arafat",
        description: "The hill where Prophet Muhammad delivered his farewell sermon",
        city: "makkah",
        mapLocation: "https://maps.google.com/?q=21.3544,39.9857",
        significance: "Essential part of Hajj pilgrimage, site of standing (Wuquf)",
        visitingHours: "Daylight hours",
        tips: "Bring water and sun protection, best visited during Hajj season",
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

              <p className="place-description">{place.description}</p>

              <div className="place-meta">
                <div className="meta-item">
                  <span className="meta-icon">📍</span>
                  <span className="meta-text">{place.city.charAt(0).toUpperCase() + place.city.slice(1)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">🕐</span>
                  <span className="meta-text">{place.visitingHours}</span>
                </div>
              </div>

              <div className="place-significance">
                <h4>Significance</h4>
                <p>{place.significance}</p>
              </div>

              <div className="place-tips">
                <h4>Visiting Tips</h4>
                <p>{place.tips}</p>
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
    description: place?.description || "",
    city: place?.city || "makkah",
    significance: place?.significance || "",
    visitingHours: place?.visitingHours || "",
    tips: place?.tips || "",
    mapLocation: place?.mapLocation || "",
    images: place?.images || [],
  })

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "images" && files && files[0]) {
      const newImages = [...formData.images, URL.createObjectURL(files[0])]
      setFormData({ ...formData, images: newImages })
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
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
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
            <label>Significance</label>
            <textarea
              name="significance"
              value={formData.significance}
              onChange={handleChange}
              className="input"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Visiting Hours</label>
            <input
              type="text"
              name="visitingHours"
              value={formData.visitingHours}
              onChange={handleChange}
              className="input"
              placeholder="e.g., 24/7 or 9:00 AM - 6:00 PM"

            />
          </div>

          <div className="form-group">
            <label>Visiting Tips</label>
            <textarea name="tips" value={formData.tips} onChange={handleChange} className="input" rows="3" required />
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
