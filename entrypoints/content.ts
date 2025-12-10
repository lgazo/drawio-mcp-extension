import { bus_reply_stream, bus_request_stream } from "@/types";

// Send message to WebSocket via background
function sendToWebSocket(data: any) {
  browser.runtime.sendMessage({
    type: "SEND_WS_MESSAGE",
    data: data,
  });
}

// Content script is now registered dynamically via background.ts
// The matches are configured by users in the options page
// Note: Firefox requires at least one match pattern in manifest, so we provide a default
// The dynamic registration will override this with user-configured patterns
export default defineContentScript({
  matches: ["*://app.diagrams.net/*"],
  async main() {
    console.log("Hello content " + Date.now(), { window, browser });
    
    // Inject script as external file to avoid CSP violations
    // Create script tag with src pointing to web-accessible resource
    // This loads as external file, satisfying CSP requirements
    const scriptUrl = browser.runtime.getURL("main_world.js");
    
    // Check if script is already injected to avoid duplicates
    const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.type = "module";
      // Inject into main world by appending to page's document
      (document.head || document.documentElement).appendChild(script);
    }

    // Listen for messages from background
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "WS_MESSAGE") {
        console.log(
          "[content] Received from background from WebSocket:",
          message.data,
        );
        // Serialize to JSON string to avoid Firefox Xray vision blocking property access
        // When CustomEvent.detail crosses context boundaries, Firefox wraps it with Xray
        // By passing a JSON string, we avoid any property access on Xray-wrapped objects
        const jsonData = JSON.stringify(message.data);
        window.dispatchEvent(
          new CustomEvent(bus_request_stream, { detail: jsonData }),
        );
      } else if (message.type === "WS_STATUS") {
        console.log(
          "WebSocket status:",
          message.connected ? "Connected" : "Disconnected",
        );
      }
    });

    window.addEventListener(bus_reply_stream, (message: any) => {
      console.log("[content] reply received", message);
      const reply = message.detail;
      if (reply === undefined || reply === null) {
        console.warn(
          `[content] suspicious empty message detail received`,
          message,
        );
      }
      // Clone the reply to ensure it can be serialized properly
      const clonedReply = structuredClone(reply);
      sendToWebSocket(clonedReply);
    });
  },
});
