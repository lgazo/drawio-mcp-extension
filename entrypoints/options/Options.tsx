import { useState, useEffect, useMemo } from "react";
import { getConfig, saveConfig, resetConfigToDefaults, type ExtensionConfig } from "../../config";
import { validateMV3Pattern, isValidPatternList, deduplicatePatterns, patternsAreEquivalent } from "../../utils/urlPatternValidator";

function Options() {
  const [config, setConfig] = useState<ExtensionConfig>({ urlPatterns: ["*://app.diagrams.net/*"] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [newPatternInput, setNewPatternInput] = useState('');
  const [patternsError, setPatternsError] = useState<string>('');

  useEffect(() => {
    // Load current configuration
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const currentConfig = await getConfig();
      setConfig(currentConfig);
      setPatterns(currentConfig.urlPatterns);
    } catch (error) {
      console.error('Failed to load config:', error);
      setMessage({ type: 'error', text: 'Failed to load current configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate patterns
    if (!isValidPatternList(patterns)) {
      setMessage({ type: 'error', text: 'Invalid URL patterns detected. Please fix errors and try again.' });
      return;
    }

    setSaving(true);
    try {
      const uniquePatterns = deduplicatePatterns(patterns);
      const newConfig: ExtensionConfig = {
        urlPatterns: uniquePatterns
      };
      await saveConfig(newConfig);
      setConfig(newConfig);
      setPatterns(uniquePatterns);
      setMessage({ type: 'success', text: 'Extension settings saved successfully! Content scripts will be re-registered for new URLs.' });
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
      setPatterns(defaultConfig.urlPatterns);
      setMessage({ type: 'success', text: 'Extension settings reset to defaults! Content scripts will be re-registered.' });
    } catch (error) {
      console.error('Failed to reset config:', error);
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  // Pattern management functions
  const addPattern = (patterns: string[], newPattern: string): string[] => {
    return deduplicatePatterns([...patterns, newPattern].filter(p => p.trim()));
  };

  const removePattern = (patterns: string[], index: number): string[] => {
    return patterns.filter((_, i) => i !== index);
  };

  const handleAddPattern = () => {
    if (!newPatternInput.trim()) {
      setPatternsError('URL pattern cannot be empty');
      return;
    }

    const validation = validateMV3Pattern(newPatternInput.trim());
    if (!validation.isValid) {
      setPatternsError(validation.error || 'Invalid URL pattern');
      return;
    }

    setPatterns(prev => addPattern(prev, newPatternInput.trim()));
    setNewPatternInput('');
    setPatternsError('');
  };

  const handleRemovePattern = (index: number) => {
    setPatterns(prev => removePattern(prev, index));
  };

  const handlePatternInputChange = (value: string) => {
    setNewPatternInput(value);
    if (patternsError) setPatternsError('');
  };

  // Validation memos for real-time feedback
  const newPatternValidation = useMemo(() =>
    validateMV3Pattern(newPatternInput.trim()), [newPatternInput]);

  const patternsListValidation = useMemo(() =>
    patterns.map(pattern => ({
      pattern,
      ...validateMV3Pattern(pattern)
    })), [patterns]);

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

      <div className="card main-settings-card">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* URL Patterns for Content Script Injection */}
          <div className="settings-section">
            <h3>URL Patterns for Content Script Injection</h3>
            <p className="card-description">
              Configure URL patterns where the Draw.io MCP Extension should inject its content scripts.
              These follow Chrome's MV3 match pattern format. The MCP plugin itself will be configured
              within Draw.io once injected.
            </p>

            <div className="pattern-input-section">
              <div className="form-group">
                <label htmlFor="pattern-input">Add URL Pattern:</label>
                <div className="pattern-input-group">
                  <input
                    id="pattern-input"
                    type="text"
                    value={newPatternInput}
                    onChange={(e) => handlePatternInputChange(e.target.value)}
                    placeholder="e.g., *://app.diagrams.net/* or https://example.com/*"
                    className={`pattern-input ${newPatternValidation.isValid && newPatternInput.trim() ? 'valid' : !newPatternValidation.isValid && newPatternInput.trim() ? 'invalid' : ''}`}
                    disabled={saving}
                  />
                  <button
                    onClick={handleAddPattern}
                    disabled={!newPatternValidation.isValid || !newPatternInput.trim() || saving}
                    className="add-pattern-button"
                    type="button"
                  >
                    Add
                  </button>
                </div>
                {patternsError && <span className="error-text">{patternsError}</span>}
                {newPatternInput.trim() && !newPatternValidation.isValid && (
                  <span className="error-text">{newPatternValidation.error}</span>
                )}
                {newPatternInput.trim() && newPatternValidation.isValid && (
                  <span className="success-text">Valid MV3 pattern</span>
                )}
              </div>
            </div>

            <div className="patterns-list">
              <h4>Current URL Patterns ({patterns.length})</h4>
              {patterns.length === 0 ? (
                <p className="no-patterns">No URL patterns configured. Add at least one pattern for the extension to work.</p>
              ) : (
                <ul className="pattern-list">
                  {patternsListValidation.map((item, index) => (
                    <li key={index} className={`pattern-item ${item.isValid ? 'valid' : 'invalid'}`}>
                      <span className="pattern-text">{item.pattern}</span>
                      {patternsAreEquivalent(item.pattern, "*://app.diagrams.net/*") && (
                        <span className="default-badge">default</span>
                      )}
                      <button
                        onClick={() => handleRemovePattern(index)}
                        disabled={saving}
                        className="remove-pattern-button"
                        title="Remove pattern"
                        type="button"
                      >
                        ×
                      </button>
                      {!item.isValid && (
                        <div className="pattern-error">{item.error}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pattern-examples">
              <h5>Example Patterns:</h5>
              <ul>
                <li><code>*://app.diagrams.net/*</code> - Default (matches app.diagrams.net)</li>
                <li><code>*://*.diagrams.net/*</code> - Self-hosted on diagrams.net subdomain</li>
                <li><code>https://draw.example.com/*</code> - Custom domain</li>
                <li><code>https://draw.example.com/drawio/*</code> - Specific path</li>
              </ul>
            </div>
          </div>

          {/* Save Buttons */}
          <div className="form-actions button-container">
            <button
              type="submit"
              disabled={saving}
              className="save-button"
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>

            <button
              onClick={handleReset}
              disabled={saving}
              className="reset-button"
              type="button"
            >
              Reset to Defaults
            </button>
          </div>
        </form>
      </div>

      <div className="card notice">
        <p><strong>Note:</strong> Changes to URL patterns take effect immediately. Content scripts will be re-registered for the new URL patterns.</p>
        <p><strong>Security:</strong> The extension only injects scripts on the URLs you configure here.</p>
      </div>
    </div>
  );
}

export default Options;
