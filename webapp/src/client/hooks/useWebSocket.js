import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket() {
  const wsRef = useRef(null);
  const handlersRef = useRef(new Map());
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    // In dev mode (Vite on 5173), connect directly to Express server
    // to bypass Vite's WS proxy which is unreliable
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isDev = window.location.port === '5173';
    const wsUrl = isDev
      ? `ws://${window.location.hostname}:3001/ws`
      : `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const handler = handlersRef.current.get(msg.type);
        if (handler) handler(msg);
      } catch (err) {
        console.error('WS message parse error:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      // Auto-reconnect after 2 seconds
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      socket.close();
    };

    wsRef.current = socket;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const send = useCallback((type, data = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  const registerHandler = useCallback((type, cb) => {
    handlersRef.current.set(type, cb);
    return () => handlersRef.current.delete(type);
  }, []);

  return { connected, send, registerHandler };
}
