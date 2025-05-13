/**
  EXTENSION
*/

export const bus_request_stream = "BUS_REQUEST";
export const bus_reply_stream = "BUS_REPLY";

export type BusListener<RQ> = (request: RQ) => void;
export type Bus = {
  send_reply_to_server: <RL>(reply: RL) => void;
  on_request_from_server: <RQ>(
    event_name: string,
    listener: BusListener<RQ>,
  ) => void;
};

/**
 * Draw.io API type definitions
 */

// Graph interface for the editor's graph property
export interface DrawioGraph {
  getSelectionCell: () => any;
  // Add other graph methods as needed
}

// Editor interface for the UI's editor property
export interface DrawioEditor {
  graph: DrawioGraph;
  // Add other editor properties as needed
}

// UI interface for the loadPlugin callback parameter
export interface DrawioUI {
  editor: DrawioEditor;
  // Add other UI properties as needed
}

export interface Draw {
  loadPlugin: (callback: (ui: DrawioUI) => void) => void;
}

// Extend the Window interface to include the Draw property
declare global {
  interface Window {
    Draw?: Draw;
  }
}
