// pages/api/notion.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { endpoint, body = {}, method = 'POST' } = req.body

  if (!process.env.NOTION_TOKEN) {
    return res.status(500).json({ error: 'NOTION_TOKEN no configurado' })
  }

  const fetchOpts = {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
  }

  // GET y HEAD no pueden tener body
  if (method !== 'GET' && method !== 'HEAD') {
    fetchOpts.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/${endpoint}`, fetchOpts)
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}