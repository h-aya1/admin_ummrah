"use client"

import { useState } from "react"

const Settings = () => {
  const [settings, setSettings] = useState({
    general: {
      appName: "Umrah Guide Admin",
      defaultLanguage: "en",
      timezone: "Asia/Riyadh",
      enableNotifications: true,
    },
    security: {
      sessionTimeout: 30,
      requireTwoFactor: false,
      passwordExpiry: 90,
    },
    features: {
      enableLocationTracking: true,
      enableChatModeration: true,
      enableEmergencyAlerts: true,
      enableWeatherAlerts: true,
    },
  })

  const handleSettingChange = (category, key, value) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    })
  }

  const handleSaveSettings = () => {
    // Simulate saving settings
    alert("Settings saved successfully!")
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="header-content">
          <h1>System Settings</h1>
          <p>Configure system preferences and security settings</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveSettings}>
          Save Settings
        </button>
      </div>

      <div className="settings-sections">
        <div className="settings-section">
          <h2>General Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Application Name</label>
              <input
                type="text"
                value={settings.general.appName}
                onChange={(e) => handleSettingChange("general", "appName", e.target.value)}
                className="input"
              />
            </div>

            <div className="setting-item">
              <label>Default Language</label>
              <select
                value={settings.general.defaultLanguage}
                onChange={(e) => handleSettingChange("general", "defaultLanguage", e.target.value)}
                className="input"
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="am">Amharic</option>
                <option value="or">Oromo</option>
              </select>
            </div>

            <div className="setting-item">
              <label>Timezone</label>
              <select
                value={settings.general.timezone}
                onChange={(e) => handleSettingChange("general", "timezone", e.target.value)}
                className="input"
              >
                <option value="Asia/Riyadh">Asia/Riyadh</option>
                <option value="UTC">UTC</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
              </select>
            </div>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.general.enableNotifications}
                  onChange={(e) => handleSettingChange("general", "enableNotifications", e.target.checked)}
                />
                Enable Push Notifications
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Security Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSettingChange("security", "sessionTimeout", Number.parseInt(e.target.value))}
                className="input"
                min="5"
                max="120"
              />
            </div>

            <div className="setting-item">
              <label>Password Expiry (days)</label>
              <input
                type="number"
                value={settings.security.passwordExpiry}
                onChange={(e) => handleSettingChange("security", "passwordExpiry", Number.parseInt(e.target.value))}
                className="input"
                min="30"
                max="365"
              />
            </div>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.security.requireTwoFactor}
                  onChange={(e) => handleSettingChange("security", "requireTwoFactor", e.target.checked)}
                />
                Require Two-Factor Authentication
              </label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Feature Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.features.enableLocationTracking}
                  onChange={(e) => handleSettingChange("features", "enableLocationTracking", e.target.checked)}
                />
                Enable Location Tracking
              </label>
            </div>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.features.enableChatModeration}
                  onChange={(e) => handleSettingChange("features", "enableChatModeration", e.target.checked)}
                />
                Enable Chat Moderation
              </label>
            </div>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.features.enableEmergencyAlerts}
                  onChange={(e) => handleSettingChange("features", "enableEmergencyAlerts", e.target.checked)}
                />
                Enable Emergency Alerts
              </label>
            </div>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.features.enableWeatherAlerts}
                  onChange={(e) => handleSettingChange("features", "enableWeatherAlerts", e.target.checked)}
                />
                Enable Weather Alerts
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
