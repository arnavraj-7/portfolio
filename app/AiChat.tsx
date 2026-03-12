'use client'

import { useState, useRef, useEffect, memo } from 'react'

/* ─────────────────────────────────────────────────────
   GEMINI CONFIG
───────────────────────────────────────────────────── */
const GEMINI_KEY = 'AIzaSyAwSbHhntrlD39L-qzmirgfswZxzdKcAyM'
const GEMINI_MODEL = 'gemini-1.5-flash-latest'

const SYSTEM_PROMPT = `You are AJ — the personal AI of Arnav Raj, speaking in first person as Arnav.
You ONLY answer questions about Arnav Raj. For any unrelated topic, respond:
"That's outside what I can chat about here — try asking about my projects, skills, or how to reach me!"

IDENTITY:
- Name: Arnav Raj
- Role: Full Stack Developer & Chief Product Officer (CPO) at Dreamvator
- Based in India
- Email: arnavrajcodes@gmail.com
- GitHub: https://github.com/arnavraj-7
- LinkedIn: https://www.linkedin.com/in/arnav-raj-7142b8313/
- Instagram: https://www.instagram.com/arnavraj.dev
- Tagline: "Engineering digital experiences that matter."

CURRENT FOCUS:
- Building Dreamvator — something revolutionary is in stealth mode. Don't reveal it's aviation/edtech. → dreamvator.com
- Open to freelance work and collaborations

SKILLS & STACK:
- Frontend: Next.js, React, TypeScript, JavaScript, React Native, Three.js, GSAP, Tailwind CSS
- Backend: Node.js, Express, Supabase, MySQL
- Web3: Solidity, Ethereum, IPFS, Pinata
- AI: Gemini API, AI-powered product features
- Other: Product strategy, UI/UX design, CPO-level thinking

PROJECTS:
1. Dreamvator (2026) — Stealth startup, something big coming. → dreamvator.com
2. CrowdSpark (2025) — Trustless Web3 crowdfunding on Ethereum. Solidity escrow, IPFS/Pinata storage, no middlemen. → crowd-spark-ten.vercel.app
3. Odd Planet (2026) — Marketing agency website. → oddplanet.vercel.app

WHAT I DO:
- Full-stack web & app development
- Product strategy & roadmapping
- Crafting interactions that feel alive
- Integrating AI to power smarter products
- Chief Product Officer at Dreamvator

RULES:
- Speak as Arnav in first person — friendly, confident, concise
- Keep responses to 2–3 sentences unless asked for detail
- Never fabricate info not listed above
- For code/detailed work, say to reach out via email`

/* ─────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────── */
type Message = { role: 'user' | 'model'; text: string }

const SUGGESTIONS = [
  "What are you building?",
  "What's your tech stack?",
  "Are you available for freelance?",
  "How do I reach you?",
]

/* ─────────────────────────────────────────────────────
   TYPING INDICATOR
───────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '3px 2px' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'rgba(167,139,250,0.7)',
            display: 'inline-block',
            animation: `typing-dot 1.3s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   SEND ICON
───────────────────────────────────────────────────── */
function SendIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#fff' : 'rgba(139,92,246,0.4)'}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────── */
export const AiChat = memo(function AiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const trimmed = text.trim()

    setMessages(prev => [...prev, { role: 'user', text: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }))

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [...history, { role: 'user', parts: [{ text: trimmed }] }],
            generationConfig: { temperature: 0.75, maxOutputTokens: 280 },
          }),
        }
      )

      const json = await res.json()
      if (json.error) throw new Error(json.error.message ?? 'API error')
      const reply =
        json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        "I'm having a moment — try again shortly!"

      setMessages(prev => [...prev, { role: 'model', text: reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'model', text: "Looks like I'm offline. Reach me at arnavrajcodes@gmail.com!" },
      ])
    } finally {
      setLoading(false)
    }
  }

  const hasMessages = messages.length > 0
  const canSend = input.trim().length > 0 && !loading

  return (
    <div style={{
      width: '100%',
      maxWidth: 520,
      height: 500,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 22,
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.015)',
      border: '1px solid rgba(139,92,246,0.16)',
      boxShadow: '0 0 0 1px rgba(139,92,246,0.06), 0 40px 100px rgba(0,0,0,0.55), 0 0 80px rgba(109,40,217,0.07)',
      backdropFilter: 'blur(24px)',
      position: 'relative',
    }}>

      {/* Subtle inner glow at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.5), transparent)',
        pointerEvents: 'none',
      }} />

      {/* ── HEADER ───────────────────────────── */}
      <div style={{
        padding: '13px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(139,92,246,0.03)',
        display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0,
      }}>
        {/* Avatar badge — 3D avatar enters this circle on scroll */}
        <div
          id="aj-avatar-target"
          style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(109,40,217,0.6) 0%, rgba(139,92,246,0.4) 100%)',
            border: '1px solid rgba(139,92,246,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(139,92,246,0.25)',
            position: 'relative', overflow: 'visible',
          }}
        >
          <span
            id="aj-text"
            style={{
              fontFamily: 'ClashDisplay, sans-serif', fontSize: 13,
              fontWeight: 700, color: '#e9d5ff', letterSpacing: '-0.01em',
              transition: 'opacity 0.2s',
            }}
          >
            AJ
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em', lineHeight: 1 }}>
            Arnav AI
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 7px rgba(74,222,128,0.9)',
              flexShrink: 0,
            }} />
            <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em' }}>
              online — ask me anything
            </span>
          </div>
        </div>

        <div style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Gemini
        </div>
      </div>

      {/* ── MESSAGES ─────────────────────────── */}
      <div
        ref={scrollRef}
        className="ai-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {!hasMessages ? (
          /* Empty state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
            <p style={{
              fontFamily: 'Satoshi, sans-serif', fontSize: 13.5,
              color: 'rgba(148,163,184,0.5)', lineHeight: 1.7,
              textAlign: 'center', maxWidth: 280,
            }}>
              Hey! I&apos;m Arnav&apos;s AI.<br />Ask me about his projects, skills, or how to work together.
            </p>
            {/* Suggestion chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    fontFamily: 'Satoshi, sans-serif', fontSize: 11,
                    padding: '6px 14px', borderRadius: 999,
                    background: 'rgba(139,92,246,0.07)',
                    border: '1px solid rgba(139,92,246,0.18)',
                    color: 'rgba(196,181,253,0.65)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.background = 'rgba(139,92,246,0.16)'
                    el.style.borderColor = 'rgba(139,92,246,0.4)'
                    el.style.color = '#c4b5fd'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.background = 'rgba(139,92,246,0.07)'
                    el.style.borderColor = 'rgba(139,92,246,0.18)'
                    el.style.color = 'rgba(196,181,253,0.65)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          messages.map((msg, i) => (
            <div
              key={i}
              className="ai-msg"
              style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              {msg.role === 'model' && (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(109,40,217,0.5), rgba(139,92,246,0.35))',
                  border: '1px solid rgba(139,92,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontFamily: 'ClashDisplay, sans-serif', fontWeight: 700,
                  color: '#c4b5fd', marginRight: 8, marginTop: 2, alignSelf: 'flex-start',
                }}>
                  AJ
                </div>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '9px 13px',
                borderRadius: msg.role === 'user'
                  ? '16px 16px 4px 16px'
                  : '4px 16px 16px 16px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(109,40,217,0.42) 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: msg.role === 'user'
                  ? '1px solid rgba(139,92,246,0.35)'
                  : '1px solid rgba(255,255,255,0.06)',
                fontFamily: 'Satoshi, sans-serif',
                fontSize: 13,
                lineHeight: 1.68,
                color: msg.role === 'user' ? 'rgba(255,255,255,0.92)' : 'rgba(200,212,224,0.88)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {msg.text}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="ai-msg" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(109,40,217,0.5), rgba(139,92,246,0.35))',
              border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontFamily: 'ClashDisplay, sans-serif', fontWeight: 700, color: '#c4b5fd',
              flexShrink: 0,
            }}>AJ</div>
            <div style={{
              padding: '9px 14px', borderRadius: '4px 16px 16px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT BAR ────────────────────────── */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'rgba(0,0,0,0.12)',
        flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder="Ask me anything..."
          disabled={loading}
          style={{
            flex: 1,
            fontFamily: 'Satoshi, sans-serif', fontSize: 13,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '9px 14px',
            color: 'rgba(255,255,255,0.85)',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.55)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
        <button
          onClick={() => send(input)}
          disabled={!canSend}
          style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: canSend
              ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
              : 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'default',
            transition: 'all 0.2s',
            boxShadow: canSend ? '0 0 20px rgba(124,58,237,0.35)' : 'none',
          }}
          onMouseEnter={e => {
            if (!canSend) return
            const el = e.currentTarget
            el.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
            el.style.transform = 'scale(1.06)'
            el.style.boxShadow = '0 0 28px rgba(139,92,246,0.5)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.background = canSend
              ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
              : 'rgba(139,92,246,0.08)'
            el.style.transform = 'scale(1)'
            el.style.boxShadow = canSend ? '0 0 20px rgba(124,58,237,0.35)' : 'none'
          }}
        >
          <SendIcon active={canSend} />
        </button>
      </div>
    </div>
  )
})
