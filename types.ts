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
