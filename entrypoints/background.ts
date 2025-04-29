export default defineBackground(() => {
  console.log("[MCP-EXT] 背景脚本启动", { id: browser.runtime.id });

  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds
  // 跟踪当前连接状态
  let currentConnectionState: "connected" | "connecting" | "disconnected" = "disconnected";
  
  // 跟踪连接到的Draw.io标签页
  let drawioTabs: number[] = [];

  // Set initial icon state
  setExtensionIcon("disconnected");

  // Function to set extension icon based on connection state
  function setExtensionIcon(
    state: "connected" | "connecting" | "disconnected",
  ) {
    console.log(`[MCP-EXT] 设置扩展图标状态: ${state}`);
    currentConnectionState = state;
    const iconSizes = [16, 32, 48, 128];
    const iconPaths = iconSizes.reduce(
      (acc, size) => ({
        ...acc,
        [size]: `/icon/logo_${state}_${size}.png`,
      }),
      {},
    );

    browser.action.setIcon({ path: iconPaths }).catch(console.error);
  }

  // Function to establish WebSocket connection
  function connect() {
    console.log("[MCP-EXT] 尝试连接WebSocket服务器...");
    setExtensionIcon("connecting");
    socket = new WebSocket("ws://localhost:3000");

    socket.addEventListener("open", (event) => {
      console.log("[MCP-EXT] WebSocket连接已建立", event);
      reconnectAttempts = 0; // Reset reconnect counter on successful connection
      setExtensionIcon("connected");
      
      // 查找所有Draw.io标签页
      findDrawioTabs();
      
      // Notify content scripts that connection is ready
      broadcastToContentScripts({ type: "WS_STATUS", connected: true });
      
      // 连接成功后发送一个HELLO消息，方便服务器识别
      const helloMsg = {
        type: "HELLO",
        client: "drawio-mcp-extension",
        timestamp: Date.now()
      };
      socket?.send(JSON.stringify(helloMsg));
      console.log("[MCP-EXT] 已发送HELLO消息");
    });

    socket.addEventListener("message", (event) => {
      console.log("[MCP-EXT] 收到服务器原始消息:", event.data);
      try {
        // 正确解析和处理服务器消息
        const data = JSON.parse(event.data);
        
        // 记录详细的消息内容以便调试
        console.log("[MCP-EXT] 解析后的服务器消息:", {
          hasEvent: !!data.__event,
          eventName: data.__event,
          requestId: data.__request_id,
          otherFields: Object.keys(data).filter(k => !k.startsWith('__')),
          fullData: data
        });
        
        // 如果消息包含__event字段，表明这是一个MCP请求
        if (data.__event) {
          console.log(`[MCP-EXT] 检测到MCP请求: ${data.__event}，将转发到内容脚本`);
          
          // 尝试直接回应一个测试消息
          if (data.__event === 'get-selected-cell') {
            console.log(`[MCP-EXT] 收到get-selected-cell请求，尝试直接回应测试数据`);
            const testReply = {
              __event: `${data.__event}.${data.__request_id}`,
              __request_id: data.__request_id,
              success: true,
              cell: {
                id: 'test-cell-id-direct-from-background',
                value: 'Test Cell (Direct)',
                style: 'default',
                geometry: {
                  x: 100, y: 100, width: 120, height: 60
                }
              }
            };
            // 延迟2秒发送响应，确保可以看到日志
            setTimeout(() => {
              if (socket?.readyState === WebSocket.OPEN) {
                console.log(`[MCP-EXT] 发送直接测试响应:`, testReply);
                socket.send(JSON.stringify(testReply));
              }
            }, 2000);
          }
        } else if (data.type === 'PING') {
          console.log("[MCP-EXT] 收到PING心跳包");
        } else {
          console.log("[MCP-EXT] 收到未知类型消息:", data);
        }
        
        // 转发消息到所有内容脚本
        broadcastToContentScripts({
          type: "WS_MESSAGE",
          data: data,
        });
      } catch (err) {
        console.error("[MCP-EXT] 解析服务器消息失败:", err, "原始消息:", event.data);
      }
    });

    socket.addEventListener("close", (event) => {
      console.log("[MCP-EXT] WebSocket连接已关闭", {event, code: event.code, reason: event.reason});
      setExtensionIcon("disconnected");
      broadcastToContentScripts({ type: "WS_STATUS", connected: false });
      attemptReconnect();
    });

    socket.addEventListener("error", (event) => {
      console.error("[MCP-EXT] WebSocket连接错误:", event);
      setExtensionIcon("disconnected");
    });
  }

  // Reconnection logic with exponential backoff
  function attemptReconnect() {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = reconnectDelay * Math.pow(1.5, reconnectAttempts);
      setExtensionIcon("connecting");
      console.log(
        `[MCP-EXT] ${delay / 1000}秒后尝试重新连接... (第${reconnectAttempts}次尝试)`,
      );

      setTimeout(() => {
        connect();
      }, delay);
    } else {
      console.error("[MCP-EXT] 达到最大重连次数。放弃连接。");
      setExtensionIcon("disconnected");
    }
  }

  // 查找所有Draw.io标签页
  async function findDrawioTabs() {
    try {
      const drawioUrls = [
        "*://app.diagrams.net/*", 
        "*://*.diagrams.net/*", 
        "*://draw.io/*", 
        "*://*.draw.io/*"
      ];
      
      let allTabs = [];
      for (const pattern of drawioUrls) {
        const tabs = await browser.tabs.query({ url: pattern });
        allTabs = [...allTabs, ...tabs];
      }
      
      // 去重
      const uniqueTabs = Array.from(new Set(allTabs.map(tab => tab.id))).filter(Boolean) as number[];
      drawioTabs = uniqueTabs;
      
      console.log(`[MCP-EXT] 找到${drawioTabs.length}个Draw.io标签页:`, {
        tabIds: drawioTabs,
        urls: allTabs.map(t => t.url)
      });
      
      return drawioTabs;
    } catch (err) {
      console.error("[MCP-EXT] 查找Draw.io标签页失败:", err);
      return [];
    }
  }

  // Function to broadcast messages to all content scripts
  async function broadcastToContentScripts(message: any) {
    try {
      // 先检查是否有Draw.io标签页
      if (drawioTabs.length === 0) {
        await findDrawioTabs();
      }
      
      if (drawioTabs.length === 0) {
        console.log("[MCP-EXT] 没有找到Draw.io标签页，无法发送消息:", message);
        return;
      }
      
      console.log(`[MCP-EXT] 广播消息到${drawioTabs.length}个Draw.io标签页:`, message);
      
      // 只向Draw.io标签页发送消息
      for (const tabId of drawioTabs) {
        try {
          await browser.tabs.sendMessage(tabId, message);
          console.log(`[MCP-EXT] ✅ 成功发送消息到标签页${tabId}`);
        } catch (err) {
          console.log(`[MCP-EXT] ❌ 发送消息到标签页${tabId}失败:`, err);
          
          // 检查标签页是否还存在
          try {
            const tab = await browser.tabs.get(tabId);
            if (!tab) {
              console.log(`[MCP-EXT] 标签页${tabId}不存在，从列表中移除`);
              drawioTabs = drawioTabs.filter(id => id !== tabId);
            }
          } catch (e) {
            console.log(`[MCP-EXT] 标签页${tabId}不存在，从列表中移除`);
            drawioTabs = drawioTabs.filter(id => id !== tabId);
          }
        }
      }
    } catch (err) {
      console.error("[MCP-EXT] 广播消息失败:", err);
    }
  }

  // Handle messages from content scripts and popup
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[MCP-EXT] 收到消息:", message, "来自:", sender?.tab?.url || "popup");
    
    // 如果消息来自Draw.io标签页，记录该标签页
    if (sender?.tab?.id && 
        sender.tab.url && 
        (sender.tab.url.includes('diagrams.net') || sender.tab.url.includes('draw.io'))) {
      if (!drawioTabs.includes(sender.tab.id)) {
        console.log(`[MCP-EXT] 找到新的Draw.io标签页: ${sender.tab.id} (${sender.tab.url})`);
        drawioTabs.push(sender.tab.id);
      }
    }
    
    if (
      message.type === "SEND_WS_MESSAGE" &&
      socket?.readyState === WebSocket.OPEN
    ) {
      const ser = JSON.stringify(message.data);
      console.log(`[MCP-EXT] 发送WebSocket消息:`, {
        received: message.data,
        sending: ser,
      });
      socket.send(ser);
      sendResponse({success: true});
    } else if (message.type === "GET_CONNECTION_STATUS") {
      // 响应连接状态请求
      const response = { 
        status: currentConnectionState,
        wsReadyState: socket ? socket.readyState : null
      };
      console.log("[MCP-EXT] 响应连接状态请求:", response);
      sendResponse(response);
    } else {
      console.log("[MCP-EXT] 接收到未知类型消息:", message);
      sendResponse({success: false, error: "Unknown message type"});
    }
    return true; // Keep the message channel open for async response
  });

  // 添加标签页移除监听
  browser.tabs.onRemoved.addListener((tabId) => {
    if (drawioTabs.includes(tabId)) {
      console.log(`[MCP-EXT] Draw.io标签页${tabId}已关闭，从列表中移除`);
      drawioTabs = drawioTabs.filter(id => id !== tabId);
    }
  });

  // Initial connection
  connect();

  // Optional: Keepalive ping
  const keepAliveInterval = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      console.log("[MCP-EXT] 发送心跳包...");
      socket.send(JSON.stringify({ type: "PING" }));
    }
  }, 30000); // Every 30 seconds

  // Cleanup on extension unload
  browser.runtime.onSuspend.addListener(() => {
    console.log("[MCP-EXT] 扩展正在卸载，清理资源...");
    clearInterval(keepAliveInterval);
    if (socket) {
      socket.close();
    }
  });
});
