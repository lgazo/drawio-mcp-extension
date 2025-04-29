import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected");
  const [websocketUrl, setWebsocketUrl] = useState("ws://localhost:3000");

  useEffect(() => {
    // 检查扩展连接状态
    chrome.runtime.sendMessage({ type: "GET_CONNECTION_STATUS" }, (response) => {
      if (response && response.status) {
        setConnectionStatus(response.status);
      }
    });

    // 监听连接状态变化
    const listener = (message: any) => {
      if (message.type === "WS_STATUS") {
        setConnectionStatus(message.connected ? "connected" : "disconnected");
      }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div className="drawio-mcp-container">
      <h1>Draw.io MCP Extension</h1>
      
      <div className="status-container">
        <div className="status-indicator">
          <div className={`status-dot ${connectionStatus}`}></div>
          <span>状态: {
            connectionStatus === "connected" ? "已连接" : 
            connectionStatus === "connecting" ? "连接中..." : 
            "未连接"
          }</span>
        </div>
      </div>
      
      <div className="connection-info">
        <p>WebSocket: {websocketUrl}</p>
      </div>

      <div className="features-list">
        <h3>支持的功能:</h3>
        <ul>
          <li>获取选中的单元格</li>
          <li>添加矩形形状</li>
          <li>添加连接线（边）</li>
          <li>删除单元格</li>
          <li>获取形状类别</li>
          <li>添加特定形状</li>
        </ul>
      </div>

      <div className="instructions">
        <p>请打开 <a href="https://app.diagrams.net/" target="_blank">Draw.io</a> 网站以使用MCP功能</p>
      </div>
    </div>
  );
}

export default App;
