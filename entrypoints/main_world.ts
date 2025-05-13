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

export default defineUnlistedScript(() => {
  console.log("Hello from the main world");
  const checkInterval = setInterval(() => {
    if (window.Draw) {
      clearInterval(checkInterval);
      window.Draw.loadPlugin((ui: unknown) => {
        console.log("plugin loaded", ui);
        const { editor } = ui;
        const { graph } = editor;

        //TODO: just for testing / exploring Draw.io
        // window.ui = ui;
        // window.editor = editor;
        // window.graph = graph;

        const TOOL_get_selected_cell = "get-selected-cell";
        bus.on_request_from_server(TOOL_get_selected_cell, (request: any) => {
          const result = graph.getSelectionCell();
          console.debug(`[plugin] selection cell`, result);

          const reply = {
            __event: reply_name(TOOL_get_selected_cell, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            cell: remove_circular_dependencies(result),
          };
          bus.send_reply_to_server(reply);
        });

        const TOOL_add_rectangle = "add-rectangle";
        bus.on_request_from_server(TOOL_add_rectangle, (request: any) => {
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

          const reply = {
            __event: reply_name(TOOL_add_rectangle, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            cell: remove_circular_dependencies(rectangle),
          };
          bus.send_reply_to_server(reply);
        });

        const TOOL_delete_cell_by_id = "delete-cell-by-id";
        bus.on_request_from_server(TOOL_delete_cell_by_id, (request: any) => {
          const result = delete_cell_by_id(ui, {
            cell_id: request.cell_id,
          });
          const reply = {
            __event: reply_name(TOOL_delete_cell_by_id, request.__request_id),
            __request_id: request.__request_id,
            success: result,
          };
          bus.send_reply_to_server(reply);
        });

        const TOOL_add_edge = "add-edge";
        bus.on_request_from_server(TOOL_add_edge, (request: any) => {
          const edge = add_edge(ui, {
            source_id: request.source_id,
            target_id: request.target_id,
            style: request.style,
            text: request.text,
          });

          const reply = {
            __event: reply_name(TOOL_add_edge, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            edge: remove_circular_dependencies(edge),
          };
          bus.send_reply_to_server(reply);
        });

        const TOOL_get_shape_categories = "get-shape-categories";
        bus.on_request_from_server(
          TOOL_get_shape_categories,
          (request: any) => {
            const result = get_shape_categories(ui);

            const reply = {
              __event: reply_name(
                TOOL_get_shape_categories,
                request.__request_id,
              ),
              __request_id: request.__request_id,
              success: true,
              shape_categories: remove_circular_dependencies(result),
            };
            bus.send_reply_to_server(reply);
          },
        );

        const TOOL_get_shapes_in_category = "get-shapes-in-category";
        bus.on_request_from_server(
          TOOL_get_shapes_in_category,
          (request: any) => {
            const result = get_shapes_in_category(ui, {
              category_id: request.category_id,
            });

            const reply = {
              __event: reply_name(
                TOOL_get_shapes_in_category,
                request.__request_id,
              ),
              __request_id: request.__request_id,
              success: true,
              shapes: remove_circular_dependencies(result),
            };
            bus.send_reply_to_server(reply);
          },
        );

        const TOOL_get_shape_by_name = "get-shape-by-name";
        bus.on_request_from_server(TOOL_get_shape_by_name, (request: any) => {
          const result = get_shape_by_name(ui, {
            shape_name: request.shape_name,
          });

          const reply = {
            __event: reply_name(TOOL_get_shape_by_name, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            shape: remove_circular_dependencies(result),
          };
          bus.send_reply_to_server(reply);
        });

        const TOOL_add_cell_of_shape = "add-cell-of-shape";
        bus.on_request_from_server(TOOL_add_cell_of_shape, (request: any) => {
          const result = add_cell_of_shape(ui, {
            shape_name: request.shape_name,
            x: request.x,
            y: request.y,
            width: request.width,
            height: request.height,
            text: request.text,
            style: request.style,
          });

          const reply = {
            __event: reply_name(TOOL_add_cell_of_shape, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            cell: remove_circular_dependencies(result),
          };
          bus.send_reply_to_server(reply);
        });
      });
    } else {
      const el = document.querySelector(
        "body > div.geMenubarContainer > div.geMenubar > div > button",
      );
      if (el) {
        el.innerHTML = Date.now().toString();
      }
    }
  }, 1000);
});
