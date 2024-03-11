import { Hono } from "hono";
import { Argon2id } from "oslo/password";
import { db } from "../../../db/db.js";
import { users } from "../../../db/schema.js";
import { lucia } from "../../../lucia.config.js";
import { generateId } from "lucia";

export const user = new Hono();

user.get("/", (c) => c.text("some user"));
// user.get("/:id", (c) => c.text("some other user"));

export function isValidEmail(email: string): boolean {
  return /.+@.+/.test(email);
}

user.post("/", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  console.log(body);

  if (
    !email ||
    typeof email !== "string" ||
    !isValidEmail(email) ||
    !password ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    return c.json({ message: "Email and password are required" }, 400);
  }

  const hashedPassword = await new Argon2id().hash(password);
  const userId = generateId(15);

  try {
    const user = await db
      .insert(users)
      .values({
        id: userId,
        email,
        hashed_password: hashedPassword,
      })
      .returning({ id: users.id });

    const session = await lucia.createSession(String(user[0].id), {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return c.json(
      { token: session.id },
      {
        headers: {
          "Set-Cookie": sessionCookie.serialize(),
        },
      }
    );
  } catch (e) {
    const error = e as Error;
    // db error, email taken, etc
    return c.json(
      { message: error.message },
      {
        status: 400,
      }
    );
  }
});
