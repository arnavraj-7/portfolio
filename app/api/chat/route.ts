import { NextRequest, NextResponse } from 'next/server'

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite-preview-06-17']

async function callGemini(model: string, key: string, body: unknown) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  const data = await res.json()
  return { data, ok: res.ok }
}

export async function POST(req: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    return NextResponse.json({ error: { message: 'API key not configured' } }, { status: 500 })
  }

  const body = await req.json()

  for (const model of MODELS) {
    const { data, ok } = await callGemini(model, key, body)
    if (ok && !data.error) {
      return NextResponse.json(data, { status: 200 })
    }
  }

  return NextResponse.json({ error: { message: 'All models failed. Check API key or quota.' } }, { status: 502 })
}
