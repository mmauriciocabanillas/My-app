export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  try {
    const { endpoint, body, method: notionMethod = "POST" } = req.body

    if (!endpoint) return res.status(400).json({ error: "Missing endpoint" })

    const fetchOptions = {
      method: notionMethod,
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
    }

    if (notionMethod !== "GET") {
      fetchOptions.body = JSON.stringify(body || {})
    }

    const response = await fetch(`https://api.notion.com/v1/${endpoint}`, fetchOptions)
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}