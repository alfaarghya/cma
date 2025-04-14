"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "remixicon/fonts/remixicon.css";
import { Message } from "@cma/types/clientTypes";
import api from "../../../../libs/axios";
import { useWebSocket } from "../../../../libs/socket";
import RenderMessage from "../../../../components/Render-Message";

const RoomPage = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const currentUserId = typeof window !== "undefined" ? localStorage.getItem("userId") || "" : "";
  const currentUsername = typeof window !== "undefined" ? localStorage.getItem("username") || "" : "";

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/${roomId}?type=roomMessage`);
        setMessages(res.data.content || []);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };

    if (roomId) fetchMessages();
  }, [roomId]);

  const { sendMessage } = useWebSocket({
    chatId: roomId as string,
    type: "room",
    userId: currentUserId,
    sender: currentUsername,
    onMessage: (data) => {
      if (data?.type === "roomMessage") {
        setMessages((prev) => [...prev, data]);
      }
    },
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;

    sendMessage(newMessage);

    setMessages((prev) => [
      ...prev,
      {
        senderId: currentUserId,
        sender: currentUsername,
        content: newMessage,
        createdAt: new Date().toISOString(),
      },
    ]);

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 space-y-2 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <RenderMessage key={i} msg={msg} i={i} currentUserId={currentUserId} />
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border px-3 py-2 rounded"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2 rounded">
          <i className="ri-send-plane-2-fill"></i>
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
