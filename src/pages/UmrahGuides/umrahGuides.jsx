import { useState, useEffect, useRef } from "react";
import "./umrahGuides.css";
import { guidesAPI, stepsAPI, getAssetUrl } from "../../services/api";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const generateTempId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// --- Reusable Loading Spinner Component ---
const LoadingSpinner = ({ message }) => (
  <div className="guides-loading">
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>
);

// =================================================================
// Main Page Component
// =================================================================
const UmrahGuides = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGuideModalOpen, setGuideModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      setLoading(true);
      const data = await guidesAPI.getAll();
      setGuides(data || []);
    } catch (error) {
      console.error("Failed to load guides:", error);
      alert("Failed to load guides. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuide = () => {
    setEditingGuide(null);
    setGuideModalOpen(true);
  };

  const handleEditGuide = (guide) => {
    setEditingGuide(guide);
    setGuideModalOpen(true);
  };

  const handleDeleteGuide = async (id) => {
    if (window.confirm("Are you sure you want to delete this guide and all its steps?")) {
      try {
        await guidesAPI.delete(id);
        // Reload all guides to ensure consistency
        await loadGuides();
      } catch (error) {
        console.error("Failed to delete guide:", error);
        alert("Failed to delete guide. Please try again.");
      }
    }
  };

  const handleViewGuide = (guide) => {
    setSelectedGuide(guide);
  };
  
  // Centralized success handler to reload data and close modals
  const onSaveSuccess = async () => {
    await loadGuides();
    setGuideModalOpen(false);
    setEditingGuide(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading guides..." />;
  }

  return (
    <div className="guides-page">
      <div className="page-header">
        <h1>Umrah Guides</h1>
        <button className="btn btn-primary" onClick={handleAddGuide}>
          Add New Guide
        </button>
      </div>

      <div className="guides-grid">
        {guides.map((guide) => (
          <div key={guide.id} className="guide-card">
            <div className="guide-image-container">
              <img
                src={guide.image ? getAssetUrl(guide.image) : "https://via.placeholder.com/400x200?text=No+Image"}
                alt={guide.title}
                className="guide-image"
              />
            </div>
            <div className="guide-header">
              <h3 className="guide-title">{guide.title}</h3>
              <div className="guide-actions">
                <button title="View" className="action-btn view" onClick={() => handleViewGuide(guide)}>👁️</button>
                <button title="Edit" className="action-btn edit" onClick={() => handleEditGuide(guide)}>✏️</button>
                <button title="Delete" className="action-btn delete" onClick={() => handleDeleteGuide(guide.id)}>🗑️</button>
              </div>
            </div>
            <p className="guide-description">{guide.description}</p>
            <div className="guide-stats">
              <div className="stat">
                <span className="stat-value">{guide.order}</span>
                <span className="stat-label">Order</span>
              </div>
              <div className="stat">
                <span className="stat-value">{guide.steps?.length || 0}</span>
                <span className="stat-label">Steps</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedGuide && <GuideDetailModal guideId={selectedGuide.id} onClose={() => setSelectedGuide(null)} />}

      {isGuideModalOpen && (
        <GuideModal
          guide={editingGuide}
          onClose={() => setGuideModalOpen(false)}
          onSaveSuccess={onSaveSuccess}
        />
      )}
    </div>
  );
};

// =================================================================
// Guide Detail Modal (View Only)
// =================================================================
const GuideDetailModal = ({ guideId, onClose }) => {
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        setLoading(true);
        const data = await guidesAPI.getById(guideId);
        setGuide(data);
      } catch (error) {
        console.error("Failed to fetch guide details:", error);
        alert("Could not load guide details.");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [guideId, onClose]);
  
  if (loading || !guide) {
    return (
      <div className="modal-overlay">
        <div className="modal-content large">
          <LoadingSpinner message="Loading guide details..." />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{guide.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="guide-detail">
            <p>{guide.description}</p>
            <h3>Steps ({guide.steps?.length || 0})</h3>
            <div className="steps-list">
            {(guide.steps || []).map((step) => (
              <div key={step.id} className="step-item">
                <img src={getAssetUrl(step.image)} alt={step.title} className="step-item-image" />
                <div className="step-content">
                  <h4>{step.order}. {step.title}</h4>
                  <p>{step.description}</p>
                  <div className="step-meta">
                    <span>⏱️ {step.duration}</span>
                    {step.location && <span>📍 {step.location}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// Guide Add/Edit Modal
// =================================================================
const GuideModal = ({ guide, onClose, onSaveSuccess }) => {
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
  });
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name.startsWith("translation.")) {
      const lang = name.split(".")[1];
      setFormData(prev => ({ ...prev, translation: { ...prev.translation, [lang]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 1 : value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      alert(`Selected image is too large. Please choose a file under ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setImageFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description || '');
    submitData.append('order', formData.order);
    
    // FIX: Stringify the translation object for multipart/form-data
    submitData.append('translation', JSON.stringify(formData.translation));
    
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    try {
      let savedGuide;
      if (guide) {
        // Editing existing guide
        savedGuide = await guidesAPI.update(guide.id, submitData);
      } else {
        // Creating new guide
        if (formData.steps.length > 0) {
          // Include steps for new guide creation
          submitData.append('steps', JSON.stringify(formData.steps.map(step => ({
            title: step.title,
            description: step.description,
            order: step.order,
            text: step.text,
            arabic: step.arabic,
            duration: step.duration,
            location: step.location,
          }))));
          
          // Add step files with indexed names
          formData.steps.forEach((step, index) => {
            if (step._files?.image) submitData.append(`stepImages[${index}]`, step._files.image);
            if (step._files?.audio) submitData.append(`stepAudios[${index}]`, step._files.audio);
            if (step._files?.video) submitData.append(`stepVideos[${index}]`, step._files.video);
          });
        }
        
        savedGuide = await guidesAPI.create(submitData);
      }
      onSaveSuccess();
    } catch (error) {
      console.error("Failed to save guide:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message?.[0] || 'Failed to save guide.';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>{guide ? "Edit Guide" : "Add New Guide"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="guide-form">
          <div className="guide-form-section">
            <div className="form-row">
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
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Image</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                className="input file-input"
              />
              {guide?.image && !imageFile && (
                <div className="current-file">
                  <span>Current:</span>
                  <img src={getAssetUrl(guide.image)} alt="Current guide" />
                </div>
              )}
            </div>
          </div>

          <div className="guide-form-section">
            <h3 className="form-section-title">Guide Title Translations</h3>
            <div className="form-row">
              <div className="form-group">
                <label>English</label>
                <input
                  name="translation.english"
                  value={formData.translation.english}
                  onChange={handleChange}
                  className="input"
                  placeholder="English title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Amharic</label>
                <input
                  name="translation.amharic"
                  value={formData.translation.amharic}
                  onChange={handleChange}
                  className="input"
                  placeholder="Amharic title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Oromo</label>
                <input
                  name="translation.oromo"
                  value={formData.translation.oromo}
                  onChange={handleChange}
                  className="input"
                  placeholder="Oromo title"
                  required
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (guide ? "Update Guide" : "Save Guide")}
            </button>
          </div>
        </form>
        <div className="guide-form-section">
          {guide?.id ? (
            <StepsManager guideId={guide.id} />
          ) : (
            <StepsManager
              isLocal={true}
              localSteps={formData.steps}
              onLocalStepAdd={(step) => setFormData(prev => ({ ...prev, steps: [...prev.steps, step] }))}
              onLocalStepUpdate={(updatedStep) => setFormData(prev => ({
                ...prev,
                steps: prev.steps.map(s => s.id === updatedStep.id ? updatedStep : s)
              }))}
              onLocalStepDelete={(stepId) => setFormData(prev => ({
                ...prev,
                steps: prev.steps.filter(s => s.id !== stepId)
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function StepsManager({ guideId, isLocal, localSteps, onLocalStepAdd, onLocalStepUpdate, onLocalStepDelete }) {
  const [steps, setSteps] = useState(isLocal ? localSteps || [] : []);
  const [loading, setLoading] = useState(!isLocal);
  const [isStepModalOpen, setStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState(null);

  const loadSteps = async () => {
    try {
      setLoading(true);
      const data = await stepsAPI.getAll(guideId);
      setSteps(data || []);
    } catch (error) {
      console.error(`Failed to load steps for guide ${guideId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLocal) {
      loadSteps();
    }
  }, [guideId, isLocal]);

  useEffect(() => {
    if (isLocal) {
      setSteps(localSteps || []);
    }
  }, [localSteps, isLocal]);
  
  const handleAddStep = () => {
    setEditingStep(null);
    setStepModalOpen(true);
  };

  const handleEditStep = (step) => {
    setEditingStep(step);
    setStepModalOpen(true);
  };

  const handleDeleteStep = async (stepId) => {
    if (isLocal) {
      onLocalStepDelete(stepId);
    } else {
      if (window.confirm("Are you sure you want to delete this step?")) {
        try {
          await stepsAPI.delete(stepId);
          await loadSteps(); // Refresh the list
        } catch (error) {
          console.error("Failed to delete step:", error);
          alert("Failed to delete step.");
        }
      }
    }
  };
  
  const onStepSaveSuccess = async () => {
    if (!isLocal) {
      setStepModalOpen(false);
      setEditingStep(null);
      await loadSteps(); // Refresh the list
    }
  };

  const onLocalStepSave = (stepData) => {
    if (editingStep) {
      onLocalStepUpdate(stepData);
    } else {
      onLocalStepAdd(stepData);
    }
    setStepModalOpen(false);
    setEditingStep(null);
  };

  return (
    <div className="steps-section">
      <div className="steps-header">
        <h3>Steps ({steps.length})</h3>
        <button type="button" className="btn btn-secondary" onClick={handleAddStep}>Add Step</button>
      </div>
      {loading ? <p>Loading steps...</p> : (
        <div className="steps-list-form">
        {steps.map((step) => (
          <div key={step.id} className="step-item-form">
            <div className="step-info">
              <span className="step-number">{step.order}</span>
              <span className="step-title">{step.title}</span>
            </div>
            <div className="step-actions">
              <button type="button" title="Edit Step" className="action-btn edit" onClick={() => handleEditStep(step)}>✏️</button>
              <button type="button" title="Delete Step" className="action-btn delete" onClick={() => handleDeleteStep(step.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
      )}
      {isStepModalOpen && (
        <StepModal 
          step={editingStep} 
          guideId={guideId} 
          onClose={() => setStepModalOpen(false)} 
          onSaveSuccess={isLocal ? null : onStepSaveSuccess}
          onLocalSave={isLocal ? onLocalStepSave : null}
        />
      )}
    </div>
  );
}

function StepModal({ step, guideId, onClose, onSaveSuccess, onLocalSave }) {
  const [formData, setFormData] = useState({
    title: step?.title || "",
    description: step?.description || "",
    order: step?.order || 1,
    text: {
      english: step?.text?.english || "",
      amharic: step?.text?.amharic || "",
      oromo: step?.text?.oromo || "",
    },
    arabic: step?.arabic || "",
    duration: step?.duration || "",
    location: step?.location || "",
  });
  const [files, setFiles] = useState({ image: null, audio: null, video: null });
  const [isSubmitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name.startsWith("text.")) {
      const lang = name.split(".")[1];
      setFormData(prev => ({ ...prev, text: { ...prev.text, [lang]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 1 : value }));
    }
  };
  
  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    const file = fileList[0];

    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      alert(`Selected file is too large. Please choose a file under ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setFiles(prev => ({ ...prev, [name]: file || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!onLocalSave && !files.image && !step?.image) {
      alert("An image is required for the step.");
      return;
    }
    setSubmitting(true);

    if (onLocalSave) {
      // Local mode: just return the data
      const stepData = {
        id: step?.id || generateTempId(),
        title: formData.title,
        description: formData.description,
        order: formData.order,
        text: formData.text,
        arabic: formData.arabic || "",
        duration: formData.duration,
        location: formData.location || "",
        image: files.image ? URL.createObjectURL(files.image) : step?.image || "",
        audio: files.audio ? URL.createObjectURL(files.audio) : step?.audio || null,
        video: files.video ? URL.createObjectURL(files.video) : step?.video || null,
        // Store the actual files for later submission
        _files: {
          image: files.image,
          audio: files.audio,
          video: files.video
        }
      };
      onLocalSave(stepData);
    } else {
      // API mode: submit to server
      const hasFiles = files.image || files.audio || files.video;

      if (!hasFiles) {
        // Text-only update: use JSON API to avoid payload size limits
        const textUpdateData = {
          title: formData.title,
          description: formData.description,
          order: formData.order,
          text: formData.text,
          arabic: formData.arabic || '',
          duration: formData.duration,
          location: formData.location || '',
          guideId: guideId,
        };

        try {
          if (step) {
            await stepsAPI.updateJson(step.id, textUpdateData);
          } else {
            // For new steps, we still need to use FormData since files are required
            // This shouldn't happen in text-only case since image is required
            throw new Error("Image is required for new steps");
          }
          onSaveSuccess();
        } catch (error) {
          console.error("Failed to save step:", error.response?.data || error.message);
          const errorMessage = error.response?.data?.message?.[0] || 'Failed to save step.';
          alert(errorMessage);
        } finally {
          setSubmitting(false);
        }
      } else {
        // File upload: use multipart/form-data
        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('description', formData.description);
        submitData.append('order', formData.order);
        submitData.append('duration', formData.duration);
        submitData.append('guideId', guideId);
        submitData.append('arabic', formData.arabic || '');
        submitData.append('location', formData.location || '');

        // FIX: Stringify the text object for multipart/form-data
        submitData.append('text', JSON.stringify(formData.text));

        if (files.image) submitData.append('image', files.image);
        if (files.audio) submitData.append('audio', files.audio);
        if (files.video) submitData.append('video', files.video);

        try {
          if (step) {
            await stepsAPI.update(step.id, submitData);
          } else {
            await stepsAPI.create(submitData);
          }
          onSaveSuccess();
        } catch (error) {
          console.error("Failed to save step:", error.response?.data || error.message);
          const errorMessage = error.response?.data?.message?.[0] || 'Failed to save step.';
          alert(errorMessage);
        } finally {
          setSubmitting(false);
        }
      }
    }
  };

  return (
    <div className="modal-overlay nested">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{step ? "Edit Step" : "Add New Step"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
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
            <label>Short Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="2"
              required
            />
          </div>
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
          <div className="form-group">
            <label>Image</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
              className="input file-input"
              required={!step?.image}
            />
            {step?.image && !files.image && (
              <div className="current-file">
                <span>Current:</span>
                <img src={getAssetUrl(step.image)} alt="Current step" />
              </div>
            )}
          </div>
          <h3>Detailed Text Translations</h3>
          <div className="form-group">
            <label>English</label>
            <textarea
              name="text.english"
              value={formData.text.english}
              onChange={handleChange}
              className="input"
              rows="3"
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
              required
            />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="input"
              placeholder="e.g., 20 minutes"
              required
            />
          </div>
          <div className="form-group">
            <label>Audio (Optional)</label>
            <input
              type="file"
              name="audio"
              accept="audio/*"
              onChange={handleFileChange}
              className="input file-input"
            />
            {step?.audio && !files.audio && (
              <div className="current-file">
                <audio controls src={getAssetUrl(step.audio)} />
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
              className="input file-input"
            />
            {step?.video && !files.video && (
              <div className="current-file">
                <video controls src={getAssetUrl(step.video)} />
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : onLocalSave ? (step ? 'Update Step' : 'Add Step') : (step ? 'Update Step' : 'Add Step')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UmrahGuides;