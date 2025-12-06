import { useEffect, useRef, useState, useCallback } from "react";
import type { WsMessage, Participant } from "@shared/schema";

interface UseWebSocketOptions {
  sessionId: string;
  userName: string;
  onCodeUpdate?: (code: string) => void;
  onLanguageChange?: (language: string) => void;
  onParticipantsChange?: (update: Participant[] | ((prev: Participant[]) => Participant[])) => void;
  onError?: (message: string) => void;
}

export function useWebSocket({
  sessionId,
  userName,
  onCodeUpdate,
  onLanguageChange,
  onParticipantsChange,
  onError,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      if (!isMounted.current) {
        socket.close();
        return;
      }
      setIsConnected(true);
      // Join the session
      const joinMessage: WsMessage = {
        type: "join",
        sessionId,
        name: userName,
      };
      socket.send(JSON.stringify(joinMessage));
    };

    socket.onmessage = (event) => {
      if (!isMounted.current) return;
      try {
        const message = JSON.parse(event.data) as WsMessage;

        switch (message.type) {
          case "session_state":
            onCodeUpdate?.(message.code);
            onLanguageChange?.(message.language);
            onParticipantsChange?.(message.participants);
            // Use the server-provided participant ID (guaranteed unique)
            setMyParticipantId(message.myParticipantId);
            break;

          case "code_update":
            onCodeUpdate?.(message.code);
            break;

          case "language_change":
            onLanguageChange?.(message.language);
            break;

          case "participant_joined":
            onParticipantsChange?.((prev) => {
              if (Array.isArray(prev)) {
                return [...prev, message.participant];
              }
              return [message.participant];
            });
            break;

          case "participant_left":
            onParticipantsChange?.((prev) => {
              if (Array.isArray(prev)) {
                return prev.filter((p) => p.id !== message.participantId);
              }
              return [];
            });
            break;

          case "participant_cursor":
            onParticipantsChange?.((prev) => {
              if (Array.isArray(prev)) {
                return prev.map((p) =>
                  p.id === message.participantId
                    ? { ...p, cursorLine: message.line, cursorColumn: message.column }
                    : p
                );
              }
              return [];
            });
            break;

          case "error":
            onError?.(message.message);
            break;
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    socket.onclose = () => {
      if (!isMounted.current) return;
      setIsConnected(false);
      // Attempt to reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          connect();
        }
      }, 2000);
    };

    socket.onerror = () => {
      socket.close();
    };

    wsRef.current = socket;
  }, [sessionId, userName, onCodeUpdate, onLanguageChange, onParticipantsChange, onError]);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const sendCodeUpdate = useCallback((code: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WsMessage = { type: "code_update", code };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendLanguageChange = useCallback((language: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WsMessage = { type: "language_change", language };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendCursorUpdate = useCallback((line: number, column: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WsMessage = { type: "cursor_update", line, column };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    myParticipantId,
    sendCodeUpdate,
    sendLanguageChange,
    sendCursorUpdate,
  };
}
