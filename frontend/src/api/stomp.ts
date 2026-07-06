const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type MessageHandler = (body: string) => void;

interface SubscriptionOptions {
  destination: string;
  endpoint?: string;
  onMessage: MessageHandler;
  onError?: () => void;
}

const buildWebSocketUrl = (endpoint: string) => {
  const base = API_BASE_URL
    ? new URL(API_BASE_URL, window.location.origin)
    : new URL(window.location.origin);
  const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${base.host}${base.pathname.replace(/\/$/, '')}${endpoint}`;
};

const buildFrame = (command: string, headers: Record<string, string>, body = '') => {
  const headerBlock = Object.entries(headers)
    .map(([key, value]) => `${key}:${value}`)
    .join('\n');
  return `${command}\n${headerBlock}\n\n${body}\0`;
};

export function subscribeToTopic({
  destination,
  endpoint = '/ws/kds',
  onMessage,
  onError,
}: SubscriptionOptions) {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let closedManually = false;
  let buffer = '';

  const clearReconnect = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (closedManually || reconnectTimer !== null) return;
    reconnectTimer = window.setTimeout(connect, 3000);
  };

  const handleFrame = (frame: string) => {
    const [headerPart, ...bodyParts] = frame.split('\n\n');
    const [command] = headerPart.split('\n');
    const body = bodyParts.join('\n\n');
    if (command === 'CONNECTED' && socket?.readyState === WebSocket.OPEN) {
      socket.send(
        buildFrame('SUBSCRIBE', {
          id: destination,
          destination,
        })
      );
      return;
    }
    if (command === 'MESSAGE') {
      onMessage(body);
      return;
    }
    if (command === 'ERROR') {
      onError?.();
    }
  };

  const connect = () => {
    clearReconnect();
    socket = new WebSocket(buildWebSocketUrl(endpoint));

    socket.addEventListener('open', () => {
      const host = window.location.host || 'localhost';
      socket?.send(
        buildFrame('CONNECT', {
          'accept-version': '1.2',
          host,
        })
      );
    });

    socket.addEventListener('message', (event) => {
      buffer += String(event.data);
      const frames = buffer.split('\0');
      buffer = frames.pop() ?? '';
      frames
        .map((frame) => frame.trim())
        .filter(Boolean)
        .forEach(handleFrame);
    });

    socket.addEventListener('error', () => {
      onError?.();
    });

    socket.addEventListener('close', () => {
      socket = null;
      scheduleReconnect();
    });
  };

  connect();

  return () => {
    closedManually = true;
    clearReconnect();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(buildFrame('DISCONNECT', {}));
    }
    socket?.close();
  };
}
