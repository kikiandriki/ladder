/**
 * Emote routes.
 */

// External imports.
import express from "express"
import { array, assert, string } from "superstruct"

// Database imports.
import { redis } from "@db/redis"

// Middleware imports.
import { perms } from "@middlewares/perms"

// The router.
export const emotes = express.Router()

/**
 * Increment emote counters for an incoming message.
 */
emotes.post("/:userId", perms("write:ladder"), async (req, res) => {
  assert(req.body, array(string()))
  // Parse user ID from path.
  const userId = req.params.userId
  const emotes = req.body
  // Write data to database.
  for (const emote of emotes) {
    await redis.zincrby(`users:${userId}:emotes`, 1, emote)
    await redis.zincrby(`emotes:${emote}:users`, 1, userId)
  }
  // Return a successful response.
  return res.status(204).send()
})

/**
 * Retrieve emote counters for a user.
 */
emotes.get("/:userId", async (req, res) => {
  // Parse user ID from path.
  const userId = req.params.userId
  // Retrieve data from database.
  const rankings = await redis.zrevrange(
    `users:${userId}:emotes`,
    0,
    9,
    "WITHSCORES",
  )
  const results: { emoteId: string; count: number; animated?: boolean }[] = []
  for (let i = 1; i < rankings.length; i += 2) {
    if (rankings[i - 1].split(":").length >= 2) {
      const [type, emoteId] = rankings[i - 1].split(":")
      results.push({
        emoteId,
        count: parseInt(rankings[i]),
        animated: type === "a",
      })
    } else {
      results.push({
        emoteId: rankings[i - 1],
        count: parseInt(rankings[i]),
      })
    }
  }
  // Return the data.
  return res.status(200).send(results)
})
