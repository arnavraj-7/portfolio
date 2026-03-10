'use client'

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Center, useGLTF } from '@react-three/drei'
import { AjModel, ActionName } from './AjModel'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/* ─────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────── */
function GitHubIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.98-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

/* ─────────────────────────────────────────────────────
   3D AVATAR — uses window mousemove so head tracks
   everywhere regardless of pointer-events CSS
───────────────────────────────────────────────────── */
function AvatarScene({ onReady }: { onReady: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group>(null)
  const [anim, setAnim] = useState<ActionName>('BreathingIdle')
  // Manual mouse tracking via window — bypasses pointer-events:none
  const mousePos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (groupRef.current) {
        gsap.killTweensOf(groupRef.current.position)
        gsap.killTweensOf(groupRef.current.scale)
      }
      // Clear stale GLTF cache so next page load gets a fresh clone
      useGLTF.clear('/aj_portfolio.glb')
    }
  }, [])

  useEffect(() => {
    onReady()

    if (!groupRef.current) return

    // ── Set initial state IMPERATIVELY, not via JSX props ──
    // If position/scale are set as JSX props, R3F's reconciler resets them
    // on every re-render (e.g. when setAnim fires), undoing GSAP's work.
    gsap.killTweensOf(groupRef.current.position)
    gsap.killTweensOf(groupRef.current.scale)
    groupRef.current.position.set(0, -3, 0)
    groupRef.current.scale.set(0.8, 0.8, 0.8)

    gsap.to(groupRef.current.position, {
      y: -0.4, duration: 1.5, ease: 'power3.out', delay: 0.2,
    })
    gsap.to(groupRef.current.scale, {
      x: 1, y: 1, z: 1, duration: 1.3, ease: 'power3.out', delay: 0.2,
    })

    const wave = setTimeout(() => {
      setAnim('WavingGesture')
      setTimeout(() => setAnim('BreathingIdle'), 2600)
    }, 1800)

    return () => clearTimeout(wave)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    if (!modelRef.current) return
    const head = modelRef.current.getObjectByName('mixamorigHead')
    const mx = mousePos.current.x
    const my = mousePos.current.y
    if (head) {
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, mx * 0.35, 0.06)
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -my * 0.15, 0.06)
    } else {
      modelRef.current.rotation.y = THREE.MathUtils.lerp(
        modelRef.current.rotation.y, mx * 0.12, 0.05
      )
    }
  })

  return (
    <group ref={groupRef} position={[0, -3, 0]}>
      <group ref={modelRef}>
        <Center>
          <AjModel scale={0.035} animation={anim} />
        </Center>
      </group>
    </group>
  )
}

/* ─────────────────────────────────────────────────────
   ANIMATED BORDER BUTTON
───────────────────────────────────────────────────── */
function AnimatedBorderButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{ padding: '1px', display: 'inline-block' }}
    >
      <span
        className="animate-spin-border absolute pointer-events-none"
        style={{
          top: '50%',
          left: '50%',
          width: '260px',
          height: '260px',
          background:
            'conic-gradient(from 0deg, transparent 0%, transparent 50%, rgba(139,92,246,0.45) 62%, rgba(196,181,253,0.85) 73%, rgba(139,92,246,0.45) 82%, transparent 90%)',
        }}
      />
      <a
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          display: 'block',
          fontFamily: 'Satoshi, sans-serif',
          fontWeight: 500,
          fontSize: 14,
          background: hovered
            ? 'linear-gradient(135deg, #2d1260 0%, #1a0a40 100%)'
            : 'linear-gradient(135deg, #180d30 0%, #0f0822 100%)',
          borderRadius: '9999px',
          padding: '11px 26px',
          color: hovered ? '#fff' : 'rgba(255,255,255,0.85)',
          transition: 'background 0.3s, color 0.25s',
          zIndex: 1,
          cursor: 'pointer',
          boxShadow: hovered ? '0 0 28px rgba(139,92,246,0.35)' : 'none',
        }}
      >
        {children}
      </a>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────── */
export default function PortfolioPage() {
  const loaderRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const handleAvatarReady = useCallback(() => {}, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Prime GPU layers before animation starts
      gsap.set([navRef.current, '.hero-item'], {
        force3D: true,
        willChange: 'transform, opacity',
      })

      const tl = gsap.timeline({
        onComplete: () => {
          // Release will-change after animation to free GPU memory
          gsap.set([navRef.current, '.hero-item'], { willChange: 'auto' })
        },
      })

      tl.to(loaderRef.current, {
        opacity: 0,
        duration: 0.35,
        delay: 0.05,
        ease: 'power2.out',
        force3D: true,
        onComplete: () => {
          if (loaderRef.current) loaderRef.current.style.pointerEvents = 'none'
        },
      })

      tl.fromTo(
        navRef.current,
        { y: -12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', force3D: true },
        '-=0.05'
      )

      tl.fromTo(
        '.hero-item',
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.065,
          ease: 'power2.out',
          force3D: true,
        },
        '-=0.3'
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#06040F' }}>

      {/* ── LOADER ─────────────────────────────────── */}
      <div
        ref={loaderRef}
        className="fixed inset-0 z-200 flex items-center justify-center"
        style={{ background: '#06040F', pointerEvents: 'auto' }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          border: '2px solid rgba(139,92,246,0.12)',
          borderTopColor: '#a78bfa',
          animation: 'spin 0.85s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* ── BACKGROUND ─────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{ background: '#06040F' }} />

        {/* Horizon atmospheric glow */}
        <div
          className="absolute bottom-0 left-0 right-0 animate-horizon-glow"
          style={{
            height: '58vh',
            background: 'radial-gradient(ellipse 95% 68% at 50% 100%, rgba(109,40,217,0.75) 0%, rgba(76,29,149,0.45) 26%, rgba(49,17,97,0.15) 50%, transparent 70%)',
          }}
        />

        {/* Primary horizon arc */}
        <div
          className="absolute left-1/2 animate-horizon-arc"
          style={{
            bottom: '-18vh', width: '160vw', height: '52vh',
            borderRadius: '50%',
            border: '1px solid rgba(196,181,253,0.25)',
          }}
        />


        <div className="absolute inset-x-0 top-0 h-28"
          style={{ background: 'linear-gradient(to bottom, #06040F 0%, transparent 100%)' }} />
      </div>

      {/* ── 3D CANVAS ──────────────────────────────── */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0.3, 4], fov: 44 }}
          dpr={[1, 1.5]}
          frameloop="always"
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.NoToneMapping
            gl.setClearColor(0x000000, 0)
          }}
        >
          {/* ── Restored original lighting that worked ── */}
          <ambientLight intensity={1.5} />
          <directionalLight position={[0, 5, 5]} intensity={2} color="#ffffff" />
          <pointLight position={[0, 3, -2]} color="#a78bfa" intensity={12} />

          <Suspense fallback={null}>
            <AvatarScene onReady={handleAvatarReady} />
            <Environment preset="city" environmentIntensity={1.2} />
          </Suspense>
        </Canvas>
      </div>

      {/* ── NAVBAR ─────────────────────────────────── */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 opacity-0">
        <div className="max-w-350 mx-auto px-8 md:px-14 py-5 flex items-center justify-between">

          {/* Left — intentionally empty */}
          <div className="w-48 hidden md:block" />

          {/* Center — nav links */}
          <div className="flex items-center gap-10">
            {(['Work', 'About', 'Contact'] as const).map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className="nav-link text-sm transition-colors duration-300"
                style={{
                  fontFamily: 'Satoshi, sans-serif',
                  color: 'rgba(255,255,255,0.32)',
                  letterSpacing: '0.04em',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.32)')}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right — email */}
          <div className="w-48 hidden md:flex justify-end">
            <a
              href="mailto:arnavrajcodes@gmail.com"
              className="flex items-center gap-1.5 text-xs transition-all duration-300"
              style={{
                fontFamily: 'Satoshi, sans-serif',
                color: 'rgba(167,139,250,0.5)',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(196,181,253,1)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(167,139,250,0.5)')}
            >
              arnavrajcodes@gmail.com
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────── */}
      <main className="relative z-30">
        <section
          id="hero"
          className="relative min-h-screen"
          style={{ pointerEvents: 'none' }}
        >
          {/* 3-column grid: Left text | Center (avatar) | Right text */}
          <div
            className="max-w-350 mx-auto px-8 md:px-14 grid grid-cols-1 md:grid-cols-[1fr_340px_1fr] min-h-screen"
          >

            {/* ── LEFT COLUMN ─ name + socials ─── */}
            <div className="hidden md:flex flex-col justify-between pt-24 pb-16 pr-8">

              {/* Name block */}
              <div className="flex flex-col gap-3">
                <p
                  className="hero-item opacity-0 text-[11px] tracking-[0.3em] uppercase"
                  style={{
                    fontFamily: 'Satoshi, sans-serif',
                    color: 'rgba(167,139,250,0.7)',
                  }}
                >
                  Hello, I&apos;m
                </p>
                <h1
                  className="hero-item opacity-0 font-bold leading-[0.86] tracking-[-0.03em]"
                  style={{
                    fontFamily: 'ClashDisplay, sans-serif',
                    fontSize: 'clamp(52px, 6.5vw, 96px)',
                    color: '#ffffff',
                  }}
                >
                  Arnav
                  <br />
                  <span
                    style={{
                      WebkitTextStroke: '1.5px rgba(255,255,255,0.2)',
                      color: 'transparent',
                    }}
                  >
                    Raj
                  </span>
                </h1>
              </div>

              {/* Social icons + location — bottom-pinned */}
              <div
                className="hero-item opacity-0 flex flex-col gap-4 pb-10"
                style={{ pointerEvents: 'auto' }}
              >
                {[
                  { href: 'https://github.com/arnavraj-7', icon: <GitHubIcon />, label: 'GitHub' },
                  { href: 'https://www.linkedin.com/in/arnav-raj-7142b8313/', icon: <LinkedInIcon />, label: 'LinkedIn' },
                  { href: 'https://www.instagram.com/arnavraj.dev', icon: <InstagramIcon />, label: 'Instagram' },
                ].map(({ href, icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="transition-all duration-300"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.color = 'rgba(255,255,255,0.8)'
                      el.style.transform = 'translateX(3px)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.color = 'rgba(255,255,255,0.2)'
                      el.style.transform = 'translateX(0)'
                    }}
                  >
                    {icon}
                  </a>
                ))}

                {/* Divider + location grouped with socials */}
                <div
                  className="flex items-center gap-2 pt-1"
                  style={{ color: 'rgba(255,255,255,0.14)' }}
                >
                  <div className="w-4 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: 'rgba(167,139,250,0.5)', flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span
                    className="text-[9px] tracking-[0.3em] uppercase"
                    style={{ fontFamily: 'Satoshi, sans-serif' }}
                  >
                    India
                  </span>
                </div>
              </div>
            </div>

            {/* ── CENTER COLUMN ─ avatar lives here in canvas ── */}
            <div className="hidden md:block" />

            {/* ── RIGHT COLUMN ─ role + CTAs ─── */}
            <div className="hidden md:flex flex-col justify-between pt-24 pb-16 pl-8">

              {/* Top block — role + tagline + CTAs */}
              <div className="flex flex-col gap-7">
                {/* Role label */}
                <div
                  className="hero-item opacity-0 flex flex-col gap-1"
                  style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(255,255,255,0.22)' }}
                >
                  <span className="text-[10px] tracking-[0.3em] uppercase">Full Stack Developer</span>
                  <span className="text-[10px] tracking-[0.3em] uppercase">CPO @ Dreamvator</span>
                </div>

                {/* Divider */}
                <div className="hero-item opacity-0 w-8 h-px" style={{ background: 'rgba(139,92,246,0.35)' }} />

                {/* Tagline */}
                <p
                  className="hero-item opacity-0 text-[15px] leading-relaxed max-w-55"
                  style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(148,163,184,0.55)' }}
                >
                  Engineering digital experiences that matter.
                </p>

                {/* CTAs */}
                <div
                  className="hero-item opacity-0 flex flex-col gap-3 items-start"
                  style={{ pointerEvents: 'auto' }}
                >
                  <AnimatedBorderButton href="#work">View Work →</AnimatedBorderButton>
                  <a
                    href="mailto:arnavrajcodes@gmail.com"
                    className="flex items-center gap-2 text-sm transition-all duration-300"
                    style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(255,255,255,0.3)', paddingLeft: 2 }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'rgba(255,255,255,0.75)'; el.style.transform = 'translateX(4px)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'rgba(255,255,255,0.3)'; el.style.transform = 'translateX(0)' }}
                  >
                    Let&apos;s Connect
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>

            </div>

            {/* ── MOBILE LAYOUT (< md) ─────────────── */}
            <div
              className="flex md:hidden flex-col items-center text-center gap-5 pt-28 px-2"
              style={{ pointerEvents: 'none' }}
            >
              <p className="hero-item opacity-0 text-[10px] tracking-[0.3em] uppercase"
                style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(167,139,250,0.7)' }}>
                Hello, I&apos;m
              </p>
              <h1 className="hero-item opacity-0 font-bold leading-[0.88] tracking-[-0.03em]"
                style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(56px, 16vw, 88px)', color: '#fff' }}>
                Arnav<br />
                <span style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.2)', color: 'transparent' }}>Raj</span>
              </h1>
              <p className="hero-item opacity-0 text-[10px] tracking-[0.25em] uppercase"
                style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(255,255,255,0.22)' }}>
                Full Stack Developer · CPO @ Dreamvator
              </p>
              <p className="hero-item opacity-0 text-sm"
                style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(148,163,184,0.5)', maxWidth: 260 }}>
                Engineering digital experiences that matter.
              </p>
              {/* Spacer for avatar */}
              <div className="h-[45vw]" />
              <div className="hero-item opacity-0 flex flex-col gap-3 items-center" style={{ pointerEvents: 'auto' }}>
                <AnimatedBorderButton href="#work">View Work →</AnimatedBorderButton>
                <a href="mailto:arnavrajcodes@gmail.com" className="text-sm" style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(255,255,255,0.35)' }}>
                  Let&apos;s Connect →
                </a>
              </div>
              <div className="hero-item opacity-0 flex items-center gap-6 mt-2" style={{ pointerEvents: 'auto', color: 'rgba(255,255,255,0.2)' }}>
                <a href="https://github.com/arnavraj-7" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white"><GitHubIcon /></a>
                <a href="https://www.linkedin.com/in/arnav-raj-7142b8313/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white"><LinkedInIcon /></a>
                <a href="https://www.instagram.com/arnavraj.dev" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white"><InstagramIcon /></a>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="hero-item opacity-0 absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[9px] tracking-[0.4em] uppercase"
              style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(255,255,255,0.14)' }}>
              Scroll
            </span>
            <div className="w-px h-6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="w-full h-full" style={{
                background: 'linear-gradient(to bottom, rgba(139,92,246,0.7), transparent)',
                animation: 'scroll-line 1.9s ease-in-out infinite',
              }} />
            </div>
          </div>
        </section>

        {/* Placeholder */}
        <section id="work" className="min-h-screen flex items-center justify-center">
          <p className="text-[11px] tracking-widest uppercase"
            style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(255,255,255,0.06)' }}>
            Work section — coming next
          </p>
        </section>
      </main>
    </div>
  )
}
