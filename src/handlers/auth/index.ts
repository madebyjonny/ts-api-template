import { Hono } from "hono";
import { Argon2id } from "oslo/password";
import { db } from "../../../db/db.js";
import { users } from "../../../db/schema.js";
import { lucia } from "../../../lucia.config.js";
import { generateId } from "lucia";
import { eq, sql } from "drizzle-orm";

export const auth = new Hono();

export function isValidEmail(email: string): boolean {
  return /.+@.+/.test(email);
}

auth.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

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
        email: email.toLowerCase(),
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

auth.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

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

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return new Response("Invalid email or password", {
      status: 400,
    });
  }

  const validPassword = await new Argon2id().verify(
    user[0].hashed_password,
    password
  );

  if (!validPassword) {
    return new Response("Invalid email or password", {
      status: 400,
    });
  }

  const session = await lucia.createSession(user[0].id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  return c.json(
    {
      user: {
        id: user[0].id,
        email: user[0].email,
      },
    },
    {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    }
  );
});
