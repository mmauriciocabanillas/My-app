export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end()
  
    const { endpoint, body, method = 'POST' } = req.body
  
    const response = await fetch(`https://api.notion.com/v1/${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  
    const data = await response.json()
    res.status(response.status).json(data)
  }