import { shape_library_stub } from "./drawio_stub";

export function add_new_rectangle(
  ui: any,
  options: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    style?: string;
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
  options: {
    cell_id: string;
  },
): boolean {
  const { editor } = ui;
  const { graph } = editor;

  // Get the cell by its ID
  const cell = graph.getModel().getCell(options.cell_id);

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
export function add_edge(
  ui: any,
  options: {
    source_id: string;
    target_id: string;
    style?: string;
    text?: string;
  },
): any | null {
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
export function get_shapes_in_category(
  ui: any,
  options: {
    category_id: string;
  },
) {
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
  options: { shape_name: string },
): any | null {
  const lowerCaseName = options.shape_name.toLowerCase();

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
export function add_cell_of_shape(
  ui: any,
  options: {
    shape_name?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    style?: string;
  },
) {
  const { editor } = ui;
  const { graph, sidebar } = editor;

  // Default values
  const shape_name = options.shape_name || "rectangle";
  const x = options.x || 100;
  const y = options.y || 100;
  const width = options.width || 120;
  const height = options.height || 80;
  const text = options.text || "";
  const style = options.style || "";

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
      if (typeof value !== "function") {
        result[key] = remove_circular_dependencies(value, visited, [
          ...path,
          key,
        ]);
      }
    }
  }

  return result as T;
}
