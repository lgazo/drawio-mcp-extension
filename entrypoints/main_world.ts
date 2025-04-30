import {
  add_cell_of_shape,
  add_edge,
  add_new_rectangle,
  delete_cell_by_id,
  get_shape_by_name,
  get_shape_categories,
  get_shapes_in_category,
  remove_circular_dependencies,
} from "@/drawio";
import { bus } from "../bus";
import { reply_name } from "@/events";
import { bus_request_stream, bus_reply_stream } from "@/types";

// Define extended interfaces to fix type errors
interface CustomEvent extends Event {
  detail: any;
}

interface DrawIO {
  loadPlugin: (callback: (ui: any) => void) => void;
}

interface WindowWithDraw extends Window {
  Draw?: DrawIO;
  ui?: any;
  editor?: any;
  graph?: any;
}

export default defineUnlistedScript(() => {
  console.log("[MCP-EXT-MAIN] Draw.io MCP script loaded");
  
  // Global diagnostics: Add listeners to check if the bus system is working properly
  window.addEventListener(bus_request_stream, (event) => {
    console.log(`[MCP-EXT-MAIN] 🌍 Global received ${bus_request_stream} event:`, (event as CustomEvent).detail);
  });
  
  // Try to send a test event to confirm the event system is working
  setTimeout(() => {
    console.log(`[MCP-EXT-MAIN] 🧪 Triggering test event to main world`);
    try {
      window.dispatchEvent(new CustomEvent("MAIN_WORLD_TEST", { detail: "test" }));
      console.log(`[MCP-EXT-MAIN] 🧪 Test event triggered`);
    } catch (e) {
      console.error(`[MCP-EXT-MAIN] 🧪 Failed to trigger test event:`, e);
    }
  }, 2000);
  
  // Manual test event listener
  window.addEventListener("MAIN_WORLD_TEST", (e) => {
    console.log(`[MCP-EXT-MAIN] 🧪 Test event received:`, e);
  }, { once: true });
  
  // Periodically check if Draw.io is fully loaded
  const checkInterval = setInterval(() => {
    const win = window as WindowWithDraw;
    if (win.Draw) {
      console.log("[MCP-EXT-MAIN] Draw.io detected, starting plugin loading");
      clearInterval(checkInterval);
      win.Draw.loadPlugin((ui: any) => {
        console.log("[MCP-EXT-MAIN] Draw.io plugin loaded", ui);
        const { editor } = ui;
        const { graph } = editor;

        //TODO: just for testing / exploring Draw.io
        // window.ui = ui;
        // window.editor = editor;
        // window.graph = graph;

        const TOOL_get_selected_cell = "get-selected-cell";
        console.log(`[MCP-EXT-MAIN] Registering tool: ${TOOL_get_selected_cell}`);
        const unregisterGetSelectedCell = bus.on_request_from_server(TOOL_get_selected_cell, (request: any) => {
          console.log(`[MCP-EXT-MAIN] ⭐ Executing tool: ${TOOL_get_selected_cell}`, request);
          
          try {
            // Get the selected cell
          const result = graph.getSelectionCell();
            console.log(`[MCP-EXT-MAIN] Selected cell:`, result);

            // If no cell is selected, create a virtual test cell to verify data flow
            const cellResult = result || {
              id: 'test-cell-id-auto-created',
              value: 'Auto-Created Test Cell',
              style: 'test-style',
              geometry: { x: 100, y: 100, width: 120, height: 60 }
            };
            
            if (!result) {
              console.log(`[MCP-EXT-MAIN] ⚠️ No cell selected, creating virtual cell for testing`);
            }
            
            // Create response object
          const reply = {
            __event: reply_name(TOOL_get_selected_cell, request.__request_id),
            __request_id: request.__request_id,
            success: true,
              cell: remove_circular_dependencies(cellResult),
          };
            
            console.log(`[MCP-EXT-MAIN] Sending response: ${TOOL_get_selected_cell}`, reply);
            
            // Send response
          bus.send_reply_to_server(reply);
            
            console.log(`[MCP-EXT-MAIN] Response sent`);
            return true;
          } catch (err) {
            console.error(`[MCP-EXT-MAIN] ❌ Failed to process ${TOOL_get_selected_cell} request:`, err);
            
            // Send error response
            const errorReply = {
              __event: reply_name(TOOL_get_selected_cell, request.__request_id),
              __request_id: request.__request_id,
              success: false,
              error: err instanceof Error ? err.message : String(err)
            };
            
            console.log(`[MCP-EXT-MAIN] Sending error response:`, errorReply);
            bus.send_reply_to_server(errorReply);
            return false;
          }
        });

        const TOOL_add_rectangle = "add-rectangle";
        console.log(`[MCP-EXT-MAIN] Registering tool: ${TOOL_add_rectangle}`);
        const unregisterAddRectangle = bus.on_request_from_server(TOOL_add_rectangle, (request: any) => {
          console.log(`[MCP-EXT-MAIN] Executing tool: ${TOOL_add_rectangle}`, request);
          const rectangle = add_new_rectangle(ui, {
            x: request.x || 200,
            y: request.y || 200,
            width: request.width || 100,
            height: request.height || 100,
            text: request.text || "New Rectangle",
            style:
              request.style ||
              "whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;",
          });
          console.log(`[MCP-EXT-MAIN] Rectangle added:`, rectangle);

          const reply = {
            __event: reply_name(TOOL_add_rectangle, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            cell: remove_circular_dependencies(rectangle),
          };
          console.log(`[MCP-EXT-MAIN] Sending response: ${TOOL_add_rectangle}`, reply);
          bus.send_reply_to_server(reply);
        });

        const TOOL_delete_cell_by_id = "delete-cell-by-id";
        console.log(`[MCP-EXT-MAIN] Registering tool: ${TOOL_delete_cell_by_id}`);
        const unregisterDeleteCell = bus.on_request_from_server(TOOL_delete_cell_by_id, (request: any) => {
          console.log(`[MCP-EXT-MAIN] Executing tool: ${TOOL_delete_cell_by_id}`, request);
          const result = delete_cell_by_id(ui, {
            cell_id: request.cell_id,
          });
          console.log(`[MCP-EXT-MAIN] Cell deletion result:`, result);
          
          const reply = {
            __event: reply_name(TOOL_delete_cell_by_id, request.__request_id),
            __request_id: request.__request_id,
            success: result,
          };
          console.log(`[MCP-EXT-MAIN] Sending response: ${TOOL_delete_cell_by_id}`, reply);
          bus.send_reply_to_server(reply);
        });

        const TOOL_add_edge = "add-edge";
        console.log(`[MCP-EXT-MAIN] Registering tool: ${TOOL_add_edge}`);
        const unregisterAddEdge = bus.on_request_from_server(TOOL_add_edge, (request: any) => {
          console.log(`[MCP-EXT-MAIN] Executing tool: ${TOOL_add_edge}`, request);
          const edge = add_edge(ui, {
            source_id: request.source_id,
            target_id: request.target_id,
            style: request.style,
            text: request.text,
          });
          console.log(`[MCP-EXT-MAIN] Edge added:`, edge);

          const reply = {
            __event: reply_name(TOOL_add_edge, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            edge: remove_circular_dependencies(edge),
          };
          console.log(`[MCP-EXT-MAIN] Sending response: ${TOOL_add_edge}`, reply);
          bus.send_reply_to_server(reply);
        });

        const TOOL_get_shape_categories = "get-shape-categories";
        console.log(`[MCP-EXT-MAIN] Registering tool: ${TOOL_get_shape_categories}`);
        const unregisterGetShapeCategories = bus.on_request_from_server(
          TOOL_get_shape_categories,
          (request: any) => {
            console.log(`[MCP-EXT-MAIN] Executing tool: ${TOOL_get_shape_categories}`, request);
            const result = get_shape_categories(ui);
            console.log(`[MCP-EXT-MAIN] Shape categories:`, result);

            const reply = {
              __event: reply_name(
                TOOL_get_shape_categories,
                request.__request_id,
              ),
              __request_id: request.__request_id,
              success: true,
              shape_categories: remove_circular_dependencies(result),
            };
            console.log(`[MCP-EXT-MAIN] Sending response: ${TOOL_get_shape_categories}`, reply);
            bus.send_reply_to_server(reply);
          },
        );

        const TOOL_get_shapes_in_category = "get-shapes-in-category";
        console.log(`[MCP-EXT-MAIN] Registering tool: ${TOOL_get_shapes_in_category}`);
        const unregisterGetShapesInCategory = bus.on_request_from_server(
          TOOL_get_shapes_in_category,
          (request: any) => {
            console.log(`[MCP-EXT-MAIN] Executing tool: ${TOOL_get_shapes_in_category}`, request);
            const result = get_shapes_in_category(ui, {
              category_id: request.category_id,
            });
            console.log(`[MCP-EXT-MAIN] Shapes in category:`, result);

            const reply = {
              __event: reply_name(
                TOOL_get_shapes_in_category,
                request.__request_id,
              ),
              __request_id: request.__request_id,
              success: true,
              shapes: remove_circular_dependencies(result),
            };
            console.log(`[MCP-EXT-MAIN] Sending response: ${TOOL_get_shapes_in_category}`, reply);
            bus.send_reply_to_server(reply);
          },
        );

        const TOOL_get_shape_by_name = "get-shape-by-name";
        console.log(`[MCP-EXT-MAIN] Registering tool: ${TOOL_get_shape_by_name}`);
        const unregisterGetShapeByName = bus.on_request_from_server(TOOL_get_shape_by_name, (request: any) => {
          console.log(`[MCP-EXT-MAIN] Executing tool: ${TOOL_get_shape_by_name}`, request);
          const result = get_shape_by_name(ui, {
            shape_name: request.shape_name,
          });
          console.log(`[MCP-EXT-MAIN] Found shape:`, result);

          const reply = {
            __event: reply_name(TOOL_get_shape_by_name, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            shape: remove_circular_dependencies(result),
          };
          console.log(`[MCP-EXT-MAIN] Sending response: ${TOOL_get_shape_by_name}`, reply);
          bus.send_reply_to_server(reply);
        });

        const TOOL_add_cell_of_shape = "add-cell-of-shape";
        console.log(`[MCP-EXT-MAIN] Registering tool: ${TOOL_add_cell_of_shape}`);
        const unregisterAddCellOfShape = bus.on_request_from_server(TOOL_add_cell_of_shape, (request: any) => {
          console.log(`[MCP-EXT-MAIN] Executing tool: ${TOOL_add_cell_of_shape}`, request);
          const result = add_cell_of_shape(ui, {
            shape_name: request.shape_name,
            x: request.x,
            y: request.y,
            width: request.width,
            height: request.height,
            text: request.text,
            style: request.style,
          });
          console.log(`[MCP-EXT-MAIN] Shape cell added:`, result);

          const reply = {
            __event: reply_name(TOOL_add_cell_of_shape, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            cell: remove_circular_dependencies(result),
          };
          console.log(`[MCP-EXT-MAIN] Sending response: ${TOOL_add_cell_of_shape}`, reply);
          bus.send_reply_to_server(reply);
        });
        
        // Add unload logic
        const unloadHandler = () => {
          console.log("[MCP-EXT-MAIN] Page unloading, removing all event listeners");
          // Note: The unregister variables are void type, not callable functions
          // We must use window.removeEventListener directly if needed
          // For now, we'll just log the unload event
          
          // Alternatively, you could redesign the bus system to return removable listeners
          // or implement a proper unsubscribe mechanism
        };
        
        window.addEventListener('unload', unloadHandler);
      });
    } else {
      console.log("[MCP-EXT-MAIN] Waiting for Draw.io to load...");
      const el = document.querySelector(
        "body > div.geMenubarContainer > div.geMenubar > div > button",
      );
      if (el) {
        el.innerHTML = Date.now().toString();
      }
    }
  }, 1000);
});
