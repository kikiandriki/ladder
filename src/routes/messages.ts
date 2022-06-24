/**
 * Messages routes.
 */

// External imports.
import express from "express"

// Database imports.
import { redis } from "@db/redis"

// Middleware imports.
import { perms } from "@middlewares/perms"

// The router.
export const messages = express.Router()

/**
 * Increment message counters for an incoming message.
 */
messages.post("/:userId", perms("write:ladder"), async (req, res) => {
  // Parse user ID from path.
  const userId = req.params.userId
  // Get the day in UTC format.
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
  })
  // Write data to database.
  await redis.zincrby(`messages:${today}`, 1, userId)
  await redis.zincrby("messages:all", 1, userId)
  await redis.zincrby(`messages:${userId}`, 1, today)
  // Return a successful response.
  return res.status(204).send()
})

/**
 * Retrieve message counters for a user.
 */
messages.get("/:userId", async (req, res) => {
  // Parse user ID from path.
  const userId = req.params.userId
  // Get the day in UTC format.
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
  })
  // Retrieve data from database.
  const countAll = await redis.zscore("messages:all", userId)
  const countToday = await redis.zscore(`messages:${today}`, userId)
  const rank = await redis.zrevrank("messages:all", userId)
  // Return the data.
  return res.status(200).send({
    rank: rank !== null ? rank + 1 : undefined,
    count: {
      all: parseInt(countAll || "0"),
      today: parseInt(countToday || "0"),
    },
  })
})
