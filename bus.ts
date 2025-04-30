import { Bus, bus_reply_stream, bus_request_stream } from "./types";

export const bus: Bus = {
  send_reply_to_server: (reply: any) => {
    console.log(`[MCP-EXT-BUS] Sending response to server:`, reply);
    try {
    window.dispatchEvent(new CustomEvent(bus_reply_stream, { detail: reply }));
      console.log(`[MCP-EXT-BUS] Response event dispatched: ${bus_reply_stream}`, {
        eventName: reply.__event,
        requestId: reply.__request_id
      });
    } catch (err) {
      console.error(`[MCP-EXT-BUS] Failed to dispatch response event:`, err);
    }
  },
  on_request_from_server: (event_name, request_listener) => {
    console.log(`[MCP-EXT-BUS] Registering event listener: ${event_name} to ${bus_request_stream}`);
    
    // Global test event listener to verify event system is working
    window.addEventListener("BUS_TEST_EVENT", (e) => {
      console.log(`[MCP-EXT-BUS] Test event received, event listening system working normally`);
    }, { once: true });
    
    // Verify event system
    console.log(`[MCP-EXT-BUS] Triggering test event to verify event system`);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("BUS_TEST_EVENT"));
    }, 100);
    
    const listener = (emitter_data: any) => {
      try {
        console.log(`[MCP-EXT-BUS] Received event stream: ${bus_request_stream}`, emitter_data);
        
        if (!emitter_data || !emitter_data.detail) {
          console.error(`[MCP-EXT-BUS] Received event has no detail field`);
          return;
        }
        
      const event = emitter_data.detail;
        console.log(`[MCP-EXT-BUS] Received event details:`, {
          receivedEvent: event.__event,
          expectedEvent: event_name,
          requestId: event.__request_id,
          hasDetail: !!emitter_data.detail,
          eventKeys: event ? Object.keys(event) : []
        });
        
      if (event.__event === event_name) {
          console.log(`[MCP-EXT-BUS] 💡 Match successful! Processing event: ${event_name}`, event);
          try {
            const result = request_listener(event);
            console.log(`[MCP-EXT-BUS] Event processing completed: ${event_name}`, { result });
          } catch (err) {
            console.error(`[MCP-EXT-BUS] Failed to process event ${event_name}:`, err);
          }
        } else {
          console.log(`[MCP-EXT-BUS] Ignoring non-matching event, expected:${event_name}, actual:${event.__event || 'undefined'}`);
        }
      } catch (err) {
        console.error(`[MCP-EXT-BUS] Failed to process event stream:`, err);
      }
    };
    
    // Add event listener
    console.log(`[MCP-EXT-BUS] Adding event listener: ${bus_request_stream} -> ${event_name}`);
    window.addEventListener(bus_request_stream, listener);
    
    return () => {
      console.log(`[MCP-EXT-BUS] Removing event listener: ${event_name}`);
      window.removeEventListener(bus_request_stream, listener);
    };
  },
};
