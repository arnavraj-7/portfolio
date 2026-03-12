'use client'

import {
  Suspense,
  useEffect,
  useRef,
  useCallback,
  useState,
  memo,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { AjModel, AjModelHandle } from './AjModel'
import { TechStack } from './TechStack'
import { AiChat } from './AiChat'
import { CustomCursor } from './CustomCursor'
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
  const headBoneRef = useRef<THREE.Object3D | null>(null)
  const ajModelRef = useRef<AjModelHandle>(null)
  // Manual mouse tracking via window — bypasses pointer-events:none
  const mousePos = useRef({ x: 0, y: 0 })
  // 0 = hero (cursor tracking), 1 = work section (fixed look right)
  const scrollWeight = useRef(0)

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
    // on every re-render, undoing GSAP's work.
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll-driven: avatar slides left as work section enters
  useEffect(() => {
    if (!groupRef.current) return

    // Single continuous timeline: hero → work (left) → hold → about (right)
    // Three phases ensure avatar never overlaps the work cards:
    //   Phase 1 (15%): quickly slide left as work enters
    //   Hold   (55%): freeze at x=-2.6 while cards are fully visible
    //   Phase 2 (30%): slide right only during the spacer gap before about
    const posTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#work',
        start: 'top 90%',
        endTrigger: '#about',
        end: 'top 20%',
        scrub: 1.5,
      },
    })
    // Phase 1 (15%): snap to work position — x=-1.8 keeps avatar visible and closer to cards
    posTimeline
      .to(groupRef.current.position, { x: -2.2, ease: 'power2.out', duration: 0.15 })
      .to(groupRef.current.rotation, { y: 0.75, ease: 'power2.out', duration: 0.15 }, '<')
    // Hold (55%): stay left while work content is scrolled through
    posTimeline
      .to(groupRef.current.position, { x: -2.2, ease: 'none', duration: 0.55 })
      .to(groupRef.current.rotation, { y: 0.75, ease: 'none', duration: 0.55 }, '<')
    // Phase 2 (30%): cross to about position during the spacer gap
    posTimeline
      .to(groupRef.current.position, { x: 1.6, ease: 'power2.inOut', duration: 0.30 })
      .to(groupRef.current.rotation, { y: -0.5, ease: 'power2.inOut', duration: 0.30 }, '<')

    // Head tracking blend: 0 = cursor-follow, 1 = fixed look-right
    const headWeightIn = ScrollTrigger.create({
      trigger: '#work',
      start: 'top 90%',
      end: 'top 50%',
      onUpdate: (self) => { scrollWeight.current = self.progress },
      onLeaveBack: () => { scrollWeight.current = 0 },
    })
    const headWeightOut = ScrollTrigger.create({
      trigger: '#about',
      start: 'top 80%',
      end: 'top 40%',
      onUpdate: (self) => { scrollWeight.current = 1 - self.progress },
      onLeave: () => { scrollWeight.current = 0 },
    })

    // Animation triggers — imperative calls, no React state, no re-render
    const animTrigger = ScrollTrigger.create({
      trigger: '#work',
      start: 'top 20%',
      onEnter: () => {
        ajModelRef.current?.playAnimation('ThumbsUp')
        setTimeout(() => ajModelRef.current?.playAnimation('BreathingIdle'), 2500)
      },
      onLeaveBack: () => ajModelRef.current?.playAnimation('BreathingIdle'),
    })

    const aboutAnimTrigger = ScrollTrigger.create({
      trigger: '#about',
      start: 'top 60%',
      onEnter: () => {
        ajModelRef.current?.playAnimation('WavingGesture')
        setTimeout(() => ajModelRef.current?.playAnimation('BreathingIdle'), 2600)
      },
      onLeaveBack: () => ajModelRef.current?.playAnimation('BreathingIdle'),
    })

    // Kill posTimeline when AI section enters so it doesn't fight the fade
    const aiEnterTrigger = ScrollTrigger.create({
      trigger: '#ai',
      start: 'top 80%',
      onEnter: () => posTimeline.kill(),
      onLeaveBack: () => ajModelRef.current?.playAnimation('BreathingIdle'),
    })

    return () => {
      posTimeline.kill()
      headWeightIn.kill()
      headWeightOut.kill()
      animTrigger.kill()
      aboutAnimTrigger.kill()
      aiEnterTrigger.kill()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    if (!modelRef.current) return

    // Cache head bone — avoids scene graph traversal every frame
    if (!headBoneRef.current) {
      headBoneRef.current = modelRef.current.getObjectByName('mixamorigHead') ?? null
    }

    // ── Head tracking (cursor follow / blend with scroll weight) ──────────
    const head = headBoneRef.current
    const mx = mousePos.current.x
    const my = mousePos.current.y
    const w = scrollWeight.current

    if (head) {
      const targetY = THREE.MathUtils.lerp(mx * 0.35, 0.3, w)
      const targetX = THREE.MathUtils.lerp(-my * 0.15, 0, w)
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetY, 0.06)
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetX, 0.06)
    } else {
      const targetY = THREE.MathUtils.lerp(mx * 0.12, 0.2, w)
      modelRef.current.rotation.y = THREE.MathUtils.lerp(
        modelRef.current.rotation.y, targetY, 0.05
      )
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={modelRef}>
        <AjModel ref={ajModelRef} scale={0.018} />
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
   PROJECTS DATA
───────────────────────────────────────────────────── */
const PROJECTS = [
  {
    num: '01',
    name: 'Dreamvator',
    type: 'Stealth Startup',
    desc: 'Something revolutionary is coming. Stay tuned.',
    stack: ['Launching soon'],
    url: 'https://www.dreamvator.com',
    year: '2026',
    screenshot: '/previews/dreamvator.png',
    preview: {
      bg: 'linear-gradient(135deg, #0f0020 0%, #2d1260 55%, #1a0a40 100%)',
      domain: 'dreamvator.com',
      accent: '#a78bfa',
    },
  },
  {
    num: '02',
    name: 'CrowdSpark',
    type: 'Web3 / DeFi Protocol',
    desc: 'A trustless crowdfunding protocol built on Ethereum. Custom Solidity escrow contract handles goal-based fund release, IPFS metadata storage via Pinata, and event-driven real-time updates — no middle-men.',
    stack: ['Next.js', 'Solidity', 'Ethereum', 'IPFS', 'Pinata', 'TypeScript'],
    url: 'https://crowd-spark-ten.vercel.app',
    year: '2025',
    screenshot: '/previews/crowdspark.png',
    preview: {
      bg: 'linear-gradient(135deg, #020b14 0%, #0a1f3a 50%, #0d2b50 100%)',
      domain: 'crowd-spark-ten.vercel.app',
      accent: '#38bdf8',
    },
  },
  {
    num: '03',
    name: 'Odd Planet',
    type: 'Marketing Agency',
    desc: 'A striking marketing agency website crafted for brand identity and conversion.',
    stack: ['Next.js', 'Vercel'],
    url: 'https://oddplanet.vercel.app/',
    year: '2026',
    screenshot: '/previews/oddplanet.png',
    preview: {
      bg: 'linear-gradient(135deg, #050510 0%, #0d1b2a 50%, #162032 100%)',
      domain: 'oddplanet.vercel.app',
      accent: '#60a5fa',
    },
  },
]


const TECH_ITEMS = [
  { icon: 'devicon-react-original colored',         name: 'React' },
  { icon: 'devicon-nextjs-plain',                   name: 'Next.js' },
  { icon: 'devicon-nodejs-plain colored',           name: 'Node.js' },
  { icon: 'devicon-express-original',               name: 'Express' },
  { icon: '',  img: '/react-native.png',            name: 'React Native' },
  { icon: 'devicon-mysql-plain colored',            name: 'MySQL' },
  { icon: 'devicon-typescript-plain colored',       name: 'TypeScript' },
  { icon: 'devicon-javascript-plain colored',       name: 'JavaScript' },
]

/* ─────────────────────────────────────────────────────
   AVATAR CANVAS — memoized so page state (hover, etc.)
   never triggers a Canvas re-render and interrupts R3F
───────────────────────────────────────────────────── */
const AvatarCanvas = memo(function AvatarCanvas({ onReady }: { onReady: () => void }) {
  return (
    <div id="avatar-canvas-wrapper" className="avatar-canvas hidden md:block fixed inset-0 z-40 pointer-events-none">
      <Canvas
        style={{ pointerEvents: 'none' }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.3, 4], fov: 44 }}
        dpr={1}
        frameloop="always"
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping
          gl.setClearColor(0x000000, 0)
        }}
      >
        <ambientLight intensity={2.2} />
        <directionalLight position={[2, 6, 4]} intensity={2.5} color="#ffffff" />
        <directionalLight position={[-2, 2, -2]} intensity={0.6} color="#c4b5fd" />
        <pointLight position={[0, 3, -2]} color="#a78bfa" intensity={10} />
        <Suspense fallback={null}>
          <AvatarScene onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  )
})

/* ─────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────── */
export default function PortfolioPage() {
  const loaderRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const handleAvatarReady = useCallback(() => {}, [])

  // Don't mount main 3D canvas on mobile — prevents dual-WebGL-context texture corruption
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768)
    const onResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Avatar fade — registered AFTER isDesktop is confirmed so the canvas is in the DOM
  useEffect(() => {
    if (!isDesktop) return
    const ctx = gsap.context(() => {
      gsap.to('.avatar-canvas', {
        opacity: 0,
        ease: 'power2.in',
        scrollTrigger: { trigger: '#ai', start: 'top 100%', end: 'top 35%', scrub: 1 },
      })
    })
    return () => ctx.revert()
  }, [isDesktop])

  // ── Contact form state ────────────────────────────
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // ── Hover preview for work cards ──────────────────
  const [hoveredWork, setHoveredWork] = useState<number | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const previewMouseRef = useRef({ x: 0, y: 0 })
  const previewPosRef = useRef({ x: -999, y: -999 })

  useEffect(() => {
    let rafId: number
    const animate = () => {
      previewPosRef.current.x += (previewMouseRef.current.x - previewPosRef.current.x) * 0.1
      previewPosRef.current.y += (previewMouseRef.current.y - previewPosRef.current.y) * 0.1
      if (previewRef.current) {
        previewRef.current.style.left = (previewPosRef.current.x + 30) + 'px'
        previewRef.current.style.top = (previewPosRef.current.y - 95) + 'px'
      }
      rafId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(rafId)
  }, [])

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

      // Navbar fades out as user starts scrolling
      gsap.to(navRef.current, {
        opacity: 0,
        y: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '18% top',
          scrub: 1,
        },
      })

      // Multi-layer depth parallax — each layer moves at a different rate
      // Far layer (slowest) — feels like it's in the distance
      gsap.to('.parallax-far', {
        y: -40, ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true },
      })
      // Mid layer — main horizon glow
      gsap.to('.horizon-glow', {
        y: -110, ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true },
      })
      // Arc — slightly faster than glow for separation
      gsap.to('.horizon-arc', {
        y: -70, ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true },
      })
      // Near layer (fastest) — feels like it floats in front
      gsap.to('.parallax-near', {
        y: -200, ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true },
      })

      // Hero exit on scroll — left col drifts left, right col drifts right
      gsap.to('.hero-left', {
        x: -28, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: '35% top', scrub: 1 },
      })
      gsap.to('.hero-right', {
        x: 28, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: '35% top', scrub: 1 },
      })

      // ── SECTION STACKING — each section scales/dims as the next one slides over it ──
      // about → AI
      gsap.to('#about', {
        scale: 0.94, opacity: 0.4, ease: 'none',
        scrollTrigger: { trigger: '#ai', start: 'top 80%', end: 'top 10%', scrub: 1.2 },
      })
      // AI → tech
      gsap.to('#ai', {
        scale: 0.94, opacity: 0.4, ease: 'none',
        scrollTrigger: { trigger: '#tech', start: 'top 80%', end: 'top 10%', scrub: 1.2 },
      })
      // tech → contact
      gsap.to('#tech', {
        scale: 0.94, opacity: 0.4, ease: 'none',
        scrollTrigger: { trigger: '#contact', start: 'top 80%', end: 'top 10%', scrub: 1.2 },
      })
      // contact → footer
      gsap.to('#contact', {
        scale: 0.94, opacity: 0.4, ease: 'none',
        scrollTrigger: { trigger: 'footer', start: 'top 80%', end: 'top 10%', scrub: 1.2 },
      })

      const rv = 'play none none reverse' // reverse on scroll-up for all reveals

      // Work section entrance
      gsap.fromTo('.work-heading',
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.work-heading', start: 'top 88%', toggleActions: rv } }
      )
      gsap.fromTo('.work-card',
        { x: 32, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out', scrollTrigger: { trigger: '.work-card', start: 'top 88%', toggleActions: rv } }
      )

      // About — headings slide in from left, items stagger up with clear rhythm
      gsap.fromTo('.about-heading',
        { x: -28, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.75, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '#about', start: 'top 80%', toggleActions: rv } }
      )
      gsap.fromTo('.about-item',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.14, ease: 'power2.out', scrollTrigger: { trigger: '#about', start: 'top 65%', toggleActions: rv } }
      )

      // AI chat section
      gsap.fromTo('.ai-heading',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.ai-heading', start: 'top 88%', toggleActions: rv } }
      )
      gsap.fromTo('.ai-body',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.ai-body', start: 'top 88%', toggleActions: rv } }
      )

      // Tech stack heading
      gsap.fromTo('.tech-heading',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.tech-heading', start: 'top 88%', toggleActions: rv } }
      )

      // Contact — left col slides from left, form card slides from right
      gsap.fromTo('.contact-left',
        { x: -32, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.75, ease: 'power3.out', scrollTrigger: { trigger: '#contact', start: 'top 82%', toggleActions: rv } }
      )
      gsap.fromTo('.contact-card',
        { x: 32, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.75, ease: 'power3.out', scrollTrigger: { trigger: '#contact', start: 'top 82%', toggleActions: rv } }
      )
      gsap.fromTo('.contact-field',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: '#contact', start: 'top 68%', toggleActions: rv } }
      )

      // Footer
      gsap.fromTo('.footer-cta',
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', scrollTrigger: { trigger: 'footer', start: 'top 88%', toggleActions: rv } }
      )
      gsap.fromTo('.footer-meta',
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: 'footer', start: 'top 55%', toggleActions: rv } }
      )

      // Recalculate all scroll trigger positions after a tick —
      // ensures contact/footer triggers are correct after any DOM changes
      ScrollTrigger.refresh()
    })
    return () => ctx.revert()
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#06040F', cursor: 'none' }}>
      <div className="hidden md:block"><CustomCursor /></div>

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

        {/* Far depth layer — slow mover, deep violet haze */}
        <div className="parallax-far absolute bottom-0 left-0 right-0" style={{
          height: '45vh',
          background: 'radial-gradient(ellipse 120% 60% at 50% 100%, rgba(76,29,149,0.35) 0%, transparent 70%)',
        }} />

        {/* Horizon atmospheric glow — mid layer */}
        <div
          className="horizon-glow absolute bottom-0 left-0 right-0 animate-horizon-glow"
          style={{
            height: '58vh',
            background: 'radial-gradient(ellipse 95% 68% at 50% 100%, rgba(109,40,217,0.75) 0%, rgba(76,29,149,0.45) 26%, rgba(49,17,97,0.15) 50%, transparent 70%)',
          }}
        />

        {/* Primary horizon arc */}
        <div
          className="horizon-arc absolute left-1/2 animate-horizon-arc"
          style={{
            bottom: '-18vh', width: '160vw', height: '52vh',
            borderRadius: '50%',
            border: '1px solid rgba(196,181,253,0.09)',
            boxShadow: '0 -12px 60px rgba(139,92,246,0.5), 0 -32px 120px rgba(109,40,217,0.25), inset 0 28px 80px rgba(109,40,217,0.18)',
          }}
        />

        {/* Near depth layer — fastest mover, subtle side orbs */}
        <div className="parallax-near absolute pointer-events-none" style={{
          bottom: '10vh', left: '-10vw', width: '50vw', height: '50vh',
          background: 'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(139,92,246,0.12) 0%, transparent 70%)',
        }} />
        <div className="parallax-near absolute pointer-events-none" style={{
          bottom: '5vh', right: '-8vw', width: '45vw', height: '45vh',
          background: 'radial-gradient(ellipse 55% 45% at 80% 90%, rgba(109,40,217,0.1) 0%, transparent 70%)',
        }} />

        <div className="absolute inset-x-0 top-0 h-28"
          style={{ background: 'linear-gradient(to bottom, #06040F 0%, transparent 100%)' }} />
      </div>

      {/* ── SECTION OVERLAY — softens horizon blob + darkens bg for sections below hero ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: 'linear-gradient(to bottom, transparent 58vh, rgba(4,2,12,0.48) 90vh, rgba(4,2,12,0.68) 115vh, rgba(4,2,12,0.68) 100%)',
        }}
      />

      {/* ── 3D CANVAS — only on desktop; mobile uses MobileAvatarCircle ── */}
      {isDesktop && <AvatarCanvas onReady={handleAvatarReady} />}

      {/* ── NAVBAR ─────────────────────────────────── */}
      <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 opacity-0">
        <div className="max-w-350 mx-auto px-8 md:px-14 py-5 flex items-center justify-between">

          {/* Left — intentionally empty */}
          <div className="w-48 hidden md:block" />

          {/* Center — nav links */}
          <div className="flex items-center gap-10">
            {(['Work', 'About', 'AI', 'Contact'] as const).map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase() === 'ai' ? 'ai' : label.toLowerCase()}`}
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
            <div className="hero-left hidden md:flex flex-col justify-between pt-24 pb-16 pr-8">

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
                  style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(52px, 6.5vw, 96px)', color: '#ffffff' }}
                >
                  {'Arnav'.split('').map((ch, i) => (
                    <span key={i} className="name-letter" style={{ animationDelay: `${i * 0.12}s` }}>{ch}</span>
                  ))}
                  <br />
                  <span style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.2)', color: 'transparent' }}>
                    {'Raj'.split('').map((ch, i) => (
                      <span key={i} className="name-letter" style={{ animationDelay: `${(i + 5) * 0.12}s`, WebkitTextStroke: 'inherit', color: 'inherit' }}>{ch}</span>
                    ))}
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
                    style={{ color: 'rgba(255,255,255,0.2)', display: 'inline-flex', lineHeight: 0 }}
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

              </div>
            </div>

            {/* ── CENTER COLUMN ─ avatar lives here in canvas ── */}
            <div className="hidden md:block" />

            {/* ── RIGHT COLUMN ─ role + CTAs ─── */}
            <div className="hero-right hidden md:flex flex-col pt-24 pb-16 pl-16">

              {/* Top block — role + divider + tagline + CTAs */}
              <div className="flex flex-col gap-7">
                <div
                  className="hero-item opacity-0 flex flex-col gap-1"
                  style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(255,255,255,0.22)' }}
                >
                  <span className="text-[10px] tracking-[0.3em] uppercase">Full Stack Developer</span>
                  <span className="text-[10px] tracking-[0.3em] uppercase">CPO @ Dreamvator</span>
                </div>

                <div className="hero-item opacity-0 w-8 h-px" style={{ background: 'rgba(139,92,246,0.35)' }} />

                <p
                  className="hero-item opacity-0 text-[15px] leading-relaxed max-w-55"
                  style={{ fontFamily: 'Satoshi, sans-serif', color: 'rgba(148,163,184,0.55)' }}
                >
                  Engineering digital experiences that matter.
                </p>

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

                {/* India */}
                <div
                  className="hero-item opacity-0 flex items-center gap-2 pt-1"
                  style={{ color: 'rgba(255,255,255,0.14)' }}
                >
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
                {'Arnav'.split('').map((ch, i) => (
                  <span key={i} className="name-letter" style={{ animationDelay: `${i * 0.12}s` }}>{ch}</span>
                ))}<br />
                <span style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.2)', color: 'transparent' }}>
                  {'Raj'.split('').map((ch, i) => (
                    <span key={i} className="name-letter" style={{ animationDelay: `${(i + 5) * 0.12}s`, WebkitTextStroke: 'inherit', color: 'inherit' }}>{ch}</span>
                  ))}
                </span>
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

        {/* ── WORK SECTION ───────────────────────── */}
        <section id="work" className="relative min-h-screen md:min-h-[160vh]">
          <div className="max-w-350 mx-auto px-8 md:px-14 pt-20 md:pt-[42vh] pb-16 md:pb-28">
            <div className="md:pl-[30%] w-full">

              {/* Section header */}
              <div className="work-heading" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.45)', marginBottom: 12 }}>
                    Selected Work
                  </p>
                  <h2 style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(44px, 5vw, 68px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: 'rgba(255,255,255,0.9)' }}>
                    Work.
                  </h2>
                </div>
                <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.14)', letterSpacing: '0.08em', paddingBottom: 6 }}>
                  2024—2025
                </span>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'linear-gradient(to right, rgba(139,92,246,0.4), rgba(255,255,255,0.04) 60%, transparent)', marginBottom: 0 }} />

              {/* Project rows */}
              {PROJECTS.map((p, i) => (
                <div
                  key={p.num}
                  className="work-card group"
                  style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '40px 0', transition: 'background 0.4s', cursor: p.url ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHoveredWork(i)}
                  onMouseLeave={() => setHoveredWork(null)}
                  onMouseMove={(e) => { previewMouseRef.current = { x: e.clientX, y: e.clientY } }}
                >
                  {/* Stretched link — makes entire card clickable */}
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${p.name}`}
                      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                    />
                  )}
                  {/* Ghost large number */}
                  <span aria-hidden style={{
                    position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                    fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(80px, 10vw, 130px)', fontWeight: 700,
                    color: hoveredWork === i ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.025)',
                    letterSpacing: '-0.05em', lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
                    transition: 'color 0.4s',
                  }}>{p.num}</span>

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Meta row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, fontWeight: 600, color: 'rgba(167,139,250,0.6)', letterSpacing: '0.1em' }}>
                          /{p.num}
                        </span>
                        <span style={{
                          fontFamily: 'Satoshi, sans-serif', fontSize: 9, letterSpacing: '0.3em',
                          textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 999, padding: '2px 9px',
                        }}>
                          {p.type}
                        </span>
                        <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.14)', marginLeft: 'auto' }}>
                          {p.year}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 style={{
                        fontFamily: 'ClashDisplay, sans-serif',
                        fontSize: 'clamp(26px, 3.2vw, 44px)',
                        fontWeight: 700, letterSpacing: '-0.03em',
                        color: p.url ? (hoveredWork === i ? '#fff' : 'rgba(255,255,255,0.82)') : 'rgba(255,255,255,0.2)',
                        marginBottom: p.desc ? 12 : 0,
                        transition: 'color 0.3s',
                      }}>{p.name}</h3>

                      {/* Description */}
                      {p.desc && (
                        <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, lineHeight: 1.7, color: 'rgba(148,163,184,0.45)', maxWidth: 'min(380px, 100%)', marginBottom: 16 }}>
                          {p.desc}
                        </p>
                      )}

                      {/* Stack */}
                      {p.stack.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {p.stack.map(tag => (
                            <span key={tag} style={{
                              fontFamily: 'Satoshi, sans-serif', fontSize: 10,
                              padding: '3px 10px', borderRadius: 999,
                              background: hoveredWork === i ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: hoveredWork === i ? 'rgba(196,181,253,0.8)' : 'rgba(255,255,255,0.28)',
                              letterSpacing: '0.04em', transition: 'all 0.3s',
                            }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Visit */}
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                        style={{
                          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 44, height: 44, borderRadius: '50%',
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: hoveredWork === i ? 'rgba(139,92,246,0.15)' : 'transparent',
                          color: hoveredWork === i ? '#c4b5fd' : 'rgba(255,255,255,0.25)',
                          transition: 'all 0.3s', pointerEvents: 'auto', marginTop: 4, position: 'relative', zIndex: 1,
                        }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(139,92,246,0.3)'; el.style.borderColor = 'rgba(167,139,250,0.5)'; el.style.color = '#fff' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = hoveredWork === i ? 'rgba(139,92,246,0.15)' : 'transparent'; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.color = hoveredWork === i ? '#c4b5fd' : 'rgba(255,255,255,0.25)' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17L17 7M17 7H7M17 7v10" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cursor-following hover preview ── */}
          <div
            ref={previewRef}
            className="hidden md:block"
            style={{
              position: 'fixed', top: 0, left: 0, width: 264, height: 174,
              borderRadius: 14, overflow: 'hidden', pointerEvents: 'none', zIndex: 50,
              display: 'flex', flexDirection: 'column',
              opacity: hoveredWork !== null && PROJECTS[hoveredWork].url ? 1 : 0,
              transform: `scale(${hoveredWork !== null && PROJECTS[hoveredWork].url ? 1 : 0.88})`,
              transition: 'opacity 0.25s, transform 0.25s',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)',
            }}
          >
            {hoveredWork !== null && PROJECTS[hoveredWork].url && (() => {
              const proj = PROJECTS[hoveredWork]
              const prev = proj.preview
              return (
                <>
                  {/* Browser chrome */}
                  <div style={{ background: 'rgba(10,8,22,0.98)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5f57', flexShrink: 0 }} />
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffbd2e', flexShrink: 0 }} />
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#28ca42', flexShrink: 0 }} />
                    <div style={{ flex: 1, margin: '0 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '2px 8px', textAlign: 'center', overflow: 'hidden' }}>
                      <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                        {prev?.domain ?? proj.url?.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                  </div>

                  {/* Screenshot body */}
                  <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: prev?.bg ?? '#0a0818' }}>
                    {proj.screenshot && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={proj.screenshot}
                        alt={`${proj.name} preview`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                      />
                    )}
                    {/* Bottom gradient overlay with project name */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(to top, rgba(6,4,15,0.92) 0%, rgba(6,4,15,0.4) 60%, transparent 100%)',
                      padding: '12px 14px 10px',
                    }}>
                      <span style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                        {proj.name}
                      </span>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </section>
        {/* ── WORK → ABOUT SPACER — gives avatar room to travel ── */}
        <div className="h-6 md:h-[40vh]" />

        {/* ── ABOUT SECTION ──────────────────────── */}
        <section id="about" className="relative min-h-screen py-16 md:py-28" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <div className="max-w-350 mx-auto px-8 md:px-14 pt-10 md:pt-[45vh]">
            <div className="md:pr-[48%]">

              {/* Label */}
              <p className="about-heading" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.45)', marginBottom: 20 }}>
                About Me
              </p>

              {/* Large heading */}
              <h2 className="about-heading" style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.02, color: 'rgba(255,255,255,0.92)', marginBottom: 28 }}>
                A builder<br />
                <span style={{ WebkitTextStroke: '1px rgba(255,255,255,0.18)', color: 'transparent' }}>at heart.</span>
              </h2>

              {/* Divider */}
              <div className="about-item" style={{ width: 40, height: 1, background: 'rgba(139,92,246,0.5)', marginBottom: 28 }} />

              {/* Bio */}
              <p className="about-item" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 14, lineHeight: 1.85, color: 'rgba(148,163,184,0.6)', marginBottom: 36 }}>
                I&apos;m Arnav — a full-stack developer and CPO at Dreamvator from India. I care about clean code, thoughtful UI, and the space where product thinking meets engineering.
              </p>

              {/* Currently */}
              <div className="about-item" style={{ marginBottom: 36, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a
                  href="https://www.dreamvator.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', borderRadius: 10,
                    border: '1px solid rgba(139,92,246,0.2)',
                    background: 'rgba(139,92,246,0.07)',
                    pointerEvents: 'auto', textDecoration: 'none',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(167,139,250,0.45)'; el.style.background = 'rgba(139,92,246,0.14)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(139,92,246,0.2)'; el.style.background = 'rgba(139,92,246,0.07)' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0, boxShadow: '0 0 8px rgba(74,222,128,0.7)' }} />
                  <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
                    Currently building
                  </span>
                  <span style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 13, fontWeight: 600, color: 'rgba(196,181,253,0.9)', letterSpacing: '-0.01em' }}>
                    Dreamvator
                  </span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    India
                  </span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>
                    Open to freelance &amp; collabs
                  </span>
                </div>
              </div>

              {/* What I do */}
              <div className="about-item" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 28 }}>
                <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.4)', marginBottom: 18 }}>
                  What I do
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    'Full-stack Web & App Development',
                    'Product Strategy & Roadmapping',
                    'Crafting interactions that feel alive',
                    'Integrating AI to power smarter products',
                  ].map((item, i) => (
                    <div key={item} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.42)',
                      padding: '11px 0',
                      borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                      <span style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 10, color: 'rgba(139,92,246,0.5)', letterSpacing: '0.1em' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── AI CHAT SECTION ────────────────────── */}
        <section id="ai" className="relative min-h-screen" style={{ background: '#06040f', position: 'sticky', top: 0, zIndex: 20, borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(139,92,246,0.15)' }}>
          <div className="max-w-350 mx-auto px-8 md:px-14 py-28 md:pt-[18vh]">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

              {/* Label */}
              <p className="ai-heading" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.45)', marginBottom: 16 }}>
                Ask Arnav&apos;s AI
              </p>

              {/* Heading */}
              <h2 className="ai-heading" style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(36px, 4.5vw, 60px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.0, color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>
                Chat with<br />
                <span style={{ WebkitTextStroke: '1px rgba(255,255,255,0.18)', color: 'transparent' }}>my AI.</span>
              </h2>

              {/* Sub */}
              <p className="ai-heading" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'rgba(148,163,184,0.45)', lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
                Powered by Gemini 2.5 — ask about my projects, stack, or how to work together.
              </p>

              {/* Chat widget */}
              <div className="ai-body" style={{ pointerEvents: 'auto', width: '100%', display: 'flex', justifyContent: 'center', textAlign: 'left' }}>
                <AiChat />
              </div>

            </div>
          </div>
        </section>

        {/* ── TECH STACK SECTION ─────────────────── */}
        <section id="tech" className="relative" style={{ background: '#06040f', overflow: 'hidden', position: 'sticky', top: 0, zIndex: 30, borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(139,92,246,0.12)' }}>
          {/* Heading */}
          <div className="max-w-350 mx-auto px-8 md:px-14 pt-24 pb-6">
            <div className="tech-heading">
              <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.45)', marginBottom: 14 }}>
                Tools &amp; Technologies
              </p>
              <h2 style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: 'rgba(255,255,255,0.88)' }}>
                The Stack.
              </h2>
              <p className="hidden md:block" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'rgba(148,163,184,0.45)', marginTop: 14, lineHeight: 1.6 }}>
                Drag the spheres around — each one is a tech I work with.
              </p>
              <p className="md:hidden" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'rgba(148,163,184,0.45)', marginTop: 14, lineHeight: 1.6 }}>
                The tools I build with.
              </p>
            </div>
          </div>

          {/* Mobile: icon grid */}
          <div className="md:hidden px-8 pt-2 pb-16">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {TECH_ITEMS.map(({ icon, img, name }) => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 16,
                    background: 'rgba(139,92,246,0.06)',
                    border: '1px solid rgba(139,92,246,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {img
                      ? <img src={img} alt={name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                      : <i className={icon} style={{ fontSize: 32 }} />
                    }
                  </div>
                  <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 9, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.05em', textAlign: 'center' }}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Physics canvas */}
          <div className="hidden md:block" style={{ width: '100%', height: '90vh', position: 'relative' }}>
            <TechStack />
          </div>
        </section>

        {/* ── CONTACT SECTION ────────────────────── */}
        <section id="contact" className="relative py-24" style={{ pointerEvents: 'auto', background: '#06040f', overflow: 'hidden', position: 'sticky', top: 0, zIndex: 40, borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(139,92,246,0.12)' }}>
          <div className="max-w-350 mx-auto px-8 md:px-14">

            {/* Split layout: left info | right form */}
            <div className="contact-heading grid grid-cols-1 md:grid-cols-[5fr_6fr] gap-14 md:gap-16 items-start">

              {/* LEFT — headline + contact info */}
              <div className="contact-left" style={{ paddingTop: 8 }}>
                <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.45)', marginBottom: 20 }}>
                  Get In Touch
                </p>
                <h2 style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(36px, 4.5vw, 58px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.0, color: 'rgba(255,255,255,0.9)', marginBottom: 24 }}>
                  Let&apos;s build<br />
                  <span style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)', color: 'transparent' }}>something.</span>
                </h2>
                <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'rgba(148,163,184,0.5)', lineHeight: 1.75, marginBottom: 40, maxWidth: 300 }}>
                  Have a project in mind, a collab idea, or just want to say hi? I read every message.
                </p>

                {/* Direct email */}
                <a href="mailto:arnavrajcodes@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 28, transition: 'all 0.25s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.7' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(167,139,250,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 2 }}>Email</div>
                    <div style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>arnavrajcodes@gmail.com</div>
                  </div>
                </a>

                {/* Socials — hidden on mobile (shown in footer) */}
                <div className="hidden md:flex" style={{ gap: 10 }}>
                  {[
                    { href: 'https://github.com/arnavraj-7', icon: <GitHubIcon />, label: 'GitHub' },
                    { href: 'https://www.linkedin.com/in/arnav-raj-7142b8313/', icon: <LinkedInIcon />, label: 'LinkedIn' },
                    { href: 'https://www.instagram.com/arnavraj.dev', icon: <InstagramIcon />, label: 'Instagram' },
                  ].map(({ href, icon, label }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'all 0.25s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(167,139,250,0.5)'; el.style.color = '#c4b5fd'; el.style.background = 'rgba(139,92,246,0.1)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.color = 'rgba(255,255,255,0.3)'; el.style.background = 'transparent' }}
                    >{icon}</a>
                  ))}
                </div>
              </div>

              {/* RIGHT — form */}
              <div className="contact-card">
              <form
                className="contact-form"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setFormStatus('sending')
                  const form = e.currentTarget
                  const data = {
                    access_key: '715d3934-7f7f-4a64-bb69-d98ab915650c',
                    name: (form.elements.namedItem('name') as HTMLInputElement).value,
                    email: (form.elements.namedItem('email') as HTMLInputElement).value,
                    message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
                    subject: 'New message from portfolio',
                  }
                  try {
                    const res = await fetch('https://api.web3forms.com/submit', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                      body: JSON.stringify(data),
                    })
                    const json = await res.json()
                    setFormStatus(json.success ? 'sent' : 'error')
                    if (json.success) form.reset()
                  } catch {
                    setFormStatus('error')
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
              >
                {/* Underline inputs */}
                {(['name', 'email'] as const).map((field) => (
                  <div key={field} className="contact-field" style={{ position: 'relative', marginBottom: 32 }}>
                    <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.5)', display: 'block', marginBottom: 10 }}>
                      {field === 'name' ? 'Your Name' : 'Email Address'}
                    </label>
                    <input
                      name={field}
                      type={field === 'email' ? 'email' : 'text'}
                      placeholder={field === 'name' ? 'Arnav Raj' : 'you@example.com'}
                      required
                      style={{
                        fontFamily: 'Satoshi, sans-serif', fontSize: 15, fontWeight: 500,
                        background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)',
                        padding: '8px 0', color: 'rgba(255,255,255,0.85)', outline: 'none', width: '100%',
                        transition: 'border-color 0.25s',
                      }}
                      onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.7)' }}
                      onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                    />
                  </div>
                ))}
                <div className="contact-field" style={{ position: 'relative', marginBottom: 36 }}>
                  <label style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.5)', display: 'block', marginBottom: 10 }}>
                    Message
                  </label>
                  <textarea
                    name="message"
                    placeholder="What are you building?"
                    required rows={4}
                    style={{
                      fontFamily: 'Satoshi, sans-serif', fontSize: 14,
                      background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)',
                      padding: '8px 0', color: 'rgba(255,255,255,0.85)', outline: 'none', resize: 'none', width: '100%',
                      transition: 'border-color 0.25s',
                    }}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.7)' }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                  />
                </div>
                {formStatus === 'sent' ? (
                  <div style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.7)', flexShrink: 0 }} />
                    Message sent — I&apos;ll get back to you soon.
                  </div>
                ) : (
                  <button type="submit" disabled={formStatus === 'sending'}
                    className="contact-submit-btn"
                    style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', padding: '14px 36px', borderRadius: 999, background: 'linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(109,40,217,0.28) 100%)', border: '1px solid rgba(139,92,246,0.4)', color: formStatus === 'error' ? '#fca5a5' : 'rgba(196,181,253,0.95)', cursor: formStatus === 'sending' ? 'default' : 'pointer', alignSelf: 'flex-start', transition: 'all 0.25s ease', opacity: formStatus === 'sending' ? 0.6 : 1 }}
                    onMouseEnter={e => { if (formStatus === 'sending') return; const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.4) 0%, rgba(109,40,217,0.5) 100%)'; el.style.borderColor = 'rgba(167,139,250,0.7)'; el.style.color = '#fff'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 30px rgba(139,92,246,0.3)' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(109,40,217,0.28) 100%)'; el.style.borderColor = 'rgba(139,92,246,0.4)'; el.style.color = formStatus === 'error' ? '#fca5a5' : 'rgba(196,181,253,0.95)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
                  >
                    {formStatus === 'sending' ? 'Sending...' : formStatus === 'error' ? 'Failed — try again →' : 'Send Message →'}
                  </button>
                )}
              </form>
              </div>{/* end card wrapper */}

            </div>
          </div>
        </section>

                {/* ── FOOTER ─────────────────────────────── */}
        <footer style={{ background: '#06040f', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle top glow */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.35), transparent)' }} />

          {/* Main footer body */}
          <div className="max-w-350 mx-auto px-6 md:px-14" style={{ paddingTop: 56, paddingBottom: 32 }}>

            {/* Big CTA row */}
            <div className="footer-cta" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap', marginBottom: 64 }}>

              {/* Left — big type */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <h2 style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(38px, 5vw, 72px)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.05, color: 'rgba(255,255,255,0.88)', margin: 0 }}>
                  Have an idea?<br />
                  <span style={{ WebkitTextStroke: '1.5px rgba(255,255,255,0.18)', color: 'transparent' }}>Let&apos;s build it.</span>
                </h2>
              </div>

              {/* Right — email CTA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
                <a
                  href="mailto:arnavrajcodes@gmail.com"
                  style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 14, fontWeight: 500, color: 'rgba(167,139,250,0.75)', letterSpacing: '0.01em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, transition: 'color 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(196,181,253,1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(167,139,250,0.75)' }}
                >
                  arnavrajcodes@gmail.com
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { href: 'https://github.com/arnavraj-7', icon: <GitHubIcon />, label: 'GitHub' },
                    { href: 'https://www.linkedin.com/in/arnav-raj-7142b8313/', icon: <LinkedInIcon />, label: 'LinkedIn' },
                    { href: 'https://www.instagram.com/arnavraj.dev', icon: <InstagramIcon />, label: 'Instagram' },
                  ].map(({ href, icon, label }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                      style={{ color: 'rgba(255,255,255,0.22)', transition: 'color 0.25s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(196,181,253,0.9)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.22)' }}
                    >{icon}</a>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 24 }} />

            {/* Bottom row */}
            <div className="footer-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Arnav Raj · Full Stack Developer · CPO @ Dreamvator
              </span>
              <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.06em' }}>
                © {new Date().getFullYear()} · Built with Next.js &amp; Three.js
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
