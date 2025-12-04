import { useState, useEffect } from "react";
import { getConfig, saveConfig, resetConfigToDefaults, type ExtensionConfig } from "../../config";

function Options() {
  const [config, setConfig] = useState<ExtensionConfig>({ websocketPort: 3333 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [portInput, setPortInput] = useState('');

  useEffect(() => {
    // Load current configuration
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const currentConfig = await getConfig();
      setConfig(currentConfig);
      setPortInput(currentConfig.websocketPort.toString());
    } catch (error) {
      console.error('Failed to load config:', error);
      setMessage({ type: 'error', text: 'Failed to load current configuration' });
    } finally {
      setLoading(false);
    }
  };

  const validatePort = (port: string): { isValid: boolean; error?: string } => {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum)) {
      return { isValid: false, error: 'Port must be a number' };
    }
    if (portNum < 1024 || portNum > 65535) {
      return { isValid: false, error: 'Port must be between 1024 and 65535' };
    }
    return { isValid: true };
  };

  const handleSave = async () => {
    const validation = validatePort(portInput);
    if (!validation.isValid) {
      setMessage({ type: 'error', text: validation.error || 'Invalid port' });
      return;
    }

    setSaving(true);
    try {
      const newConfig: ExtensionConfig = {
        websocketPort: parseInt(portInput, 10)
      };
      await saveConfig(newConfig);
      setConfig(newConfig);
      setMessage({ type: 'success', text: 'Settings saved successfully! Connection will reconnect automatically.' });
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await resetConfigToDefaults();
      const defaultConfig = await getConfig(); // Reload from defaults
      setConfig(defaultConfig);
      setPortInput(defaultConfig.websocketPort.toString());
      setMessage({ type: 'success', text: 'Settings reset to defaults! Connection will reconnect automatically.' });
    } catch (error) {
      console.error('Failed to reset config:', error);
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (value: string) => {
    setPortInput(value);
    if (message) {
      setMessage(null);
    }
  };

  if (loading) {
    return (
      <div className="options-container">
        <h1>Draw.io MCP Extension - Settings</h1>
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="options-container">
      <h1>Draw.io MCP Extension - Settings</h1>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h3>WebSocket Server Configuration</h3>

        <div className="form-group">
          <label htmlFor="port-input">Port Number:</label>
          <input
            id="port-input"
            type="number"
            value={portInput}
            onChange={(e) => handleInputChange(e.target.value)}
            min={1024}
            max={65535}
            className="port-input"
            disabled={saving}
            placeholder="3333"
          />
          <span className="input-hint">(1024-65535)</span>
        </div>

        <div className="button-container">
          <button
            onClick={handleSave}
            disabled={saving}
            className="save-button"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={handleReset}
            disabled={saving}
            className="reset-button"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="card notice">
        <p><strong>Note:</strong> Changing the port will automatically reconnect the WebSocket connection if it's active.</p>
        <p>Current configured port: <strong>{config.websocketPort}</strong></p>
      </div>
    </div>
  );
}

export default Options;
