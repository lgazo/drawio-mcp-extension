import { bus_reply_stream, bus_request_stream } from "@/types";

// Send message to WebSocket via background
function sendToWebSocket(data: any) {
  console.log("[MCP-EXT-CONTENT] Sending message to WebSocket:", data);
  browser.runtime.sendMessage({
    type: "SEND_WS_MESSAGE",
    data: data,
  }).then((response) => {
    console.log("[MCP-EXT-CONTENT] Message sent to background script, response:", response);
  }).catch(err => {
    console.error("[MCP-EXT-CONTENT] Failed to send message to background script:", err);
  });
}

export default defineContentScript({
  matches: [
    "*://app.diagrams.net/*",
    "*://*.diagrams.net/*",
    "*://draw.io/*",
    "*://*.draw.io/*"
  ],
  async main() {
    console.log("[MCP-EXT-CONTENT] Content script loaded", { time: Date.now(), window, browser });
    
    // Print bus constant values to ensure they were imported correctly
    console.log("[MCP-EXT-CONTENT] Bus constants:", { 
      bus_request_stream, 
      bus_reply_stream,
      types: typeof bus_request_stream
    });
    
    try {
      console.log("[MCP-EXT-CONTENT] Injecting main script into page...");
    await injectScript("/main_world.js", {
      keepInDom: true,
    });
      console.log("[MCP-EXT-CONTENT] Main script injected successfully");
    } catch (err) {
      console.error("[MCP-EXT-CONTENT] Failed to inject main script:", err);
    }

    // Send a test event to check if the event system is working
    setTimeout(() => {
      console.log("[MCP-EXT-CONTENT] Sending test event to page");
      const testEvent = new CustomEvent("TEST_EVENT", { detail: { test: true } });
      window.dispatchEvent(testEvent);
      
      // Test BUS_REQUEST event
      console.log(`[MCP-EXT-CONTENT] Sending test ${bus_request_stream} event to page`);
      const busRequestEvent = new CustomEvent(bus_request_stream, { 
        detail: { 
          __event: "test-event", 
          __request_id: "test-123" 
        } 
      });
      window.dispatchEvent(busRequestEvent);
    }, 2000);

    // Listen for messages from background
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("[MCP-EXT-CONTENT] Received message from background:", message);
      
      // 立即发送响应确认收到消息
      sendResponse({ received: true });
      
      if (message.type === "WS_MESSAGE") {
        console.log(
          "[MCP-EXT-CONTENT] Received WebSocket message, forwarding to page:",
          message.data,
        );
        
        try {
          // Ensure message.data is a valid object
          if (message.data && (typeof message.data === 'object' || typeof message.data === 'string')) {
            const eventData = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
            
            console.log("[MCP-EXT-CONTENT] Message details:", {
              messageType: message.type,
              hasEvent: !!eventData.__event,
              eventName: eventData.__event || "No event name",
              requestId: eventData.__request_id || "No request ID",
              fullData: eventData
            });
            
            // Check if there's an __event field, which is a sign of a server request
            if (eventData.__event) {
              console.log(`[MCP-EXT-CONTENT] Detected valid MCP request event: ${eventData.__event}`);
              
              // Create and dispatch BUS_REQUEST event to the page
              console.log(`[MCP-EXT-CONTENT] Preparing to dispatch event ${bus_request_stream} to page, event content:`, eventData);
              
              // Create and dispatch the actual event
              const event = new CustomEvent(bus_request_stream, { detail: eventData });
              window.dispatchEvent(event);
              console.log(`[MCP-EXT-CONTENT] Dispatched ${bus_request_stream} event to page`);
              
              // If it's a specific request, can directly reply with test data
              if (eventData.__event === 'get-selected-cell') {
                console.log(`[MCP-EXT-CONTENT] Received selected cell request, preparing direct test response`);
                
                // Directly create and send test response
                const testReply = {
                  __event: `${eventData.__event}.${eventData.__request_id}`,
                  __request_id: eventData.__request_id,
                  success: true,
                  cell: {
                    id: 'test-cell-id-direct-from-content',
                    value: 'Test Cell (Content)',
                    style: 'default',
                    geometry: {
                      x: 200, y: 200, width: 150, height: 80
                    }
                  }
                };
                
                // Delay 1 second to ensure logs are visible
                setTimeout(() => {
                  console.log(`[MCP-EXT-CONTENT] Sending test response:`, testReply);
                  sendToWebSocket(testReply);
                }, 1000);
              }
            } else {
              console.log("[MCP-EXT-CONTENT] Message doesn't contain __event field, cannot dispatch to page", eventData);
            }
          } else {
            console.error("[MCP-EXT-CONTENT] Received message data is not a valid object:", message.data);
          }
        } catch (err) {
          console.error("[MCP-EXT-CONTENT] Failed to process WebSocket message:", err);
        }
      } else if (message.type === "WS_STATUS") {
        console.log(
          "[MCP-EXT-CONTENT] WebSocket status update:",
          message.connected ? "Connected" : "Disconnected",
        );
      } else if (message.type === "TEST_MESSAGE") {
        console.log("[MCP-EXT-CONTENT] Received test message. Communication working properly.");
      }
      
      return true; // Keep the message channel open for async response
    });

    window.addEventListener(bus_reply_stream, (message: any) => {
      console.log("[MCP-EXT-CONTENT] Received response from page:", message.detail);
      try {
      const reply = message.detail;
        if (reply) {
          console.log("[MCP-EXT-CONTENT] Sending page response to server:", reply);
      sendToWebSocket(reply);
        } else {
          console.error("[MCP-EXT-CONTENT] Page response doesn't contain valid data");
        }
      } catch (err) {
        console.error("[MCP-EXT-CONTENT] Failed to process page response:", err);
      }
    });
    
    // Check if the page is already fully loaded
    if (document.readyState === "complete") {
      console.log("[MCP-EXT-CONTENT] Page is already fully loaded");
    } else {
      console.log("[MCP-EXT-CONTENT] Page not fully loaded yet, waiting...");
      window.addEventListener("load", () => {
        console.log("[MCP-EXT-CONTENT] Page load complete");
      });
    }
    
    // Periodically check Draw.io status
    // Fix type error by declaring Draw property on window
    interface WindowWithDraw extends Window {
      Draw?: any;
    }
    
    const checkDrawioInterval = setInterval(() => {
      if ((window as WindowWithDraw).Draw) {
        console.log("[MCP-EXT-CONTENT] Detected Draw.io has loaded");
        clearInterval(checkDrawioInterval);
      }
    }, 2000);
  },
});
