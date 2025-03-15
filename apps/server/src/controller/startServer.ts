// import dbConnect from "./dbConnect";
import { io } from "../app";
import socketHandler from "./socketHandler";

const startServer = async (port: number) => {
  try {
    console.log("🚀 Starting server...");
    // await dbConnect(); // Connect to database
    socketHandler(io); // Initialize Socket.io events
    console.log(`✅ Server is running on http://localhost:${port} ⚙️`);
  } catch (err) {
    console.log("❌ Error while starting server: " + err);
  }
};

export default startServer;
