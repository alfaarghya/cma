import dbConnect from "./dbConnect.controller";
import { wss } from "../app";
import socketHandler from "./socket.controller";

const startServer = async (port: number) => {
  try {
    console.log("🚀 Starting server...");
    await dbConnect(); // Connect to database
    socketHandler(wss); // Initialize WebSocket events
    console.log(`✅ Server is running on http://localhost:${port} ⚙️`);
  } catch (err) {
    console.log("❌ Error while starting server: " + err);
  }
};

export default startServer;
