import React from "react";
import { useApp } from "../../contexts/AppContext";

function Settings() {
  const { language, setLanguage, theme, setTheme } = useApp();

  return (
    <div className="page settings-page">
      <h2>Settings</h2>

      <div className="card">
        <h3>Appearance</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Theme</label>
            <select value={theme} onChange={(e)=>setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Language</h3>
        <div className="form-row">
          <div className="form-group">
            <label>App language</label>
            <select value={language} onChange={(e)=>setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="am">Amharic</option>
              <option value="or">Oromo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>About</h3>
        <p className="muted">Umrah Guide Admin Dashboard</p>
      </div>
    </div>
  );
}

export default Settings;


