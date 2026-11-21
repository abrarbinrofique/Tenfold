"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8000`
    : "ws://localhost:8000");

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export interface WsEvent {
  type: string;
  payload?: any;
  at: number;
}

export function useMeetingSocket(meetingId: string | undefined) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!meetingId) return;
    const token =
      getCookie("tenfold_token") ??
      (typeof window !== "undefined" ? window.localStorage.getItem("tenfold_token") : null) ??
      "";
    const url = `${WS_BASE}/ws/meetings/${meetingId}?token=${encodeURIComponent(token)}`;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        attemptRef.current = 0;
        setConnected(true);
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setLastEvent({ type: data.type, payload: data.payload, at: Date.now() });
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        setConnected(false);
        const delay = Math.min(1000 * 2 ** attemptRef.current, 15000);
        attemptRef.current += 1;
        timerRef.current = setTimeout(connect, delay);
      };
      ws.onerror = () => ws.close();
    } catch {
      /* ignore */
    }
  }, [meetingId]);

  useEffect(() => {
    connect();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: unknown) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(typeof data === "string" ? data : JSON.stringify(data));
    }
  }, []);

  return { connected, lastEvent, send };
}
