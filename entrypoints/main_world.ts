import {
  add_cell_of_shape,
  add_edge,
  add_new_rectangle,
  delete_cell_by_id,
  edit_cell,
  edit_edge,
  set_cell_shape,
  set_cell_data,
  get_shape_by_name,
  get_shape_categories,
  get_shapes_in_category,
  list_paged_model,
} from "@/drawio";
import { on_standard_tool_request_from_server } from "../bus";
import { DrawioUI } from "../types";

export default defineUnlistedScript(() => {
  console.log("Hello from the main world");
  const checkInterval = setInterval(() => {
    if (window.Draw) {
      clearInterval(checkInterval);
      window.Draw.loadPlugin((ui: DrawioUI) => {
        console.log("plugin loaded", ui);
        const { editor } = ui;
        const { graph } = editor;
        const mxUtils = window.mxUtils;

        //TODO: just for testing / exploring Draw.io
        // window.ui = ui;
        // window.editor = editor;
        // window.graph = graph;

        const TOOL_get_selected_cell = "get-selected-cell";
        on_standard_tool_request_from_server(
          TOOL_get_selected_cell,
          ui,
          new Set([]),
          (ui, _options) => {
            const result = graph.getSelectionCell() || "no cell selected";
            return result;
          },
        );

        const TOOL_add_rectangle = "add-rectangle";
        on_standard_tool_request_from_server(
          TOOL_add_rectangle,
          ui,
          new Set(["x", "y", "width", "height", "text", "style"]),
          add_new_rectangle,
        );

        const TOOL_delete_cell_by_id = "delete-cell-by-id";
        on_standard_tool_request_from_server(
          TOOL_delete_cell_by_id,
          ui,
          new Set(["cell_id"]),
          delete_cell_by_id,
        );

        const TOOL_add_edge = "add-edge";
        on_standard_tool_request_from_server(
          TOOL_add_edge,
          ui,
          new Set(["source_id", "target_id", "style", "text"]),
          add_edge,
        );

        const TOOL_get_shape_categories = "get-shape-categories";
        on_standard_tool_request_from_server(
          TOOL_get_shape_categories,
          ui,
          new Set([]),
          get_shape_categories,
        );

        const TOOL_get_shapes_in_category = "get-shapes-in-category";
        on_standard_tool_request_from_server(
          TOOL_get_shapes_in_category,
          ui,
          new Set(["category_id"]),
          get_shapes_in_category,
        );

        const TOOL_get_shape_by_name = "get-shape-by-name";
        on_standard_tool_request_from_server(
          TOOL_get_shape_by_name,
          ui,
          new Set(["shape_name"]),
          get_shape_by_name,
        );

        const TOOL_add_cell_of_shape = "add-cell-of-shape";
        on_standard_tool_request_from_server(
          TOOL_add_cell_of_shape,
          ui,
          new Set(["x", "y", "width", "height", "text", "style"]),
          add_cell_of_shape,
        );

        const TOOL_set_cell_shape = "set-cell-shape";
        on_standard_tool_request_from_server(
          TOOL_set_cell_shape,
          ui,
          new Set(["cell_id", "shape_name"]),
          set_cell_shape,
        );

        const TOOL_set_cell_data = "set-cell-data";
        on_standard_tool_request_from_server(
          TOOL_set_cell_data,
          ui,
          new Set(["cell_id", "key", "value"]),
          set_cell_data(mxUtils),
        );

        const TOOL_list_paged_model = "list-paged-model";
        on_standard_tool_request_from_server(
          TOOL_list_paged_model,
          ui,
          new Set(["page", "page_size", "filter"]),
          list_paged_model,
        );

        const TOOL_edit_cell = "edit-cell";
        on_standard_tool_request_from_server(
          TOOL_edit_cell,
          ui,
          new Set(["cell_id", "text", "x", "y", "width", "height", "style"]),
          edit_cell,
        );

        const TOOL_edit_edge = "edit-edge";
        on_standard_tool_request_from_server(
          TOOL_edit_edge,
          ui,
          new Set(["cell_id", "text", "source_id", "target_id", "style"]),
          edit_edge,
        );
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
