import { Bus, bus_reply_stream, bus_request_stream } from "./types";

export const bus: Bus = {
  send_reply_to_server: (reply: any) => {
    console.debug(`[bus] sending reply`, reply);
    window.dispatchEvent(new CustomEvent(bus_reply_stream, { detail: reply }));
  },
  on_request_from_server: (event_name, request_listener) => {
    console.debug(`[bus] registered ${event_name}`);
    const listener = (emitter_data: any) => {
      console.debug(`[bus] received ${event_name}`, emitter_data);
      const event = emitter_data.detail;
      if (event.__event === event_name) {
        request_listener(event);
      }
    };
    window.addEventListener(bus_request_stream, listener);
  },
};
