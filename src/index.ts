import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { user } from "./handlers/users/index.js";

const app = new Hono();

app.route("/users", user);

const port = 4321;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
