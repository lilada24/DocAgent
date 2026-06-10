import { Client, StompSubscription } from '@stomp/stompjs';

type PendingSubscription = {
  channel: string;
  callback: (data: any) => void;
};

/**
 * WebSocket URL 构造 — 自动适配开发和部署环境
 *   开发环境: ws://localhost:8080/ws  (前后端分离，端口不同)
 *   部署环境: ws(s)://<当前域名>/ws  (经 nginx 代理，同源)
 */
function buildBrokerURL(): string {
  if (import.meta.env.DEV) {
    return 'ws://localhost:8080/ws';
  }
  // 生产环境：根据当前页面协议和域名动态构造
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}/ws`;
}

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private pendingSubscriptions: PendingSubscription[] = [];

  connect(token: string) {
    if (this.client?.active) {
      return;
    }

    this.client = new Client({
      brokerURL: buildBrokerURL(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log('STOMP:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('STOMP WebSocket connected');
      // 连接成功后，执行所有挂起的订阅
      this.flushPendingSubscriptions();
    };

    this.client.onDisconnect = () => {
      console.log('STOMP WebSocket disconnected');
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message'], frame.body);
    };

    this.client.activate();
  }

  disconnect() {
    this.pendingSubscriptions = [];
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  /**
   * 连接就绪后执行挂起的订阅
   */
  private flushPendingSubscriptions() {
    const pending = [...this.pendingSubscriptions];
    this.pendingSubscriptions = [];
    for (const { channel, callback } of pending) {
      this.doSubscribe(channel, callback);
    }
  }

  /**
   * 执行实际的 STOMP 订阅
   */
  private doSubscribe(channel: string, callback: (data: any) => void) {
    if (!this.client?.active) {
      // 还未连接，放入挂起队列
      this.pendingSubscriptions.push({ channel, callback });
      return;
    }

    if (this.subscriptions.has(channel)) {
      return; // 已经订阅过了
    }

    const sub = this.client.subscribe(channel, (message) => {
      try {
        callback(JSON.parse(message.body));
      } catch {
        callback(message.body);
      }
    });
    this.subscriptions.set(channel, sub);
    console.log('STOMP subscribed to:', channel);
  }

  subscribeToTask(taskId: string, callback: (data: any) => void) {
    // 后端通过 SimpMessagingTemplate.convertAndSend 推送到 /topic/task/{taskId}
    const topicChannel = `/topic/task/${taskId}`;
    this.doSubscribe(topicChannel, callback);
  }

  unsubscribeFromTask(taskId: string) {
    const channel = `/topic/task/${taskId}`;

    // 也从挂起列表中移除
    this.pendingSubscriptions = this.pendingSubscriptions.filter(
      (p) => p.channel !== channel
    );

    const sub = this.subscriptions.get(channel);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(channel);
    }
  }

  sendMessage(destination: string, data: any) {
    if (!this.client?.active) {
      console.warn('STOMP WebSocket not connected');
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(data),
    });
  }

  onTaskUpdate(callback: (data: any) => void) {
    if (!this.client?.active) {
      console.warn('STOMP WebSocket not connected yet, pending subscription');
      this.pendingSubscriptions.push({
        channel: '/topic/task/created',
        callback,
      });
      return;
    }

    const channel = '/topic/task/created';
    const sub = this.client.subscribe(channel, (message) => {
      try {
        callback(JSON.parse(message.body));
      } catch {
        callback(message.body);
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }

  ping() {
    this.sendMessage('/app/ping', {});
  }

  isConnected(): boolean {
    return this.client?.active || false;
  }
}

export const wsService = new WebSocketService();
