import { WebSocketServer, WebSocket } from "ws";
import prisma from "@cma/db/prisma";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
}

const rooms = new Map<string, Set<ExtendedWebSocket>>(); // RoomID -> Set of WebSockets
const userSockets = new Map<string, ExtendedWebSocket>(); // userId -> WebSocket

const socketHandler = (wss: WebSocketServer) => {
  wss.on("connection", async (ws: ExtendedWebSocket) => {
    console.log("🔗 A user connected");

    ws.on("message", async (data) => {
      try {
        const { type, content, roomId, recipientId, senderId, sender } = JSON.parse(data.toString());

        if (!content || !senderId || !sender) {
          console.log("❌ Missing content or senderId or sender.");
          return;
        }

        ws.userId = senderId; // Store userId in the WebSocket connection
        userSockets.set(senderId, ws); // Track active WebSockets by userId

        // Handling Room Messages
        if (type === "roomMessage") {
          if (!roomId) {
            console.log("❌ No roomId found.");
            return;
          }

          // Check if user is in the room
          const userInRoom = await prisma.userChatRoom.findUnique({
            where: { userId_roomId: { userId: senderId, roomId } },
          });

          if (!userInRoom) {
            ws.send(JSON.stringify({ error: "You are not part of this room." }));
            return;
          }

          // Add user to the room's WebSocket set
          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }
          rooms.get(roomId)?.add(ws);

          // Store message in DB
          const message = await prisma.message.create({
            data: {
              content: content,
              senderId,
              roomId,
            },
          });

          // Send message only to users in the same room
          rooms.get(roomId)?.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.userId !== senderId) {
              client.send(
                JSON.stringify({
                  type: "roomMessage",
                  roomId,
                  senderId,
                  sender,
                  content,
                  createdAt: message.createdAt,
                })
              );
            }
          });
        }

        // Handling Direct Messages
        else if (type === "directMessage") {
          if (!recipientId) {
            console.log("❌ No recipientId found.");
            return;
          }

          // Store message in DB
          const message = await prisma.message.create({
            data: {
              content: content,
              senderId,
              receiverId: recipientId,
            },
          });

          // Only send to the intended recipient
          const recipientSocket = userSockets.get(recipientId);
          if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
            recipientSocket.send(
              JSON.stringify({
                type: "directMessage",
                content,
                senderId,
                sender,
                recipientId,
                createdAt: message.createdAt,
              })
            );
          }

          // Send a confirmation to the sender (optional)
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "messageSentConfirmation",
                recipientId,
                content,
                createdAt: message.createdAt,
              })
            );
          }
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      console.log(`❌ User ${ws.userId} disconnected`);

      // Remove user from rooms
      rooms.forEach((clients, roomId) => {
        if (clients.has(ws)) {
          clients.delete(ws);
          if (clients.size === 0) {
            rooms.delete(roomId);
          }
        }
      });

      // Remove user from active WebSocket connections
      if (ws.userId) {
        userSockets.delete(ws.userId);
      }
    });
  });
};

export default socketHandler;
