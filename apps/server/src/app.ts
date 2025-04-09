import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import checkRoutes from "./middleware/checkRoute.middleware";
import auth from "./routes/auth.route";
import chat from "./routes/chat.route";
import search from "./routes/search.route";

const app = express();
const server = createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust based on frontend origin
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser()); //parse the cookies
app.use(checkRoutes); // check all routes 

//api routes
app.use("/api/auth", auth);
app.use("/api/chat", chat);
app.use("/api/search", search)

// Default Route
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Hello from cma server" });
});

// Export both `app` and `server`
export { app, server, io };
