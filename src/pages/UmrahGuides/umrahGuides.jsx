import { useState, useEffect } from "react"
import "./umrahGuides.css"

const UmrahGuides = () => {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGuide, setEditingGuide] = useState(null)
  const [selectedGuide, setSelectedGuide] = useState(null)

  useEffect(() => {
    loadGuides()
  }, [])

  const loadGuides = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockGuides = [
      {
        id: 1,
        title: "Entering Ihram",
        description: "Complete guide for entering the state of Ihram",
        translation: {
          english: "Complete guide for entering the state of Ihram with step-by-step instructions",
          amharic: "ወደ ኢህራም ሁኔታ ለመግባት ሙሉ መመሪያ ከደረጃ በደረጃ መመሪያዎች ጋር",
          oromo: "Qajeelfama guutuu haala Ihram seenuuf tarkaanfii hunda waliin"
        },
        order: 1,
        image: "ihram-guide-main.jpg",
        video: "ihram-guide-video.mp4",
        audio: "ihram-guide-audio.mp3",
        steps: [
          {
            id: 1,
            title: "Perform Ghusl",
            description: "Take a full body bath with the intention of purification",
            text: {
              english: "Begin your Umrah journey by performing a complete ritual bath (Ghusl). This is an essential step for spiritual purification before entering the state of Ihram. Use clean water and make the intention for purification.",
              amharic: "የኡምራህ ጉዞዎን በሙሉ የአካል መታጠብ (ጉስል) በማከናወን ይጀምሩ። ይህ ወደ ኢህራም ሁኔታ ከመግባት በፊት ለመንፈሳዊ ንጽሕና አስፈላጊ እርምጃ ነው። ንጹህ ውሃ ይጠቀሙ እና ለንጽሕና ዓላማ ያድርጉ።",
              oromo: "Imala Umrah keessan eegaluuf dhiqannaa guutuu qaamaa (Ghusl) raawwachuun jalqabaa. Kun utuu haala Ihram seenuu dura qulqullinaa hafuuraa argachuuf tarkaanfii barbaachisaa dha. Bishaan qulqulluu fayyadamaa fi kaayyoo qulqullinaa godhadhaa."
            },
            arabic: "اغتسل بنية الطهارة",
            image: "ghusl-guide.jpg",
            audio: "ghusl-audio.mp3",
            duration: "10-15 minutes",
            location: "Before Miqat",
          },
          {
            id: 2,
            title: "Wear Ihram Clothing",
            description: "Men wear two white unstitched cloths, women wear modest clothing",
            text: {
              english: "For men: Wear two white, unstitched pieces of cloth - one around the waist (Izar) and one over the shoulders (Rida). For women: Wear modest, loose-fitting clothing that covers the entire body except face and hands.",
              amharic: "ለወንዶች፦ ሁለት ነጭ ያልተሰፉ ጨርቆችን ይልበሱ - አንዱ በወገብ ዙሪያ (ኢዛር) እና አንዱ በትከሻዎች ላይ (ሪዳ)። ለሴቶች፦ ከፊት እና ከእጅ በስተቀር አጠቃላይ ሰውነትን የሚሸፍን ትሑት፣ ልቅ ልብስ ይልበሱ።",
              oromo: "Dhiiraaf: Huccuu adii lama kan hin hodhamne uffadhaa - tokko mudhii naannoo (Izar) fi tokko gatiittii irra (Rida). Dubartootaaf: Uffata salphaa, lallaafaa kan qaama guutuu fuula fi harka malee haguugu uffadhaa."
            },
            arabic: "البس ثياب الإحرام",
            image: "ihram-clothing.jpg",
            audio: null,
            duration: "5 minutes",
            location: "Before Miqat",
          },
        ],
        createdAt: "2024-01-15",
        updatedAt: "2024-01-20",
      },
      {
        id: 2,
        title: "Tawaf al-Umrah",
        description: "Circumambulation around the Kaaba for Umrah",
        translation: {
          english: "Circumambulation around the Kaaba for Umrah with proper etiquette and duas",
          amharic: "ለኡምራህ በካዕባ ዙሪያ መዞር ከተገቢው ሥነ-ምግባር እና ዱዓዎች ጋር",
          oromo: "Kaaba naannoo Umrahf marsuu adaabii fi duaa sirrii waliin"
        },
        order: 2,
        image: "tawaf-guide-main.jpg",
        video: null,
        audio: "tawaf-guide-audio.mp3",
        steps: [
          {
            id: 1,
            title: "Begin at Black Stone",
            description: "Start your Tawaf by facing the Black Stone",
            text: {
              english: "Position yourself facing the Black Stone (Hajar al-Aswad). If possible, touch and kiss it. If the area is crowded, simply point towards it and say 'Bismillahi Allahu Akbar'. This marks the beginning of each round of Tawaf.",
              amharic: "ወደ ጥቁር ድንጋይ (ሃጃር አል-አስዋድ) ፊትዎን ያዙሩ። በተቻለ መጠን ይንኩት እና ይሳሙት። አካባቢው ህዝብ የበዛበት ከሆነ፣ ወደ እሱ ብቻ ይጠቁሙ እና 'ቢስሚላሂ አላሁ አክባር' ይበሉ። ይህ የእያንዳንዱን የጣዋፍ ዙር መጀመሪያ ያመለክታል።",
              oromo: "Dhagaa Gurraacha (Hajar al-Aswad) gara fuulduraatti of qopheessaa. Yoo danda'ame tuqaa fi dhungadhaa. Yoo naannoon sun namootaan guutame, gara isaatti qofa argisiisaa fi 'Bismillahi Allahu Akbar' jedhaa. Kun jalqaba marsaa Tawaf hundaa agarsiisa."
            },
            arabic: "ابدأ من الحجر الأسود",
            image: "black-stone.jpg",
            audio: "tawaf-dua.mp3",
            duration: "1 minute",
            location: "Masjid al-Haram",
          },
        ],
        createdAt: "2024-01-10",
        updatedAt: "2024-01-18",
      },
    ]

    setGuides(mockGuides)
    setLoading(false)
  }

  const handleAddGuide = () => {
    setEditingGuide(null)
    setShowAddModal(true)
  }

  const handleEditGuide = (guide) => {
    setEditingGuide(guide)
    setShowAddModal(true)
  }

  const handleDeleteGuide = (id) => {
    if (window.confirm("Are you sure you want to delete this guide?")) {
      setGuides(guides.filter((guide) => guide.id !== id))
    }
  }

  const handleViewGuide = (guide) => {
    setSelectedGuide(guide)
  }

  if (loading) {
    return (
      <div className="guides-loading">
        <div className="loading-spinner"></div>
        <p>Loading guides...</p>
      </div>
    )
  }

  return (
    <div className="guides-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Umrah Guides</h1>
          <p>Manage step-by-step guides for Umrah pilgrimage</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddGuide}>
          Add New Guide
        </button>
      </div>

      <div className="guides-grid">
        {guides.map((guide) => (
          <div key={guide.id} className="guide-card">
            <div className="guide-header">
              <div className="guide-info">
                <h3 className="guide-title">{guide.title}</h3>
              </div>
              <div className="guide-actions">
                <button className="action-btn view" onClick={() => handleViewGuide(guide)}>
                  👁️
                </button>
                <button className="action-btn edit" onClick={() => handleEditGuide(guide)}>
                  ✏️
                </button>
                <button className="action-btn delete" onClick={() => handleDeleteGuide(guide.id)}>
                  🗑️
                </button>
              </div>
            </div>

            <div className="guide-meta">
              <span className="guide-order">Step {guide.order}</span>
            </div>

            <div className="guide-stats">
              <div className="stat">
                <span className="stat-value">{guide.steps.length}</span>
                <span className="stat-label">Steps</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {guide.steps.reduce((total, step) => {
                    const duration = Number.parseInt(step.duration) || 0
                    return total + duration
                  }, 0)}
                  m
                </span>
                <span className="stat-label">Duration</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedGuide && <GuideDetailModal guide={selectedGuide} onClose={() => setSelectedGuide(null)} />}

      {showAddModal && (
        <GuideModal
          guide={editingGuide}
          onClose={() => setShowAddModal(false)}
          onSave={(guideData) => {
            if (editingGuide) {
              setGuides(guides.map((g) => (g.id === editingGuide.id ? { ...g, ...guideData } : g)))
            } else {
              setGuides([
                ...guides,
                { ...guideData, id: Date.now(), createdAt: new Date().toISOString().split("T")[0] },
              ])
            }
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}

const GuideDetailModal = ({ guide, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{guide.title}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="guide-detail">
          <div className="guide-overview">
            <div className="guide-meta-detail">
              <span className="meta-item">Order: {guide.order}</span>
            </div>
          </div>

          <div className="steps-list">
            <h3>Steps ({guide.steps.length})</h3>
            {guide.steps.map((step, index) => (
              <div key={step.id} className="step-item">
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <h4 className="step-title">{step.title}</h4>
                  <p className="step-description">{step.description}</p>
                  {step.text && (
                    <div className="step-translations">
                      <div className="translation">
                        <strong>English:</strong> {step.text.english}
                      </div>
                      <div className="translation">
                        <strong>Amharic:</strong> {step.text.amharic}
                      </div>
                      <div className="translation">
                        <strong>Oromo:</strong> {step.text.oromo}
                      </div>
                    </div>
                  )}
                  {step.arabic && <div className="step-arabic">{step.arabic}</div>}
                  {step.image && (
                    <div className="step-image">
                      <img src={step.image} alt={step.title} style={{ width: "100%", maxWidth: "300px", borderRadius: "8px", marginTop: "8px" }} />
                    </div>
                  )}
                  {step.video && (
                    <div className="step-video">
                      <video controls src={step.video} style={{ width: "100%", maxWidth: "400px", borderRadius: "8px", marginTop: "8px" }} />
                    </div>
                  )}
                  {step.audio && (
                    <div className="step-audio">
                      <audio controls src={step.audio} style={{ width: "100%", marginTop: "8px" }}>
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  <div className="step-meta">
                    <span className="step-duration">⏱️ {step.duration}</span>
                    {step.location && (
                      <span className="step-location">📍 {step.location}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const GuideModal = ({ guide, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: guide?.title || "",
    order: guide?.order || 1,
    steps: guide?.steps || [],
  })
  const [showStepModal, setShowStepModal] = useState(false)
  const [editingStep, setEditingStep] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleAddStep = () => {
    setEditingStep(null)
    setShowStepModal(true)
  }

  const handleEditStep = (step) => {
    setEditingStep(step)
    setShowStepModal(true)
  }

  const handleDeleteStep = (stepId) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter(step => step.id !== stepId)
    })
  }

  const handleSaveStep = (stepData) => {
    if (editingStep) {
      setFormData({
        ...formData,
        steps: formData.steps.map(step => 
          step.id === editingStep.id ? { ...step, ...stepData } : step
        )
      })
    } else {
      setFormData({
        ...formData,
        steps: [...formData.steps, { ...stepData, id: Date.now() }]
      })
    }
    setShowStepModal(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{guide ? "Edit Guide" : "Add New Guide"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="guide-form">
          <div className="form-group">
            <label>Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} className="input" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Order</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                className="input"
                min="1"
                required
              />
            </div>

          </div>

          <div className="form-group">
            <div className="steps-section">
              <div className="steps-header">
                <h3>Steps ({formData.steps.length})</h3>
                <button type="button" className="btn btn-secondary" onClick={handleAddStep}>
                  Add Step
                </button>
              </div>
              <div className="steps-list">
                {formData.steps.map((step, index) => (
                  <div key={step.id} className="step-item-form">
                    <div className="step-info">
                      <span className="step-number">{index + 1}</span>
                      <span className="step-title">{step.title}</span>
                    </div>
                    <div className="step-actions">
                      <button type="button" className="action-btn edit" onClick={() => handleEditStep(step)}>
                        ✏️
                      </button>
                      <button type="button" className="action-btn delete" onClick={() => handleDeleteStep(step.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {guide ? "Update Guide" : "Add Guide"}
            </button>
          </div>
        </form>

        {showStepModal && (
          <StepModal
            step={editingStep}
            onClose={() => setShowStepModal(false)}
            onSave={handleSaveStep}
          />
        )}
      </div>
    </div>
  )
}

const StepModal = ({ step, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: step?.title || "",
    description: step?.description || "",
    text: {
      english: step?.text?.english || "",
      amharic: step?.text?.amharic || "",
      oromo: step?.text?.oromo || "",
    },
    arabic: step?.arabic || "",
    image: step?.image || "",
    audio: step?.audio || "",
    video: step?.video || "",
    duration: step?.duration || "",
    location: step?.location || "",
  })

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === "image" && files && files[0]) {
      setFormData({ ...formData, image: URL.createObjectURL(files[0]) })
    } else if (name === "audio" && files && files[0]) {
      setFormData({ ...formData, audio: URL.createObjectURL(files[0]) })
    } else if (name === "video" && files && files[0]) {
      setFormData({ ...formData, video: URL.createObjectURL(files[0]) })
    } else if (name.startsWith("text.")) {
      const lang = name.split(".")[1]
      setFormData({
        ...formData,
        text: {
          ...formData.text,
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
          <h2>{step ? "Edit Step" : "Add New Step"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="step-form">
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              className="input" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="2"
              required
            />
          </div>

          <div className="translations-section">
            <h3>Detailed Text Translations</h3>
            
            <div className="form-group">
              <label>English</label>
              <textarea
                name="text.english"
                value={formData.text.english}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Detailed explanation in English..."
                required
              />
            </div>

            <div className="form-group">
              <label>Amharic</label>
              <textarea
                name="text.amharic"
                value={formData.text.amharic}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Detailed explanation in Amharic..."
                required
              />
            </div>

            <div className="form-group">
              <label>Oromo</label>
              <textarea
                name="text.oromo"
                value={formData.text.oromo}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Detailed explanation in Oromo..."
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Arabic Text</label>
            <textarea
              name="arabic"
              value={formData.arabic}
              onChange={handleChange}
              className="input arabic-input"
              rows="2"
              placeholder="Arabic text (optional)"
            />
          </div>

          <div className="form-group">
            <label>Image</label>
            <input 
              type="file" 
              name="image" 
              accept="image/*" 
              onChange={handleChange} 
              className="input" 
              required 
            />
            {formData.image && (
              <div className="image-preview">
                <img 
                  src={formData.image} 
                  alt="Preview" 
                  style={{ width: "100%", maxWidth: "200px", borderRadius: "8px", marginTop: "8px" }} 
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Video (Optional)</label>
            <input 
              type="file" 
              name="video" 
              accept="video/*" 
              onChange={handleChange} 
              className="input" 
            />
            {formData.video && (
              <video controls src={formData.video} style={{ width: "100%", maxWidth: "300px", borderRadius: "8px", marginTop: "8px" }} />
            )}
          </div>

          <div className="form-group">
            <label>Audio (Optional)</label>
            <input 
              type="file" 
              name="audio" 
              accept="audio/*" 
              onChange={handleChange} 
              className="input" 
            />
            {formData.audio && (
              <audio controls src={formData.audio} style={{ width: "100%", marginTop: "8px" }}>
                Your browser does not support the audio element.
              </audio>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="input"
                placeholder="e.g., 5 minutes"
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {step ? "Update Step" : "Add Step"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UmrahGuides
