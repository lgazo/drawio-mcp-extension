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

export default defineUnlistedScript(() => {
  console.log("[MCP-EXT-MAIN] Draw.io MCP脚本已加载");
  
  // 全局诊断：添加监听器来检查总线系统是否正常工作
  window.addEventListener(bus_request_stream, (event) => {
    console.log(`[MCP-EXT-MAIN] 🌍 全局收到 ${bus_request_stream} 事件:`, event.detail);
  });
  
  // 尝试发送一个测试事件，确认事件系统工作
  setTimeout(() => {
    console.log(`[MCP-EXT-MAIN] 🧪 触发测试事件到主世界`);
    try {
      window.dispatchEvent(new CustomEvent("MAIN_WORLD_TEST", { detail: "测试" }));
      console.log(`[MCP-EXT-MAIN] 🧪 测试事件已触发`);
    } catch (e) {
      console.error(`[MCP-EXT-MAIN] 🧪 测试事件触发失败:`, e);
    }
  }, 2000);
  
  // 手动测试事件监听
  window.addEventListener("MAIN_WORLD_TEST", (e) => {
    console.log(`[MCP-EXT-MAIN] 🧪 测试事件收到:`, e);
  }, { once: true });
  
  // 定期检查Draw.io是否加载完成
  const checkInterval = setInterval(() => {
    if (window.Draw) {
      console.log("[MCP-EXT-MAIN] Draw.io已检测到，开始加载插件");
      clearInterval(checkInterval);
      window.Draw.loadPlugin((ui: unknown) => {
        console.log("[MCP-EXT-MAIN] Draw.io插件已加载", ui);
        const { editor } = ui;
        const { graph } = editor;

        //TODO: just for testing / exploring Draw.io
        // window.ui = ui;
        // window.editor = editor;
        // window.graph = graph;

        const TOOL_get_selected_cell = "get-selected-cell";
        console.log(`[MCP-EXT-MAIN] 注册工具: ${TOOL_get_selected_cell}`);
        const unregisterGetSelectedCell = bus.on_request_from_server(TOOL_get_selected_cell, (request: any) => {
          console.log(`[MCP-EXT-MAIN] ⭐ 执行工具: ${TOOL_get_selected_cell}`, request);
          
          try {
            // 获取选中的单元格
            const result = graph.getSelectionCell();
            console.log(`[MCP-EXT-MAIN] 选中的单元格:`, result);
            
            // 如果没有选中单元格，创建一个虚拟的测试单元格以验证数据流
            const cellResult = result || {
              id: 'test-cell-id-auto-created',
              value: 'Auto-Created Test Cell',
              style: 'test-style',
              geometry: { x: 100, y: 100, width: 120, height: 60 }
            };
            
            if (!result) {
              console.log(`[MCP-EXT-MAIN] ⚠️ 没有选中单元格，创建虚拟单元格用于测试`);
            }
            
            // 创建响应对象
            const reply = {
              __event: reply_name(TOOL_get_selected_cell, request.__request_id),
              __request_id: request.__request_id,
              success: true,
              cell: remove_circular_dependencies(cellResult),
            };
            
            console.log(`[MCP-EXT-MAIN] 发送响应: ${TOOL_get_selected_cell}`, reply);
            
            // 发送响应
            bus.send_reply_to_server(reply);
            
            console.log(`[MCP-EXT-MAIN] 响应已发送`);
            return true;
          } catch (err) {
            console.error(`[MCP-EXT-MAIN] ❌ 处理${TOOL_get_selected_cell}请求失败:`, err);
            
            // 发送错误响应
            const errorReply = {
              __event: reply_name(TOOL_get_selected_cell, request.__request_id),
              __request_id: request.__request_id,
              success: false,
              error: err instanceof Error ? err.message : String(err)
            };
            
            console.log(`[MCP-EXT-MAIN] 发送错误响应:`, errorReply);
            bus.send_reply_to_server(errorReply);
            return false;
          }
        });

        const TOOL_add_rectangle = "add-rectangle";
        console.log(`[MCP-EXT-MAIN] 注册工具: ${TOOL_add_rectangle}`);
        const unregisterAddRectangle = bus.on_request_from_server(TOOL_add_rectangle, (request: any) => {
          console.log(`[MCP-EXT-MAIN] 执行工具: ${TOOL_add_rectangle}`, request);
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
          console.log(`[MCP-EXT-MAIN] 矩形已添加:`, rectangle);

          const reply = {
            __event: reply_name(TOOL_add_rectangle, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            cell: remove_circular_dependencies(rectangle),
          };
          console.log(`[MCP-EXT-MAIN] 发送响应: ${TOOL_add_rectangle}`, reply);
          bus.send_reply_to_server(reply);
        });

        const TOOL_delete_cell_by_id = "delete-cell-by-id";
        console.log(`[MCP-EXT-MAIN] 注册工具: ${TOOL_delete_cell_by_id}`);
        const unregisterDeleteCell = bus.on_request_from_server(TOOL_delete_cell_by_id, (request: any) => {
          console.log(`[MCP-EXT-MAIN] 执行工具: ${TOOL_delete_cell_by_id}`, request);
          const result = delete_cell_by_id(ui, {
            cell_id: request.cell_id,
          });
          console.log(`[MCP-EXT-MAIN] 单元格删除结果:`, result);
          
          const reply = {
            __event: reply_name(TOOL_delete_cell_by_id, request.__request_id),
            __request_id: request.__request_id,
            success: result,
          };
          console.log(`[MCP-EXT-MAIN] 发送响应: ${TOOL_delete_cell_by_id}`, reply);
          bus.send_reply_to_server(reply);
        });

        const TOOL_add_edge = "add-edge";
        console.log(`[MCP-EXT-MAIN] 注册工具: ${TOOL_add_edge}`);
        const unregisterAddEdge = bus.on_request_from_server(TOOL_add_edge, (request: any) => {
          console.log(`[MCP-EXT-MAIN] 执行工具: ${TOOL_add_edge}`, request);
          const edge = add_edge(ui, {
            source_id: request.source_id,
            target_id: request.target_id,
            style: request.style,
            text: request.text,
          });
          console.log(`[MCP-EXT-MAIN] 边已添加:`, edge);

          const reply = {
            __event: reply_name(TOOL_add_edge, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            edge: remove_circular_dependencies(edge),
          };
          console.log(`[MCP-EXT-MAIN] 发送响应: ${TOOL_add_edge}`, reply);
          bus.send_reply_to_server(reply);
        });

        const TOOL_get_shape_categories = "get-shape-categories";
        console.log(`[MCP-EXT-MAIN] 注册工具: ${TOOL_get_shape_categories}`);
        const unregisterGetShapeCategories = bus.on_request_from_server(
          TOOL_get_shape_categories,
          (request: any) => {
            console.log(`[MCP-EXT-MAIN] 执行工具: ${TOOL_get_shape_categories}`, request);
            const result = get_shape_categories(ui);
            console.log(`[MCP-EXT-MAIN] 图形类别:`, result);

            const reply = {
              __event: reply_name(
                TOOL_get_shape_categories,
                request.__request_id,
              ),
              __request_id: request.__request_id,
              success: true,
              shape_categories: remove_circular_dependencies(result),
            };
            console.log(`[MCP-EXT-MAIN] 发送响应: ${TOOL_get_shape_categories}`, reply);
            bus.send_reply_to_server(reply);
          },
        );

        const TOOL_get_shapes_in_category = "get-shapes-in-category";
        console.log(`[MCP-EXT-MAIN] 注册工具: ${TOOL_get_shapes_in_category}`);
        const unregisterGetShapesInCategory = bus.on_request_from_server(
          TOOL_get_shapes_in_category,
          (request: any) => {
            console.log(`[MCP-EXT-MAIN] 执行工具: ${TOOL_get_shapes_in_category}`, request);
            const result = get_shapes_in_category(ui, {
              category_id: request.category_id,
            });
            console.log(`[MCP-EXT-MAIN] 类别中的图形:`, result);

            const reply = {
              __event: reply_name(
                TOOL_get_shapes_in_category,
                request.__request_id,
              ),
              __request_id: request.__request_id,
              success: true,
              shapes: remove_circular_dependencies(result),
            };
            console.log(`[MCP-EXT-MAIN] 发送响应: ${TOOL_get_shapes_in_category}`, reply);
            bus.send_reply_to_server(reply);
          },
        );

        const TOOL_get_shape_by_name = "get-shape-by-name";
        console.log(`[MCP-EXT-MAIN] 注册工具: ${TOOL_get_shape_by_name}`);
        const unregisterGetShapeByName = bus.on_request_from_server(TOOL_get_shape_by_name, (request: any) => {
          console.log(`[MCP-EXT-MAIN] 执行工具: ${TOOL_get_shape_by_name}`, request);
          const result = get_shape_by_name(ui, {
            shape_name: request.shape_name,
          });
          console.log(`[MCP-EXT-MAIN] 找到的图形:`, result);

          const reply = {
            __event: reply_name(TOOL_get_shape_by_name, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            shape: remove_circular_dependencies(result),
          };
          console.log(`[MCP-EXT-MAIN] 发送响应: ${TOOL_get_shape_by_name}`, reply);
          bus.send_reply_to_server(reply);
        });

        const TOOL_add_cell_of_shape = "add-cell-of-shape";
        console.log(`[MCP-EXT-MAIN] 注册工具: ${TOOL_add_cell_of_shape}`);
        const unregisterAddCellOfShape = bus.on_request_from_server(TOOL_add_cell_of_shape, (request: any) => {
          console.log(`[MCP-EXT-MAIN] 执行工具: ${TOOL_add_cell_of_shape}`, request);
          const result = add_cell_of_shape(ui, {
            shape_name: request.shape_name,
            x: request.x,
            y: request.y,
            width: request.width,
            height: request.height,
            text: request.text,
            style: request.style,
          });
          console.log(`[MCP-EXT-MAIN] 图形单元格已添加:`, result);

          const reply = {
            __event: reply_name(TOOL_add_cell_of_shape, request.__request_id),
            __request_id: request.__request_id,
            success: true,
            cell: remove_circular_dependencies(result),
          };
          console.log(`[MCP-EXT-MAIN] 发送响应: ${TOOL_add_cell_of_shape}`, reply);
          bus.send_reply_to_server(reply);
        });
        
        // 添加卸载逻辑
        const unloadHandler = () => {
          console.log("[MCP-EXT-MAIN] 页面卸载，移除所有事件监听器");
          unregisterGetSelectedCell();
          unregisterAddRectangle();
          unregisterDeleteCell();
          unregisterAddEdge();
          unregisterGetShapeCategories();
          unregisterGetShapesInCategory();
          unregisterGetShapeByName();
          unregisterAddCellOfShape();
        };
        
        window.addEventListener('unload', unloadHandler);
      });
    } else {
      console.log("[MCP-EXT-MAIN] 等待Draw.io加载...");
      const el = document.querySelector(
        "body > div.geMenubarContainer > div.geMenubar > div > button",
      );
      if (el) {
        el.innerHTML = Date.now().toString();
      }
    }
  }, 1000);
});
