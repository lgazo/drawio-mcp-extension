import { bus_reply_stream, bus_request_stream } from "@/types";

// Send message to WebSocket via background
function sendToWebSocket(data: any) {
  console.log("[MCP-EXT-CONTENT] 向WebSocket发送消息:", data);
  browser.runtime.sendMessage({
    type: "SEND_WS_MESSAGE",
    data: data,
  }).then((response) => {
    console.log("[MCP-EXT-CONTENT] 消息已发送到background脚本，响应:", response);
  }).catch(err => {
    console.error("[MCP-EXT-CONTENT] 发送消息到background脚本失败:", err);
  });
}

export default defineContentScript({
  matches: [
    "*://app.diagrams.net/*",
    "*://*.diagrams.net/*",
    "*://draw.io/*",
    "*://*.draw.io/*"
  ],
  async main() {
    console.log("[MCP-EXT-CONTENT] 内容脚本已加载", { time: Date.now(), window, browser });
    
    // 打印bus常量的值，确保它们被正确导入
    console.log("[MCP-EXT-CONTENT] 总线常量:", { 
      bus_request_stream, 
      bus_reply_stream,
      types: typeof bus_request_stream
    });
    
    try {
      console.log("[MCP-EXT-CONTENT] 正在注入主要脚本到页面...");
      await injectScript("/main_world.js", {
        keepInDom: true,
      });
      console.log("[MCP-EXT-CONTENT] 主要脚本注入成功");
    } catch (err) {
      console.error("[MCP-EXT-CONTENT] 注入主要脚本失败:", err);
    }

    // 发送一个测试事件，检查事件系统是否正常工作
    setTimeout(() => {
      console.log("[MCP-EXT-CONTENT] 发送测试事件到页面");
      const testEvent = new CustomEvent("TEST_EVENT", { detail: { test: true } });
      window.dispatchEvent(testEvent);
      
      // 测试BUS_REQUEST事件
      console.log(`[MCP-EXT-CONTENT] 发送测试 ${bus_request_stream} 事件到页面`);
      const busRequestEvent = new CustomEvent(bus_request_stream, { 
        detail: { 
          __event: "test-event", 
          __request_id: "test-123" 
        } 
      });
      window.dispatchEvent(busRequestEvent);
    }, 2000);

    // Listen for messages from background
    browser.runtime.onMessage.addListener((message) => {
      console.log("[MCP-EXT-CONTENT] 收到来自background的消息:", message);
      
      if (message.type === "WS_MESSAGE") {
        console.log(
          "[MCP-EXT-CONTENT] 收到WebSocket消息，转发到页面:",
          message.data,
        );
        
        try {
          // 确保message.data是有效的对象
          if (message.data && (typeof message.data === 'object' || typeof message.data === 'string')) {
            const eventData = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
            
            console.log("[MCP-EXT-CONTENT] 消息详情:", {
              messageType: message.type,
              hasEvent: !!eventData.__event,
              eventName: eventData.__event || "无事件名",
              requestId: eventData.__request_id || "无请求ID",
              fullData: eventData
            });
            
            // 检查是否有__event字段，这是服务器请求的标志
            if (eventData.__event) {
              console.log(`[MCP-EXT-CONTENT] 检测到有效的MCP请求事件: ${eventData.__event}`);
              
              // 创建并分发BUS_REQUEST事件到页面
              console.log(`[MCP-EXT-CONTENT] 准备分发事件 ${bus_request_stream} 到页面，事件内容:`, eventData);
              
              // 在分发前添加调试代码
              window.addEventListener("BUS_REQUEST_DEBUG", (e) => {
                console.log("[MCP-EXT-CONTENT] 调试事件收到:", e);
              }, { once: true });
              
              // 分发一个测试事件，检查事件系统是否正常工作
              window.dispatchEvent(new CustomEvent("BUS_REQUEST_DEBUG", { detail: { test: true } }));
              
              // 创建并分发实际事件
              const event = new CustomEvent(bus_request_stream, { detail: eventData });
              window.dispatchEvent(event);
              console.log(`[MCP-EXT-CONTENT] 已分发 ${bus_request_stream} 事件到页面`);
              
              // 如果是特定请求，可以直接回复测试数据
              if (eventData.__event === 'get-selected-cell') {
                console.log(`[MCP-EXT-CONTENT] 收到选中单元格请求，准备直接回复测试数据`);
                
                // 直接创建并发送测试响应
                const testReply = {
                  __event: `${eventData.__event}.${eventData.__request_id}`,
                  __request_id: eventData.__request_id,
                  success: true,
                  cell: {
                    id: 'test-cell-id-direct-from-content',
                    value: 'Test Cell (Content)',
                    style: 'default',
                    geometry: {
                      x: 200, y: 200, width: 150, height: 80
                    }
                  }
                };
                
                // 延迟1秒发送，确保可以看到日志
                setTimeout(() => {
                  console.log(`[MCP-EXT-CONTENT] 发送测试响应:`, testReply);
                  sendToWebSocket(testReply);
                }, 1000);
              }
            } else {
              console.log("[MCP-EXT-CONTENT] 消息不包含__event字段，无法分发到页面", eventData);
            }
          } else {
            console.error("[MCP-EXT-CONTENT] 收到的消息data不是有效对象:", message.data);
          }
        } catch (err) {
          console.error("[MCP-EXT-CONTENT] 处理WebSocket消息失败:", err);
        }
      } else if (message.type === "WS_STATUS") {
        console.log(
          "[MCP-EXT-CONTENT] WebSocket状态更新:",
          message.connected ? "已连接" : "已断开",
        );
      }
    });

    window.addEventListener(bus_reply_stream, (message: any) => {
      console.log("[MCP-EXT-CONTENT] 收到来自页面的响应:", message.detail);
      try {
        const reply = message.detail;
        if (reply) {
          console.log("[MCP-EXT-CONTENT] 将页面响应发送到服务器:", reply);
          sendToWebSocket(reply);
        } else {
          console.error("[MCP-EXT-CONTENT] 页面响应不包含有效数据");
        }
      } catch (err) {
        console.error("[MCP-EXT-CONTENT] 处理页面响应失败:", err);
      }
    });
    
    // 检查页面是否已加载完成
    if (document.readyState === "complete") {
      console.log("[MCP-EXT-CONTENT] 页面已完全加载");
    } else {
      console.log("[MCP-EXT-CONTENT] 页面尚未完全加载，等待...");
      window.addEventListener("load", () => {
        console.log("[MCP-EXT-CONTENT] 页面加载完成");
      });
    }
    
    // 定期检查Draw.io状态
    const checkDrawioInterval = setInterval(() => {
      if (window.Draw) {
        console.log("[MCP-EXT-CONTENT] 检测到Draw.io已加载");
        clearInterval(checkDrawioInterval);
      }
    }, 2000);
  },
});
