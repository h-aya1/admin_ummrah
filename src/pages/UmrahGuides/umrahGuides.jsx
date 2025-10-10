import { useState, useEffect } from "react"
import "./umrahGuides.css"
import { guidesAPI, stepsAPI } from "../../services/api"

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
    try {
      setLoading(true)
      const data = await guidesAPI.getAll()
      setGuides(data || [])
    } catch (error) {
      console.error('Failed to load guides:', error)
      // You might want to show an error message to the user here
    } finally {
      setLoading(false)
    }
  }

  const handleAddGuide = () => {
    setEditingGuide(null)
    setShowAddModal(true)
  }

  const handleEditGuide = (guide) => {
    setEditingGuide(guide)
    setShowAddModal(true)
  }

  const handleDeleteGuide = async (id) => {
    if (window.confirm("Are you sure you want to delete this guide?")) {
      try {
        await guidesAPI.delete(id)
        setGuides(guides.filter((guide) => guide.id !== id))
      } catch (error) {
        console.error('Failed to delete guide:', error)
        alert('Failed to delete guide. Please try again.')
      }
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
          onSave={async (guideData) => {
            try {
              if (editingGuide) {
                await guidesAPI.update(editingGuide.id, guideData)
              } else {
                await guidesAPI.create(guideData)
              }
              await loadGuides() // Reload guides after save
              setShowAddModal(false)
            } catch (error) {
              console.error('Failed to save guide:', error)
              alert('Failed to save guide. Please try again.')
            }
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
    description: guide?.description || "",
    order: guide?.order || 1,
    translation: {
      english: guide?.translation?.english || "",
      amharic: guide?.translation?.amharic || "",
      oromo: guide?.translation?.oromo || "",
    },
    steps: guide?.steps || [],
  })
  const [files, setFiles] = useState({
    image: null,
    video: null,
    audio: null,
  })
  const [showStepModal, setShowStepModal] = useState(false)
  const [editingStep, setEditingStep] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith("translation.")) {
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

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target
    setFiles({
      ...files,
      [name]: fileList[0] || null,
    })
  }

  const handleAddStep = () => {
    setEditingStep(null)
    setShowStepModal(true)
  }

  const handleEditStep = (step) => {
    setEditingStep(step)
    setShowStepModal(true)
  }

  const handleDeleteStep = async (stepId) => {
    if (window.confirm("Are you sure you want to delete this step?")) {
      try {
        await stepsAPI.delete(stepId)
        // Reload the guide to get updated steps
        if (guide) {
          const updatedGuide = await guidesAPI.getById(guide.id)
          setFormData(prev => ({ ...prev, steps: updatedGuide.steps || [] }))
        }
      } catch (error) {
        console.error('Failed to delete step:', error)
        alert('Failed to delete step. Please try again.')
      }
    }
  }

  const handleSaveStep = async (stepData) => {
    try {
      if (editingStep) {
        await stepsAPI.update(editingStep.id, stepData)
      } else {
        await stepsAPI.create(stepData)
      }
      // Reload the guide to get updated steps
      if (guide) {
        const updatedGuide = await guidesAPI.getById(guide.id)
        setFormData(prev => ({ ...prev, steps: updatedGuide.steps || [] }))
      }
      setShowStepModal(false)
    } catch (error) {
      console.error('Failed to save step:', error)
      alert('Failed to save step. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const submitData = new FormData()
    submitData.append('title', formData.title)
    submitData.append('description', formData.description || '')
    submitData.append('order', formData.order.toString())
    submitData.append('translation', JSON.stringify(formData.translation))

    if (files.image) submitData.append('image', files.image)
    if (files.video) submitData.append('video', files.video)
    if (files.audio) submitData.append('audio', files.audio)

    await onSave(submitData)
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

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Optional description..."
            />
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

          <div className="translations-section">
            <h3>Guide Translations</h3>
            
            <div className="form-group">
              <label>English</label>
              <textarea
                name="translation.english"
                value={formData.translation.english}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Guide description in English..."
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
                rows="3"
                placeholder="Guide description in Amharic..."
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
                rows="3"
                placeholder="Guide description in Oromo..."
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Image</label>
            <input 
              type="file" 
              name="image" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="input" 
            />
            {guide?.image && !files.image && (
              <div className="current-file">
                Current: <img src={`http://localhost:3000/${guide.image}`} alt="Current" style={{ width: "100px", marginTop: "8px" }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Video (Optional)</label>
            <input 
              type="file" 
              name="video" 
              accept="video/*" 
              onChange={handleFileChange} 
              className="input" 
            />
            {guide?.video && !files.video && (
              <div className="current-file">Current video: {guide.video}</div>
            )}
          </div>

          <div className="form-group">
            <label>Audio (Optional)</label>
            <input 
              type="file" 
              name="audio" 
              accept="audio/*" 
              onChange={handleFileChange} 
              className="input" 
            />
            {guide?.audio && !files.audio && (
              <div className="current-file">Current audio: {guide.audio}</div>
            )}
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
            guideId={guide?.id}
          />
        )}
      </div>
    </div>
  )
}

const StepModal = ({ step, onClose, onSave, guideId }) => {
  const [formData, setFormData] = useState({
    title: step?.title || "",
    description: step?.description || "",
    text: {
      english: step?.text?.english || "",
      amharic: step?.text?.amharic || "",
      oromo: step?.text?.oromo || "",
    },
    arabic: step?.arabic || "",
    duration: step?.duration || "",
    location: step?.location || "",
  })
  const [files, setFiles] = useState({
    image: null,
    video: null,
    audio: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith("text.")) {
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

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target
    setFiles({
      ...files,
      [name]: fileList[0] || null,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const submitData = new FormData()
    submitData.append('title', formData.title)
    submitData.append('description', formData.description)
    submitData.append('text', JSON.stringify(formData.text))
    submitData.append('arabic', formData.arabic || '')
    submitData.append('duration', formData.duration)
    submitData.append('location', formData.location || '')
    submitData.append('guideId', guideId)

    if (files.image) submitData.append('image', files.image)
    if (files.video) submitData.append('video', files.video)
    if (files.audio) submitData.append('audio', files.audio)

    await onSave(submitData)
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
              onChange={handleFileChange} 
              className="input" 
              required 
            />
            {step?.image && !files.image && (
              <div className="current-file">
                Current: <img src={`http://localhost:3000/${step.image}`} alt="Current" style={{ width: "100px", marginTop: "8px" }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Video (Optional)</label>
            <input 
              type="file" 
              name="video" 
              accept="video/*" 
              onChange={handleFileChange} 
              className="input" 
            />
            {step?.video && !files.video && (
              <div className="current-file">Current video: {step.video}</div>
            )}
          </div>

          <div className="form-group">
            <label>Audio (Optional)</label>
            <input 
              type="file" 
              name="audio" 
              accept="audio/*" 
              onChange={handleFileChange} 
              className="input" 
            />
            {step?.audio && !files.audio && (
              <div className="current-file">Current audio: {step.audio}</div>
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
