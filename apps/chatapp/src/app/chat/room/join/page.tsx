"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "../../../../libs/axios";

const JoinRoomPage = () => {
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    try {
      setLoading(true);
      const res = await api.put("/chat/room/join-room", { roomName });

      const room = res.data.room;
      toast.success(res.data.message);
      window.dispatchEvent(new Event("room-joined"));
      router.push(`/chat/room/${room.id}`);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        toast.error("Room not found");
      } else {
        toast.error("Something went wrong");
        console.error("Join error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">Join a Room</h1>

        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter room name"
          className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring focus:border-blue-400"
        />

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-300"
        >
          {loading ? "Joining..." : "Join Room"}
        </button>
      </div>
    </div>
  );
};

export default JoinRoomPage;
