'use client'

import { useState, useRef, useEffect, memo, Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import R3F only on client — avoids SSR issues
const MobileAvatarCanvas = dynamic(() => import('./MobileAvatarCircle'), { ssr: false })

/* ─────────────────────────────────────────────────────
   GEMINI CONFIG
───────────────────────────────────────────────────── */
const GEMINI_KEY = 'AIzaSyCOP_7OSAveWdw_dl0Ds3vbgUSohyxxHAg'
const GEMINI_MODEL = 'gemini-2.5-flash'

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

CONTACT FORM FLOW (critical):
If the user expresses interest in working with Arnav, collaborating, hiring, building something together, or wants to send a message:
1. Ask for their name (if not known)
2. Ask for their email address
3. Ask briefly what they'd like to build or discuss
Once you have all three (name, email, what they want), warmly confirm you're sending the message, then append EXACTLY this tag at the very end of your response (no spaces, no line break before it):
[SEND_CONTACT:{"name":"REPLACE","email":"REPLACE","message":"REPLACE"}]
Replace REPLACE with the actual values. This tag is processed silently — never mention it or explain it to the user.

RULES:
- Speak as Arnav in first person — friendly, confident, concise
- Keep responses to 2–3 sentences unless asked for detail
- Never fabricate info not listed above
- For code/detailed work, say to reach out via email`

const WEB3FORMS_KEY = '715d3934-7f7f-4a64-bb69-d98ab915650c'
const SEND_TAG_RE = /\[SEND_CONTACT:(\{.*?\})\]/

async function submitContactForm(name: string, email: string, message: string) {
  await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      name,
      email,
      message: `[Via AI Chat]\n${message}`,
      subject: `New message from ${name} via Arnav's AI`,
    }),
  })
}

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
  const [formSent, setFormSent] = useState(false)
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
      let reply: string =
        json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
        "I'm having a moment — try again shortly!"

      // Check for contact form trigger tag
      const tagMatch = reply.match(SEND_TAG_RE)
      if (tagMatch) {
        reply = reply.replace(SEND_TAG_RE, '').trim()
        try {
          const { name, email, message } = JSON.parse(tagMatch[1])
          submitContactForm(name, email, message)
          setFormSent(true)
          setTimeout(() => setFormSent(false), 6000)
        } catch { /* malformed JSON — skip submission */ }
      }

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
      maxWidth: 700,
      height: 600,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 24,
      overflow: 'hidden',
      textAlign: 'left',
      background: 'rgba(8,5,20,0.85)',
      border: '1px solid rgba(139,92,246,0.2)',
      boxShadow: '0 0 0 1px rgba(139,92,246,0.08), 0 40px 120px rgba(0,0,0,0.7), 0 0 120px rgba(109,40,217,0.12), inset 0 1px 0 rgba(255,255,255,0.04)',
      backdropFilter: 'blur(32px)',
      position: 'relative',
      animation: 'ai-breathe 5s ease-in-out infinite',
    }}>

      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.7), rgba(196,181,253,0.5), transparent)',
        pointerEvents: 'none', zIndex: 10,
      }} />
      {/* Corner accents */}
      {[
        { top: 8, left: 8, borderTop: '1.5px solid rgba(139,92,246,0.4)', borderLeft: '1.5px solid rgba(139,92,246,0.4)' },
        { top: 8, right: 8, borderTop: '1.5px solid rgba(139,92,246,0.4)', borderRight: '1.5px solid rgba(139,92,246,0.4)' },
        { bottom: 8, left: 8, borderBottom: '1.5px solid rgba(139,92,246,0.4)', borderLeft: '1.5px solid rgba(139,92,246,0.4)' },
        { bottom: 8, right: 8, borderBottom: '1.5px solid rgba(139,92,246,0.4)', borderRight: '1.5px solid rgba(139,92,246,0.4)' },
      ].map((style, i) => (
        <div key={i} style={{ position: 'absolute', width: 10, height: 10, pointerEvents: 'none', zIndex: 10, ...style }} />
      ))}

      {/* ── HEADER ───────────────────────────── */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(139,92,246,0.1)',
        background: 'linear-gradient(180deg, rgba(109,40,217,0.05) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        position: 'relative', zIndex: 2,
      }}>
        {/* Avatar circle */}
        <div
          id="aj-avatar-target"
          style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(109,40,217,0.7) 0%, rgba(139,92,246,0.5) 100%)',
            border: '1.5px solid rgba(139,92,246,0.6)',
            boxShadow: '0 0 0 3px rgba(139,92,246,0.08), 0 0 24px rgba(139,92,246,0.35)',
            position: 'relative', overflow: 'hidden',
            animation: 'aj-ring-pulse 3s ease-in-out infinite',
          }}
        >
          {/* Mobile only: mini 3D avatar clipped to circle (desktop uses main canvas) */}
          <div className="md:hidden" style={{ position: 'absolute', inset: 0 }}>
            <MobileAvatarCanvas />
          </div>

          {/* AJ text — always shown on desktop, fades on mobile once model loads */}
          <span
            id="aj-text"
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'ClashDisplay, sans-serif', fontSize: 17,
              fontWeight: 700, color: '#e9d5ff', letterSpacing: '-0.01em',
              transition: 'opacity 0.5s', pointerEvents: 'none', zIndex: 1,
            }}
          >
            AJ
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'ClashDisplay, sans-serif', fontSize: 16, fontWeight: 700,
            letterSpacing: '-0.02em', lineHeight: 1,
            background: 'linear-gradient(90deg, #ffffff 0%, #c4b5fd 60%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Arnav AI
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 8px rgba(74,222,128,1)',
              flexShrink: 0,
              animation: 'badge-pulse 2.5s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.04em' }}>
              online — ask me anything
            </span>
          </div>
        </div>

      </div>

      {/* ── MESSAGES ─────────────────────────── */}
      <div
        ref={scrollRef}
        className="ai-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 12px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 2 }}
      >
        {!hasMessages ? (
          /* Empty state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
            {/* Decorative glow orb */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
              border: '1px solid rgba(139,92,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px rgba(139,92,246,0.2)',
              animation: 'aj-ring-pulse 3s ease-in-out infinite',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p style={{
              fontFamily: 'Satoshi, sans-serif', fontSize: 14,
              color: 'rgba(148,163,184,0.55)', lineHeight: 1.7,
              textAlign: 'center', maxWidth: 300,
            }}>
              Hey! I&apos;m Arnav&apos;s AI.<br />Ask me about his projects, skills, or how to work together.
            </p>
            {/* Suggestion chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 500 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    fontFamily: 'Satoshi, sans-serif', fontSize: 12,
                    padding: '7px 16px', borderRadius: 999,
                    background: 'rgba(139,92,246,0.07)',
                    border: '1px solid rgba(139,92,246,0.18)',
                    color: 'rgba(196,181,253,0.65)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.background = 'rgba(139,92,246,0.18)'
                    el.style.borderColor = 'rgba(139,92,246,0.45)'
                    el.style.color = '#c4b5fd'
                    el.style.boxShadow = '0 0 16px rgba(139,92,246,0.2)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.background = 'rgba(139,92,246,0.07)'
                    el.style.borderColor = 'rgba(139,92,246,0.18)'
                    el.style.color = 'rgba(196,181,253,0.65)'
                    el.style.boxShadow = 'none'
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
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 8,
              }}
            >
              {msg.role === 'model' && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(109,40,217,0.65), rgba(139,92,246,0.45))',
                  border: '1px solid rgba(139,92,246,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontFamily: 'ClashDisplay, sans-serif', fontWeight: 700,
                  color: '#c4b5fd', alignSelf: 'flex-end', marginBottom: 1,
                }}>
                  AJ
                </div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user'
                  ? '18px 18px 4px 18px'
                  : '4px 18px 18px 18px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(109,40,217,0.5) 0%, rgba(124,58,237,0.55) 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: msg.role === 'user'
                  ? '1px solid rgba(139,92,246,0.4)'
                  : '1px solid rgba(255,255,255,0.07)',
                fontFamily: 'Satoshi, sans-serif',
                fontSize: 13.5,
                lineHeight: 1.7,
                color: msg.role === 'user' ? 'rgba(255,255,255,0.95)' : 'rgba(210,220,232,0.9)',
                textAlign: 'left',
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
          <div className="ai-msg" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(109,40,217,0.65), rgba(139,92,246,0.45))',
              border: '1px solid rgba(139,92,246,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontFamily: 'ClashDisplay, sans-serif', fontWeight: 700, color: '#c4b5fd',
              flexShrink: 0,
            }}>AJ</div>
            <div style={{
              padding: '10px 16px', borderRadius: '4px 18px 18px 18px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      {/* ── INPUT BAR ────────────────────────── */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid rgba(139,92,246,0.1)',
        display: 'flex', gap: 10, alignItems: 'center',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.2) 0%, transparent 100%)',
        flexShrink: 0, position: 'relative', zIndex: 2,
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
            fontFamily: 'Satoshi, sans-serif', fontSize: 13.5,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: 14,
            padding: '11px 16px',
            color: 'rgba(255,255,255,0.88)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1), 0 0 20px rgba(139,92,246,0.15)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.15)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={!canSend}
          style={{
            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
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

      {/* Form-sent toast */}
      {formSent && (
        <div style={{
          position: 'absolute', bottom: 76, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(22,101,52,0.9), rgba(20,83,45,0.95))',
          border: '1px solid rgba(74,222,128,0.35)',
          borderRadius: 12, padding: '10px 18px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'msg-in 0.25s ease-out both',
          whiteSpace: 'nowrap', zIndex: 20,
        }}>
          <span style={{ fontSize: 14 }}>✓</span>
          <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, color: '#86efac' }}>
            Message sent to Arnav!
          </span>
        </div>
      )}
    </div>
  )
})
