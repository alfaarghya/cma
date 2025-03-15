import { server } from "./app";
import * as dotenv from "dotenv";
import startServer from "./controller/startServer";

dotenv.config();

// eslint-disable-next-line turbo/no-undeclared-env-vars
const port = process.env.PORT || 8080; // Server port

// Start the server (Express & WebSocket)
server.listen(port, async () => startServer(Number(port)));
