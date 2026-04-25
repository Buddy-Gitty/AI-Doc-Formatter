import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css'; // or we rely on index.css

function App() {
  const [file, setFile] = useState(null);
  const [instruction, setInstruction] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setError('');
    setResult(null);
    const validTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(txt|pdf|docx)$/i)) {
      setError('Please upload a valid .txt, .pdf, or .docx file.');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a file to format.');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('document', file);
    if (instruction) {
      formData.append('instruction', instruction);
    }

    try {
      const response = await axios.post('http://localhost:3001/api/format', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred while formatting the document.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result && result.downloadId) {
      window.location.href = `http://localhost:3001/api/download/${result.downloadId}`;
    }
  };

  const renderPreview = (layout) => {
    if (!layout || !layout.sections) return null;

    return (
      <div className="doc-preview animate-fade-in mt-4">
        {layout.title && (
          <h1 className="text-center">{layout.title}</h1>
        )}
        {layout.sections.map((section, index) => {
          const alignmentClass = `text-${section.align || 'start'}`;
          
          if (section.type === 'header') {
            return <h1 key={index} className={alignmentClass}>{section.content}</h1>;
          } else if (section.type === 'heading') {
            const HTag = `h${section.level || 2}`;
            return <HTag key={index} className={alignmentClass}>{section.content}</HTag>;
          } else if (section.type === 'paragraph') {
            return <p key={index} className={alignmentClass}>{section.content}</p>;
          } else if (section.type === 'list') {
            const ListTag = section.ordered ? 'ol' : 'ul';
            return (
              <ListTag key={index} className={alignmentClass}>
                {section.items && section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ListTag>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="text-center mb-5 animate-fade-in">
        <h1 className="header-title">AI Document Formatter</h1>
        <p className="header-subtitle fs-5">Upload your raw document and let Claude handle the formatting</p>
      </header>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="glass-panel animate-fade-in">
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            <div 
              className={`drop-zone mb-4 ${isDragging ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInputChange} 
                style={{ display: 'none' }} 
                accept=".txt,.pdf,.docx"
              />
              <div className="drop-zone-icon">
                📄
              </div>
              <h4>{file ? file.name : 'Drag & Drop your document here'}</h4>
              <p className="text-secondary mb-0">or click to browse (.docx, .pdf, .txt)</p>
            </div>

            <div className="mb-4">
              <label htmlFor="instructions" className="form-label text-light">Formatting instructions (optional)</label>
              <textarea 
                className="form-control custom-textarea" 
                id="instructions" 
                rows="3" 
                placeholder="e.g., Use APA format, bold all section headings, make it one page..."
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              ></textarea>
            </div>

            <div className="d-grid">
              <button 
                className="btn btn-gradient btn-lg d-flex justify-content-center align-items-center gap-2" 
                onClick={handleSubmit}
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <div className="spinner-border text-light" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Processing with Claude...
                  </>
                ) : (
                  <>
                    ✨ Format Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {result && result.layout && (
        <div className="row justify-content-center mt-5">
          <div className="col-lg-10">
            <div className="d-flex justify-content-between align-items-center mb-3 animate-fade-in">
              <h3 className="mb-0">Document Preview</h3>
              <button className="btn btn-success btn-lg" onClick={handleDownload}>
                ⬇️ Download .docx
              </button>
            </div>
            {renderPreview(result.layout)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
