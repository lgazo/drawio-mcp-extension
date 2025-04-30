// Import browser API from wxt
import { browser } from "wxt/browser";

export default defineBackground(() => {
  console.log("[MCP-EXT] Background script started", { id: browser.runtime.id });

  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds
  // Track current connection state
  let currentConnectionState: "connected" | "connecting" | "disconnected" = "disconnected";
  
  // Track connected Draw.io tabs
  let drawioTabs: number[] = [];

  // Set initial icon state
  setExtensionIcon("disconnected");

  // Function to set extension icon based on connection state
  function setExtensionIcon(
    state: "connected" | "connecting" | "disconnected",
  ) {
    console.log(`[MCP-EXT] Setting extension icon state: ${state}`);
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
    console.log("[MCP-EXT] Attempting to connect to WebSocket server...");
    setExtensionIcon("connecting");
    socket = new WebSocket("ws://localhost:3000");

    socket.addEventListener("open", (event) => {
      console.log("[MCP-EXT] WebSocket connection established", event);
      reconnectAttempts = 0; // Reset reconnect counter on successful connection
      setExtensionIcon("connected");
      
      // Find all Draw.io tabs
      findDrawioTabs();
      
      // Notify content scripts that connection is ready
      broadcastToContentScripts({ type: "WS_STATUS", connected: true });
      
      // Send a HELLO message after successful connection for server identification
      const helloMsg = {
        type: "HELLO",
        client: "drawio-mcp-extension",
        timestamp: Date.now()
      };
      socket?.send(JSON.stringify(helloMsg));
      console.log("[MCP-EXT] HELLO message sent");
    });

    socket.addEventListener("message", (event) => {
      console.log("[MCP-EXT] Received raw message from server:", event.data);
      try {
        // Correctly parse and process server messages
        const data = JSON.parse(event.data);
        
        // Log detailed message content for debugging
        console.log("[MCP-EXT] Parsed server message:", {
          hasEvent: !!data.__event,
          eventName: data.__event,
          requestId: data.__request_id,
          otherFields: Object.keys(data).filter(k => !k.startsWith('__')),
          fullData: data
        });
        
        // If message contains __event field, it's an MCP request
        if (data.__event) {
          console.log(`[MCP-EXT] Detected MCP request: ${data.__event}, will forward to content scripts`);
          
          // Try to directly respond with test data
          if (data.__event === 'get-selected-cell') {
            console.log(`[MCP-EXT] Received get-selected-cell request, attempting direct test response`);
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
            // Delay 2 seconds to ensure logs are visible
            setTimeout(() => {
              if (socket?.readyState === WebSocket.OPEN) {
                console.log(`[MCP-EXT] Sending direct test response:`, testReply);
                socket.send(JSON.stringify(testReply));
              }
            }, 2000);
          }
        } else if (data.type === 'PING') {
          console.log("[MCP-EXT] Received PING heartbeat");
        } else {
          console.log("[MCP-EXT] Received unknown message type:", data);
        }
        
        // Forward message to all content scripts
      broadcastToContentScripts({
        type: "WS_MESSAGE",
          data: data,
      });
      } catch (err) {
        console.error("[MCP-EXT] Failed to parse server message:", err, "Original message:", event.data);
      }
    });

    socket.addEventListener("close", (event) => {
      console.log("[MCP-EXT] WebSocket connection closed", {event, code: event.code, reason: event.reason});
      setExtensionIcon("disconnected");
      broadcastToContentScripts({ type: "WS_STATUS", connected: false });
      attemptReconnect();
    });

    socket.addEventListener("error", (event) => {
      console.error("[MCP-EXT] WebSocket connection error:", event);
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
        `[MCP-EXT] Attempting to reconnect in ${delay / 1000} seconds... (Attempt ${reconnectAttempts})`,
      );

      setTimeout(() => {
        connect();
      }, delay);
    } else {
      console.error("[MCP-EXT] Maximum reconnection attempts reached. Giving up.");
      setExtensionIcon("disconnected");
    }
  }

  // Find all Draw.io tabs
  async function findDrawioTabs() {
    try {
      const drawioUrls = [
        "*://app.diagrams.net/*", 
        "*://*.diagrams.net/*", 
        "*://draw.io/*", 
        "*://*.draw.io/*"
      ];
      
      // Use a more generic type definition to avoid browser namespace issues
      interface Tab {
        id?: number;
        url?: string;
      }
      
      let allTabs: Tab[] = [];
      for (const pattern of drawioUrls) {
        const tabs = await browser.tabs.query({ url: pattern });
        allTabs = [...allTabs, ...tabs];
      }
      
      // Remove duplicates
      const uniqueTabs = Array.from(new Set(allTabs.map(tab => tab.id))).filter(Boolean) as number[];
      drawioTabs = uniqueTabs;
      
      console.log(`[MCP-EXT] Found ${drawioTabs.length} Draw.io tabs:`, {
        tabIds: drawioTabs,
        urls: allTabs.map(t => t.url)
      });
      
      return drawioTabs;
    } catch (err) {
      console.error("[MCP-EXT] Failed to find Draw.io tabs:", err);
      return [];
    }
  }

  // Function to broadcast messages to all content scripts
  async function broadcastToContentScripts(message: any) {
    try {
      // First check if there are any Draw.io tabs
      if (drawioTabs.length === 0) {
        await findDrawioTabs();
      }
      
      if (drawioTabs.length === 0) {
        console.log("[MCP-EXT] No Draw.io tabs found, cannot send message:", message);
        return;
      }
      
      console.log(`[MCP-EXT] Broadcasting message to ${drawioTabs.length} Draw.io tabs:`, message);
      
      // Only send messages to Draw.io tabs
      for (const tabId of drawioTabs) {
        try {
          await browser.tabs.sendMessage(tabId, message);
          console.log(`[MCP-EXT] ✅ Successfully sent message to tab ${tabId}`);
        } catch (err) {
          console.log(`[MCP-EXT] ❌ Failed to send message to tab ${tabId}:`, err);
          
          // Check if tab still exists
          try {
            const tab = await browser.tabs.get(tabId);
            if (!tab) {
              console.log(`[MCP-EXT] Tab ${tabId} does not exist, removing from list`);
              drawioTabs = drawioTabs.filter(id => id !== tabId);
            }
          } catch (e) {
            console.log(`[MCP-EXT] Tab ${tabId} does not exist, removing from list`);
            drawioTabs = drawioTabs.filter(id => id !== tabId);
      }
        }
      }
    } catch (err) {
      console.error("[MCP-EXT] Failed to broadcast message:", err);
    }
  }

  // Handle messages from content scripts and popup
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[MCP-EXT] Received message:", message, "from:", sender?.tab?.url || "popup");
    
    // If message is from a Draw.io tab, record that tab
    if (sender?.tab?.id && 
        sender.tab.url && 
        (sender.tab.url.includes('diagrams.net') || sender.tab.url.includes('draw.io'))) {
      if (!drawioTabs.includes(sender.tab.id)) {
        console.log(`[MCP-EXT] Found new Draw.io tab: ${sender.tab.id} (${sender.tab.url})`);
        drawioTabs.push(sender.tab.id);
      }
    }
    
    if (
      message.type === "SEND_WS_MESSAGE" &&
      socket?.readyState === WebSocket.OPEN
    ) {
      const ser = JSON.stringify(message.data);
      console.log(`[MCP-EXT] Sending WebSocket message:`, {
        received: message.data,
        sending: ser,
      });
      socket.send(ser);
      sendResponse({success: true});
    } else if (message.type === "GET_CONNECTION_STATUS") {
      // Respond to connection status request
      const response = { 
        status: currentConnectionState,
        wsReadyState: socket ? socket.readyState : null
      };
      console.log("[MCP-EXT] Responding to connection status request:", response);
      sendResponse(response);
    } else {
      console.log("[MCP-EXT] Received unknown message type:", message);
      sendResponse({success: false, error: "Unknown message type"});
    }
    return true; // Keep the message channel open for async response
  });

  // Add tab removal listener
  browser.tabs.onRemoved.addListener((tabId) => {
    if (drawioTabs.includes(tabId)) {
      console.log(`[MCP-EXT] Draw.io tab ${tabId} closed, removing from list`);
      drawioTabs = drawioTabs.filter(id => id !== tabId);
    }
  });

  // Initial connection
  connect();

  // Optional: Keepalive ping
  const keepAliveInterval = setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      console.log("[MCP-EXT] Sending heartbeat...");
      socket.send(JSON.stringify({ type: "PING" }));
    }
  }, 30000); // Every 30 seconds

  // Cleanup on extension unload
  browser.runtime.onSuspend.addListener(() => {
    console.log("[MCP-EXT] Extension unloading, cleaning up resources...");
    clearInterval(keepAliveInterval);
    if (socket) {
      socket.close();
    }
  });
});
