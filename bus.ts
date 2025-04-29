import { Bus, bus_reply_stream, bus_request_stream } from "./types";

export const bus: Bus = {
  send_reply_to_server: (reply: any) => {
    console.log(`[MCP-EXT-BUS] 发送响应到服务器:`, reply);
    try {
      window.dispatchEvent(new CustomEvent(bus_reply_stream, { detail: reply }));
      console.log(`[MCP-EXT-BUS] 响应事件已分发: ${bus_reply_stream}`, {
        eventName: reply.__event,
        requestId: reply.__request_id
      });
    } catch (err) {
      console.error(`[MCP-EXT-BUS] 分发响应事件失败:`, err);
    }
  },
  on_request_from_server: (event_name, request_listener) => {
    console.log(`[MCP-EXT-BUS] 注册事件监听器: ${event_name} 到 ${bus_request_stream}`);
    
    // 全局测试事件监听器，验证事件系统是否正常工作
    window.addEventListener("BUS_TEST_EVENT", (e) => {
      console.log(`[MCP-EXT-BUS] 测试事件收到，事件监听系统正常工作`);
    }, { once: true });
    
    // 验证事件系统
    console.log(`[MCP-EXT-BUS] 触发测试事件，验证事件系统`);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("BUS_TEST_EVENT"));
    }, 100);
    
    const listener = (emitter_data: any) => {
      try {
        console.log(`[MCP-EXT-BUS] 收到事件流: ${bus_request_stream}`, emitter_data);
        
        if (!emitter_data || !emitter_data.detail) {
          console.error(`[MCP-EXT-BUS] 收到的事件没有detail字段`);
          return;
        }
        
        const event = emitter_data.detail;
        console.log(`[MCP-EXT-BUS] 收到事件详情:`, {
          receivedEvent: event.__event,
          expectedEvent: event_name,
          requestId: event.__request_id,
          hasDetail: !!emitter_data.detail,
          eventKeys: event ? Object.keys(event) : []
        });
        
        if (event.__event === event_name) {
          console.log(`[MCP-EXT-BUS] 💡 匹配成功! 处理事件: ${event_name}`, event);
          try {
            const result = request_listener(event);
            console.log(`[MCP-EXT-BUS] 事件处理完成: ${event_name}`, { result });
          } catch (err) {
            console.error(`[MCP-EXT-BUS] 处理事件 ${event_name} 失败:`, err);
          }
        } else {
          console.log(`[MCP-EXT-BUS] 忽略不匹配的事件, 期望:${event_name}, 实际:${event.__event || '未定义'}`);
        }
      } catch (err) {
        console.error(`[MCP-EXT-BUS] 处理事件流失败:`, err);
      }
    };
    
    // 添加事件监听器
    console.log(`[MCP-EXT-BUS] 添加事件监听器: ${bus_request_stream} -> ${event_name}`);
    window.addEventListener(bus_request_stream, listener);
    
    return () => {
      console.log(`[MCP-EXT-BUS] 移除事件监听器: ${event_name}`);
      window.removeEventListener(bus_request_stream, listener);
    };
  },
};
