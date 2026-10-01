import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { db } from "../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Check who is making the request
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({
      error: "You must be signed in",
    });
  }

  const email = session.user.email;
  const name = session.user.name ?? null;

  try {
    // 2. Find this user, or create them if this is their first request
    const userResult = await db.query(
      `
      INSERT INTO users (email, name)
      VALUES ($1, $2)
      ON CONFLICT (email)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id
      `,
      [email, name]
    );

    const userId = userResult.rows[0].id;

    // 3. GET = retrieve this user's history
    if (req.method === "GET") {
      const result = await db.query(
        `
        SELECT
          id,
          incoming_email,
          generated_reply,
          tone,
          intent,
          urgency,
          created_at
        FROM replies
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId]
      );

      return res.status(200).json(result.rows);
    }

    // 4. POST = save a new reply
    if (req.method === "POST") {
      const {
        incomingEmail,
        generatedReply,
        tone,
        intent,
        urgency,
      } = req.body;

      if (!incomingEmail || !generatedReply || !tone) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      const result = await db.query(
        `
        INSERT INTO replies (
          user_id,
          incoming_email,
          generated_reply,
          tone,
          intent,
          urgency
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          userId,
          incomingEmail,
          generatedReply,
          tone,
          intent ?? null,
          urgency ?? null,
        ]
      );

      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Reply history error:", error);

    return res.status(500).json({
      error: "Database operation failed",
    });
  }
}