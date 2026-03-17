import Anthropic from '@anthropic-ai/sdk'
import { setCorsHeaders } from './_lib/cors.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'

// Instantiated once per warm instance; ANTHROPIC_API_KEY is read from env only.
// The key is never serialised or returned to the caller.
const client = new Anthropic()

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `あなたは料理の専門家です。ユーザーが持っている食材を使って、美味しく作れる家庭料理を提案してください。
提案する際は以下を守ってください：
- 提供する食材で無理なく作れる料理を選ぶ
- 家庭にある一般的な調味料（醤油、みりん、酒、塩、砂糖、油など）は使用可能とする
- 手順は簡潔に、初心者でもわかる説明にする
- 調理時間は現実的な時間にする`

function buildUserPrompt(ingredients) {
  return `冷蔵庫にある食材: ${ingredients.join('、')}

これらの食材を使って、作れる献立を3つ提案してください。

必ず以下のJSON形式のみで回答してください（説明文・コードブロック不要）:
{
  "meals": [
    {
      "name": "料理名",
      "description": "料理の魅力を伝える1〜2文の説明",
      "ingredients": ["食材と量（例: 卵 2個）"],
      "steps": ["調理手順1", "調理手順2", "調理手順3"],
      "time": "調理時間（例: 20分）",
      "difficulty": "難易度（簡単・普通・難しいのいずれか）"
    }
  ]
}`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // 1. CORS — must run before every response path including early returns
  const originAllowed = setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  // Block requests from untrusted origins (non-browser clients have no Origin
  // header and are allowed through; this only affects cross-origin browser calls).
  if (req.headers.origin && !originAllowed) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 2. Rate limiting — checked per client IP
  const ip = getClientIp(req)
  const rl = checkRateLimit(ip)

  // Always expose rate-limit state to the caller
  res.setHeader('X-RateLimit-Limit', String(rl.limit))
  res.setHeader('X-RateLimit-Remaining', String(rl.remaining))
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000))) // Unix seconds

  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000)
    res.setHeader('Retry-After', String(retryAfter))
    return res.status(429).json({
      error: `リクエスト制限に達しました。${retryAfter}秒後に再試行してください。`,
    })
  }

  // 3. Input validation
  const { ingredients } = req.body ?? {}

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: '食材を1つ以上入力してください' })
  }

  const sanitized = ingredients
    .map(s => String(s).trim())
    .filter(s => s.length > 0 && s.length <= 50)
    .slice(0, 30)

  if (sanitized.length === 0) {
    return res.status(400).json({ error: '有効な食材を入力してください' })
  }

  // 4. Call Claude — ANTHROPIC_API_KEY stays on the server, never sent to client
  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(sanitized) }],
    })

    const message = await stream.finalMessage()
    const rawText = message.content[0]?.text ?? ''

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('suggest: no JSON in Claude response', rawText.slice(0, 200))
      return res.status(500).json({ error: 'AIからの応答が正しく取得できませんでした' })
    }

    const result = JSON.parse(jsonMatch[0])

    if (!Array.isArray(result.meals) || result.meals.length === 0) {
      return res.status(500).json({ error: '献立の提案が取得できませんでした' })
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('suggest: Claude API error', err?.status, err?.message)

    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: 'サーバー設定エラーが発生しました' })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(503).json({ error: 'サービスが混雑しています。しばらくお待ちください' })
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return res.status(503).json({ error: 'AIサービスへの接続に失敗しました。再試行してください' })
    }

    return res.status(500).json({ error: '献立の提案に失敗しました。もう一度お試しください' })
  }
}
