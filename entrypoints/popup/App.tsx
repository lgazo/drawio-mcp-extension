import { useState, useEffect } from "react";
import "./App.css";
import { browser } from "wxt/browser";

function App() {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const [websocketUrl, setWebsocketUrl] = useState("ws://localhost:3000");

  useEffect(() => {
    // Check extension connection status
    browser.runtime.sendMessage({ type: "GET_CONNECTION_STATUS" }, (response: { status?: string }) => {
      if (response && response.status) {
        setConnectionStatus(response.status as "connected" | "connecting" | "disconnected");
      }
    });

    // Listen for connection status changes
    const listener = (message: any) => {
      if (message.type === "WS_STATUS") {
        setConnectionStatus(message.connected ? "connected" : "disconnected");
      }
    };
    
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div className="drawio-mcp-container">
      <h1>Draw.io MCP Extension</h1>
      
      <div className="status-container">
        <div className="status-indicator">
          <div className={`status-dot ${connectionStatus}`}></div>
          <span>Status: {
            connectionStatus === "connected" ? "Connected" : 
            connectionStatus === "connecting" ? "Connecting..." : 
            "Disconnected"
          }</span>
        </div>
      </div>
      
      <div className="connection-info">
        <p>WebSocket: {websocketUrl}</p>
      </div>

      <div className="features-list">
        <h3>Supported Features:</h3>
        <ul>
          <li>Get selected cell</li>
          <li>Add rectangle shape</li>
          <li>Add connection line (edge)</li>
          <li>Delete cell</li>
          <li>Get shape categories</li>
          <li>Add specific shape</li>
        </ul>
      </div>

      <div className="instructions">
        <p>Please open <a href="https://app.diagrams.net/" target="_blank">Draw.io</a> website to use MCP features</p>
      </div>
    </div>
  );
}

export default App;
