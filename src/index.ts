import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { auth } from "./handlers/auth/index.js";
import { Server } from "socket.io";

const app = new Hono();

app.route("/auth", auth);

const port = 4321;
console.log(`Server is running on port ${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");
});
