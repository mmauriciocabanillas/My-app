import fs from "fs"
import path from "path"

const SUB_FILE = "/tmp/push_sub.json"

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { subscription } = req.body
      if (!subscription) return res.status(400).json({ error: "No subscription" })
      fs.writeFileSync(SUB_FILE, JSON.stringify(subscription))
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (req.method === "GET") {
    try {
      if (!fs.existsSync(SUB_FILE)) return res.status(404).json({ error: "No subscription saved" })
      const sub = JSON.parse(fs.readFileSync(SUB_FILE, "utf8"))
      return res.status(200).json(sub)
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}