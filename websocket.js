export default class WebSocketManager {
    constructor(url = null, receiveMessageCallback = null) {
        this.socket = null // WebSocket 对象
        this.pingTimeout = null // 心跳计时器
        this.reconnectTimeout = null //重联计时器
        this.reconnectTimeoutClock = 5000 // 重连间隔，单位：毫秒
        this.maxReconnectAttempts = 10 // 最大重连尝试次数
        this.reconnectAttempts = 0; // 当前重连尝试次数
        this.url = url // WebSocket 连接地址
        this.isRetrying = true; // 是否重连
        this.receiveMessageCallback = receiveMessageCallback // 接收消息回调函数
    }
    /**
    * 初始化
    */
    async start() {
        if (this.url) {
            // 连接WebSocket
            this.connectWebSocket();
        } else {
            console.log('websocket: 缺少连接地址');
        }
    }
    /**
    * 创建WebSocket连接
    */
    connectWebSocket() {
        // 创建 WebSocket 对象
        this.socket = new WebSocket(this.url);

        // 处理连接打开事件
        this.socket.onopen = () => {
            console.log('websocket: 已连接');
            // 重置重连次数
            this.reconnectAttempts = 0;
            // 心跳机制
            this.startHeartbeat();
        };

        // 处理接收到消息事件
        this.socket.onmessage = (e) => {
            this.receiveMessage(e);
        };

        // 处理连接关闭事件
        this.socket.onclose = (e) => {
            console.log("websocket: 连接关闭", e);
            clearTimeout(this.pingTimeout);
            clearTimeout(this.reconnectTimeout);
            if (!e.wasClean && this.isRetrying) {
                // 异常关闭 尝试重连
                console.log("websocket: 连接异常关闭，尝试重连", e);
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    this.reconnectTimeout = setTimeout(() => {
                        this.connectWebSocket();
                    }, this.reconnectTimeoutClock);
                } else {
                    // 重置重连次数
                    this.reconnectAttempts = 0;
                    console.log('webscket: 已达到最大重新连接尝试次数，无法重新连接。');
                }
            }
        };

        // 处理 WebSocket 错误事件
        this.socket.onerror = (e) => {
            console.log('websocket: 连接错误', e);
        };

    }
    /**
    * 启动心跳机制
    */
    startHeartbeat() {
        this.pingTimeout = setInterval(() => {
            // 发送心跳消息
            this.sendMessage('heartCheck');
        }, 15000) // 每隔 10 秒发送一次心跳
    }
    /**
     * 发送消息
     * @param {string} message - 消息内容
     */
    sendMessage(message) {
        if (this.socket.readyState === WebSocket.OPEN) {
            console.log('websocket: 发送消息', message);
            this.socket.send(message);
        } else {
            console.log('websocket: 连接未打开，无法发送消息。');
        }
    }
    /**
    * 接收到消息
    * @param {object} event - 消息对象
    * @param {string} event.data - 消息内容
    */
    receiveMessage(event) {
        // 根据业务自行处理
        console.log('websocket: 收到消息', event.data);
        // 传入回调函数自行处理
        this.receiveMessageCallback && this.receiveMessageCallback(event.data);
    }
    /**
    * 关闭连接
    */
    closeWebSocket() {
        console.log('websocket: 主动关闭连接');
        this.socket.close();
        this.isRetrying = false;
        // 清除定时器 重置重连次数
        clearTimeout(this.pingTimeout);
        clearTimeout(this.reconnectTimeout);
        this.reconnectAttempts = 0;
    }
}