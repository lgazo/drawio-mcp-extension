import { useState, useEffect } from "react";
import "./App.css";
import { getConfig } from "../../config";

function App() {
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [urlPatterns, setUrlPatterns] = useState<string[]>([]);

  useEffect(() => {
    // Load current configuration to show URL patterns
    getConfig().then(config => {
      setUrlPatterns(config.urlPatterns);
    }).catch(error => console.error("Error loading config:", error));
  }, []);

  // Use default logo since we don't have connection state anymore
  const logoSrc = `/icon/logo_128.png`;

  return (
    <>
      <div>
        <a href="https://github.com/lgazo/drawio-mcp-extension" target="_blank">
          <img src={logoSrc} className="logo" alt="Draw.io MCP logo" />
        </a>
      </div>
      <h1>Draw.io MCP</h1>
      <div className="header-actions">
        <button
          onClick={() => browser.runtime.openOptionsPage()}
          className="settings-button"
          title="Open Settings"
        >
          ⚙️ Extension Settings
        </button>
      </div>

      <div className="card">
        <h3>🚀 Getting Started</h3>
        <ol>
          <li>Open any <strong>Draw.io</strong> website that matches your configured URL patterns</li>
          <li>Look for <strong>"Draw.io MCP"</strong> in the Draw.io Extras menu to configure the plugin</li>
          <li>Start using MCP tools to create and modify diagrams</li>
        </ol>
      </div>

      <div className="card">
        <p><strong>Extension Status:</strong></p>
        <ul>
          <li>Content scripts will be injected on: <strong>{urlPatterns.length} URL pattern{urlPatterns.length !== 1 ? 's' : ''}</strong></li>
          {urlPatterns.length > 0 && (
            <li>Active patterns: {urlPatterns.slice(0, 2).join(', ')}{urlPatterns.length > 2 ? ` and ${urlPatterns.length - 2} more` : ''}</li>
          )}
        </ul>
      </div>

      <div className="card">
        <p>
          <strong>⚠️ Note:</strong> WebSocket configuration and connection status are now managed
          within the Draw.io plugin itself, not in this extension popup.
        </p>
      </div>

      <div className="card align-left features-section">
        <h3
          className="features-heading"
          onClick={() => setFeaturesExpanded(!featuresExpanded)}
        >
          Supported Features: <span className={`expand-icon ${featuresExpanded ? 'expanded' : ''}`}>▶</span>
        </h3>
        {featuresExpanded && (
          <ul className="features-list">
            <li>Get selected cell</li>
            <li>Add rectangle shape</li>
            <li>Add connection line (edge)</li>
            <li>Delete cell</li>
            <li>Get shape categories</li>
            <li>Add specific shape</li>
            <li>Set cell shape and data</li>
            <li>List paged model</li>
            <li>Edit cells and edges</li>
          </ul>
        )}
      </div>

      <div className="card">
        <p>
          <small>
            Learn more at <a href="https://github.com/lgazo/drawio-mcp-extension" target="_blank">GitHub</a>
          </small>
        </p>
      </div>
    </>
  );
}

export default App;
