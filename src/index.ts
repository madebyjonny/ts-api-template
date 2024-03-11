import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { auth } from "./handlers/auth/index.js";

const app = new Hono();

app.route("/auth", auth);

const port = 4321;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
