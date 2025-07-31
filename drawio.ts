import { shape_library_stub } from "./drawio_stub";
import {
  DrawioCellOptions,
  DrawioGraph,
  MxGraphCell,
  MxGraphIsLayer,
} from "./types";

export type CellId = string;
export type CellStyle = string;

export interface TransformedCell {
  id: string;
  mxObjectId: string;
  value:
    | string
    | {
        attributes?: any;
        nodeName?: string;
        localName?: string;
        tagName?: string;
      };
  geometry?: any;
  style?: CellStyle;
  edge?: boolean;
  edges?: any[];
  parent?: any;
  source?: any;
  target?: any;
  layer?: {
    id: string;
    name: string;
  };
  tags?: string[];
}

export function add_new_rectangle(
  ui: any,
  options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    style?: CellStyle;
  },
) {
  const { editor } = ui;
  const { graph } = editor;

  // Default values
  const x = options.x || 100;
  const y = options.y || 100;
  const width = options.width || 120;
  const height = options.height || 60;
  const text = options.text || "";
  const style =
    options.style ||
    "whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;";

  // Begin transaction for undo/redo support
  graph.getModel().beginUpdate();
  try {
    // Create the rectangle vertex
    const vertex = graph.insertVertex(
      graph.getDefaultParent(), // parent
      null, // ID (auto-generated if null)
      text, // value
      x,
      y, // position
      width,
      height, // size
      style, // style
    );

    return vertex;
  } finally {
    // End transaction
    graph.getModel().endUpdate();
  }
}

/**
 * Deletes a cell from the graph by its ID.
 * @param ui The draw.io UI instance
 * @param cellId The ID of the cell to delete
 * @returns true if the cell was found and deleted, false otherwise
 */
export function delete_cell_by_id(
  ui: any,
  options: DrawioCellOptions,
): boolean {
  const { editor } = ui;
  const { graph } = editor;

  // Get the cell by its ID
  const cell_id = options.cell_id as CellId;
  const cell = graph.getModel().getCell(cell_id);

  if (!cell) {
    return false;
  }

  // Begin transaction for undo/redo support
  graph.getModel().beginUpdate();
  try {
    // Remove the cell from the graph
    graph.removeCells([cell]);
    return true;
  } finally {
    // End transaction
    graph.getModel().endUpdate();
  }
}

/**
 * Adds an edge connecting two vertices in the graph.
 * @param ui The draw.io UI instance
 * @param options Parameters including style
 * @returns The created edge or null if vertices weren't found
 */
export function add_edge(ui: any, options: DrawioCellOptions): any | null {
  const { editor } = ui;
  const { graph } = editor;
  const model = graph.getModel();

  // Get source and target cells
  const source = model.getCell(options.source_id);
  const target = model.getCell(options.target_id);

  if (!source || !target) {
    return null;
  }

  // Default style for edge
  const defaultStyle = "endArrow=classic;html=1;rounded=0;";
  const style = options.style || defaultStyle;
  const text = options.text || "";

  // Begin transaction for undo/redo support
  model.beginUpdate();
  try {
    // Create the edge
    const edge = graph.insertEdge(
      graph.getDefaultParent(), // parent
      null, // ID (auto-generated if null)
      text, // value
      source, // source
      target, // target
      style, // style
    );

    return edge;
  } finally {
    // End transaction
    model.endUpdate();
  }
}

/**
 * Lists all available shape categories (palettes) in the sidebar
 * @param ui The draw.io UI instance
 * @returns Array of category names
 */
export function get_shape_categories(ui: any) {
  //: string[] {
  // const { sidebar } = ui;

  // if (!sidebar || !sidebar.palettes) {
  //   return [];
  // }

  // return (
  //   Object.entries(sidebar.palettes)
  //     // .filter((palette: any) => palette.visible !== false) // Skip hidden palettes
  //     .map((palette: any) => ({
  //       id: palette[0],
  //       title: palette[1][0].innerText || "Untitled",
  //     }))
  // );

  const categories = Object.values(shape_library_stub).reduce((acc, cur) => {
    acc.add(cur.category);
    return acc;
  }, new Set());
  return [...categories];
}

/**
 * Gets all shapes from a specific category
 * @param ui The draw.io UI instance
 * @param category_name The name of the category to list
 * @returns Array of shape names in the category or empty array if not found
 */
export function get_shapes_in_category(ui: any, options: DrawioCellOptions) {
  //: string[] {
  // const { sidebar } = ui;

  // if (!sidebar || !sidebar.palettes) {
  //   return [];
  // }

  // const palette = Object.entries(sidebar.palettes).find(
  //   (p: any) => p[0].toLowerCase() === options.category_id.toLowerCase(),
  // );

  // if (!palette) return [];

  // return palette[1].entries.map((entry: any) => entry.title);
  return Object.entries(shape_library_stub)
    .filter(([_shape_key, shape_value]) => {
      return shape_value.category === options.category_id;
    })
    .map(([shape_key, shape_value]) => {
      return {
        id: shape_key,
        title: shape_value.title || shape_key,
      };
    });
}

/**
 * Finds a shape by name across all available categories
 * @param ui The draw.io UI instance
 * @param options shape_name The name of the shape to find
 * @returns The shape entry (with style and metadata) or null if not found
 */
export function get_shape_by_name(
  ui: any,
  options: DrawioCellOptions,
): any | null {
  // const shape_name = options.shape_name as string;
  // const lowerCaseName = shape_name.toLowerCase();

  // const { editor } = ui;
  // const { sidebar } = editor;

  // if (!sidebar?.palettes) return null;

  // // Search through all palettes
  // for (const palette of sidebar.palettes) {
  //   if (!palette.entries) continue;

  //   // Search through all entries in the palette
  //   const found = palette.entries.find(
  //     (entry: any) => entry.title?.toLowerCase() === lowerCaseName,
  //   );

  //   if (found) {
  //     return {
  //       ...found,
  //       category: palette.title || "Uncategorized",
  //     };
  //   }
  // }

  // return null;

  const shape = Object.entries(shape_library_stub).find(
    ([shape_key, shape_value]) => {
      return shape_key === options.shape_name;
    },
  );
  if (!shape) {
    return null;
  }
  return {
    id: shape[0],
    ...shape[1],
  };
}

/**
 * Creates a shape from the library by shape name
 * @param ui The draw.io UI instance
 * @param options Position, size and style options
 * @returns The created cell or null if shape not found
 */
export function add_cell_of_shape(ui: any, options: DrawioCellOptions) {
  const { editor } = ui;
  const { graph, sidebar } = editor;

  // Default values
  const shape_name = options.shape_name || "rectangle";
  const x = options.x || 100;
  const y = options.y || 100;
  const width = options.width || 120;
  const height = options.height || 80;
  const text = options.text || "";
  const style = (options.style || "") as CellStyle;

  // Find the General palette
  // const generalPalette = sidebar.palettes.find((p: any) =>
  //   p.title === 'General' || p.title === 'general'
  // );

  // if (!generalPalette) return null;

  // Find the shape by name
  // const shapeEntry = generalPalette.entries.find((entry: any) =>
  //   entry.title.toLowerCase() === shape_name.toLowerCase()
  // );
  const shape_entry = get_shape_by_name(ui, { shape_name });

  if (!shape_entry) return null;

  // Begin transaction
  graph.getModel().beginUpdate();
  try {
    // Create the shape using the found stencil
    const cell = graph.insertVertex(
      graph.getDefaultParent(),
      null,
      text,
      x,
      y,
      width,
      height,
      `${shape_entry.style};${style}`,
      false,
    );

    return cell;
  } finally {
    // End transaction
    graph.getModel().endUpdate();
  }
}

/**
 * Removes circular dependencies and functions from a JavaScript object by replacing
 * circular references with a string indicating the circular path and omitting functions.
 * @param obj The object to remove circular references and functions from
 * @param visited Set of already visited objects (used internally for recursion)
 * @param path Current path in the object (used internally for recursion)
 * @returns A new object with circular references and functions removed
 */
export function remove_circular_dependencies<T>(
  obj: T,
  visited: WeakSet<object> = new WeakSet(),
  path: string[] = [],
): T {
  // Handle primitive values (they can't be circular or functions)
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    if (visited.has(obj)) {
      return `[Circular ${path.join(".")}]` as unknown as T;
    }

    visited.add(obj);
    return obj.map((item, index) =>
      remove_circular_dependencies(item, visited, [...path, `[${index}]`]),
    ) as unknown as T;
  }

  // Handle Date, RegExp, etc. - return as-is since they can't contain circular references or functions
  if (Object.prototype.toString.call(obj) !== "[object Object]") {
    return obj;
  }

  // Check for circular reference in plain objects
  if (visited.has(obj)) {
    return `[Circular ${path.join(".")}]` as unknown as T;
  }

  visited.add(obj);
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, any>)[key];
      // Skip functions
      if (
        typeof value !== "function" &&
        key !== "children" &&
        key !== "edges"
      ) {
        let stripped_value = {};
        if (
          (key === "parent" || key === "source" || key === "target") &&
          value !== undefined &&
          value !== null
        ) {
          // Object.assign(
          //   stripped_value,
          //   ...Object.entries(value)
          //     .filter(
          //       ([k, v]) => k !== "parent" && k !== "children" && k !== "edges",
          //     )
          //     .map(([k, v]) => ({ [k]: v })),
          // );
          stripped_value = {
            id: value.id,
          };
        } else {
          stripped_value = value;
        }
        result[key] = remove_circular_dependencies(stripped_value, visited, [
          ...path,
          key,
        ]);
      }
    }
  }

  return result as T;
}

function transform_NamedNodeMap_to_attributes(cell: any) {
  // Transform NamedNodeMap attributes to standard object
  let transformed_attributes: Record<string, any> = {};
  if (cell.value.attributes && typeof cell.value.attributes === "object") {
    const attributes = cell.value.attributes;
    if (attributes.length !== undefined) {
      // Handle NamedNodeMap (has length property)
      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        if (attr && attr.name && attr.value !== undefined) {
          transformed_attributes[attr.name] = attr.value;
        }
      }
    } else {
      // Handle regular object attributes
      transformed_attributes = attributes;
    }
  }

  return transformed_attributes;
}

/**
 * Transforms a cell object to retain only essential fields and sanitize data
 * @param cell The cell object to transform
 * @returns Transformed cell with only essential fields
 */
export function transform_cell_for_display(
  cell: MxGraphCell,
): TransformedCell | null {
  if (!cell || typeof cell !== "object") {
    return null;
  }

  const transformed: TransformedCell = {
    id: cell.id || "",
    mxObjectId: cell.mxObjectId || "",
    value: "",
    geometry: cell.geometry,
    style: cell.style,
    edge: cell.edge,
    edges: cell.edges,
    parent: cell.parent,
    source: cell.source,
    target: cell.target,
  };

  // Handle value field transformation
  if (cell.value !== null && cell.value !== undefined) {
    if (typeof cell.value === "string") {
      transformed.value = cell.value;
    } else if (typeof cell.value === "object") {
      const transformed_attributes = transform_NamedNodeMap_to_attributes(cell);

      transformed.value = {
        attributes: transformed_attributes,
        nodeName: cell.value.nodeName,
        localName: cell.value.localName,
        tagName: cell.value.tagName,
      };
    }
  }

  return transformed;
}

/**
 * Gets the layer information for a given cell
 * @param graph The graph instance
 * @param cell The cell to get layer information for
 * @returns Layer object with id and name, or null if no layer found
 */
export function get_cell_layer(
  graph: DrawioGraph,
  cell: any,
): { id: string; name: string } | null {
  if (!cell || !graph) {
    return null;
  }

  try {
    const layer = graph.getLayerForCell(cell);
    if (layer) {
      return {
        id: layer.id || "",
        name: layer.value || "Default Layer",
      };
    }
  } catch (error) {
    // Handle cases where getLayerForCell might not be available
    console.warn("Could not get layer for cell:", error);
  }

  return null;
}

/**
 * Reimplementation of draw.io's
 * @param root_cell
 * @returns
 */
function mx_isRoot(root_cell: MxGraphCell) {
  return function (cell: MxGraphCell): boolean {
    // return null != a && this.root == a
    return null != cell && cell == root_cell;
  };
}

function mx_isLayer(root_cell: MxGraphCell) {
  return function (cell: MxGraphCell): boolean {
    // return this.isRoot(this.getParent(a))
    return mx_isRoot(root_cell)(cell.getParent());
  };
}

/**
 * Lists paged model data from the graph with transformation and sanitization
 * @param ui The draw.io UI instance
 * @param options Page information and filtering options
 * @returns Array of transformed and sanitized cells
 */
export function list_paged_model(
  ui: any,
  options: {
    page?: number;
    page_size?: number;
    filter?: {
      cell_type?: "edge" | "node" | "object" | "layer";
      attributes?: any[];
    };
  } = {},
): TransformedCell[] {
  const { editor } = ui;
  const { graph } = editor;
  const model = graph.getModel();
  const cells = model.cells;

  if (!cells) {
    return [];
  }

  // Helper function to parse style string into key=value pairs
  function parse_style_attributes(style: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    if (!style) return attributes;

    const pairs = style.split(";");
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split("=");
      if (key && valueParts.length > 0) {
        attributes[key.trim()] = valueParts.join("=").trim();
      }
    }
    return attributes;
  }

  // Helper function to extract attributes from cell value
  function extract_cell_attributes(cell: any): Record<string, any> {
    const attributes: Record<string, any> = {};

    // Add basic cell properties
    attributes.id = cell.id || "";
    attributes.edge = cell.edge || false;

    // Add style attributes
    if (cell.style) {
      Object.assign(attributes, parse_style_attributes(cell.style));
    }

    // Add value attributes if it's an object
    if (cell.value && typeof cell.value === "object" && cell.value.attributes) {
      const transformed_attributes = transform_NamedNodeMap_to_attributes(cell);

      // const valueAttrs = cell.value.attributes;
      // if (Array.isArray(valueAttrs)) {
      //   for (let i = 0; i < valueAttrs.length; i++) {
      //     const attr = valueAttrs[i];
      //     if (attr && attr.name && attr.value !== undefined) {
      //       attributes[attr.name] = attr.value;
      //     }
      //   }
      // } else if (typeof valueAttrs === "object") {
      //   Object.assign(attributes, valueAttrs);
      // }

      Object.assign(attributes, transformed_attributes);
    }

    // Add text value as attribute
    if (cell.value && typeof cell.value === "string") {
      attributes.text = cell.value;
    }

    return attributes;
  }

  // Helper function to evaluate boolean logic expressions
  function evaluate_filter_expression(
    expression: any[],
    attributes: Record<string, any>,
  ): boolean {
    if (!Array.isArray(expression) || expression.length === 0) {
      return true;
    }

    const [operator, ...operands] = expression;

    switch (operator) {
      case "and":
        return operands.every((op) =>
          evaluate_filter_expression(op, attributes),
        );

      case "or":
        return operands.some((op) =>
          evaluate_filter_expression(op, attributes),
        );

      case "equal":
        if (operands.length !== 2) return false;
        const [key, value] = operands;
        return attributes[key] === value;

      default:
        return true;
    }
  }

  // Helper function to check cell type
  function matches_cell_type(
    cell: any,
    cell_type: string,
    isLayer: MxGraphIsLayer,
  ): boolean {
    switch (cell_type) {
      case "edge":
        return cell.edge === true || cell.edge === 1;
      case "vertex":
        return cell.edge === false;
      case "object":
        return cell.value?.nodeName === "object";
      case "group":
        return cell.style === "group";
      case "layer":
        return isLayer(cell);
      default:
        return true;
    }
  }

  // Apply filtering
  let filtered_cells = Object.values(cells);

  if (options.filter) {
    filtered_cells = filtered_cells.filter((cell) => {
      // Check cell type filter
      if (
        options.filter?.cell_type &&
        !matches_cell_type(
          cell,
          options.filter.cell_type,
          mx_isLayer(model.root),
        )
      ) {
        return false;
      }

      // Check attributes filter
      if (options.filter?.attributes && options.filter.attributes.length > 0) {
        const cellAttributes = extract_cell_attributes(cell);
        if (
          !evaluate_filter_expression(options.filter.attributes, cellAttributes)
        ) {
          return false;
        }
      }

      return true;
    });
  }

  // Default pagination values
  const page = Math.max(0, options.page || 0);
  const page_size = Math.max(1, options.page_size || 50);
  const start_index = page * page_size;

  // Get filtered cell IDs and slice for pagination
  const cell_ids = filtered_cells.map((cell) => cell.id);
  const paginated_ids = cell_ids.slice(start_index, start_index + page_size);

  // Transform and sanitize each cell
  const transformed_cells: TransformedCell[] = [];

  for (const cell_id of paginated_ids) {
    const cell = cells[cell_id];
    if (cell) {
      // Remove circular dependencies and transform
      const sanitized_cell = remove_circular_dependencies(cell);
      const transformed_cell = transform_cell_for_display(sanitized_cell);

      if (transformed_cell) {
        const layer_info = get_cell_layer(graph, cell);
        if (layer_info) {
          transformed_cell.layer = layer_info;
        }

        const tags_info = get_cell_tags(graph, cell);
        if (tags_info && tags_info.length > 0) {
          transformed_cell.tags = tags_info;
        }
        transformed_cells.push(transformed_cell);
      }
    }
  }

  return transformed_cells;
}

export function get_cell_tags(graph: any, cell: any): string[] {
  if (!cell || !graph) {
    return [];
  }

  try {
    const tags = graph.getTagsForCell(cell);
    return tags || [];
  } catch (error) {
    console.warn("Could not get tags for cell:", error);
    return [];
  }
}
