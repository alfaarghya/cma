import { Server } from "socket.io";
import prisma from "@cma/db/prisma";

const socketHandler = (io: Server) => {
  io.on("connection", (socket) => {
    console.log(`✅ New user connected: ${socket.id}`);

    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on("chatMessage", async ({ senderId, message, roomId, receiverId }) => {
      console.log(`📩 Message from ${senderId}: "${message}"`);

      // Save message to DB
      const newMessage = await prisma.message.create({
        data: { content: message, senderId, roomId, receiverId },
      });

      if (roomId) {
        io.to(roomId).emit("chatMessage", newMessage);
      } else if (receiverId) {
        io.to(receiverId).emit("chatMessage", newMessage);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ User ${socket.id} disconnected`);
    });
  });
};

export default socketHandler;
