import { useEffect, useRef, useCallback } from "react";
import { WebSocketOptions } from "@cma/types/clientTypes";

export const useWebSocket = ({ chatId, type, userId, sender, onMessage }: WebSocketOptions) => {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (socketRef.current) return;

    const SOCKET_URL = "ws://localhost:8080";
    const socket = new WebSocket(SOCKET_URL);
    socketRef.current = socket;


    socket.onopen = () => {
      // console.log(userId);
      console.log("✅ WebSocket Connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (err) {
        console.error("❌ Invalid message format", err);
      }
    };

    socket.onclose = () => {
      console.log("❌ WebSocket Disconnected");
      socketRef.current = null;
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket Error:", err);
    };
  }, []);

  const sendMessage = (content: string) => {

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.log("🚫 WebSocket not open yet");
      console.log(socketRef.current);
      return;
    }

    const payload =
      type === "room"
        ? {
          type: "roomMessage",
          roomId: chatId,
          senderId: userId,
          sender: sender,
          content,
        }
        : {
          type: "directMessage",
          recipientId: chatId,
          senderId: userId,
          sender: sender,
          content,
        };

    socketRef.current.send(JSON.stringify(payload));
  };

  useEffect(() => {
    connect();
  }, [connect]);

  return { sendMessage };
};
