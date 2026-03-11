'use client'

import {
  Suspense,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, useGLTF } from '@react-three/drei'
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll-driven: avatar slides left as work section enters
  useEffect(() => {
    if (!groupRef.current) return

    const scrollConfig = {
      trigger: '#work',
      start: 'top 90%',
      end: 'top 50%',
      scrub: 1.5,
    }

    const xTween = gsap.to(groupRef.current.position, {
      x: -2.6,
      ease: 'none',
      scrollTrigger: scrollConfig,
    })

    // Rotate body to face right (toward projects)
    const rotateTween = gsap.to(groupRef.current.rotation, {
      y: 0.75,
      ease: 'none',
      scrollTrigger: scrollConfig,
    })

    // Head tracking: 0 = cursor (hero), 1 = fixed right (work), 0 = cursor (about)
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

    // About: avatar slides to RIGHT side, faces camera forward
    const aboutConfig = { trigger: '#about', start: 'top 85%', end: 'top 25%', scrub: 1.5 }
    const aboutXTween = gsap.to(groupRef.current.position, {
      x: 1.6, ease: 'none', scrollTrigger: aboutConfig,
    })
    const aboutRotateTween = gsap.to(groupRef.current.rotation, {
      y: -0.5, ease: 'none', scrollTrigger: aboutConfig,
    })

    const animTrigger = ScrollTrigger.create({
      trigger: '#work',
      start: 'top 55%',
      onEnter: () => {
        setAnim('ThumbsUp')
        setTimeout(() => setAnim('BreathingIdle'), 2500)
      },
      onLeaveBack: () => setAnim('BreathingIdle'),
    })

    const aboutAnimTrigger = ScrollTrigger.create({
      trigger: '#about',
      start: 'top 60%',
      onEnter: () => {
        setAnim('WavingGesture')
        setTimeout(() => setAnim('BreathingIdle'), 2600)
      },
      onLeaveBack: () => setAnim('BreathingIdle'),
    })

    return () => {
      xTween.kill()
      rotateTween.kill()
      headWeightIn.kill()
      headWeightOut.kill()
      aboutXTween.kill()
      aboutRotateTween.kill()
      animTrigger.kill()
      aboutAnimTrigger.kill()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    if (!modelRef.current) return
    const head = modelRef.current.getObjectByName('mixamorigHead')
    const mx = mousePos.current.x
    const my = mousePos.current.y
    const w = scrollWeight.current  // 0 = hero, 1 = work section

    if (head) {
      // In hero: follow cursor. In work: look right toward cards. Blend between.
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
        <AjModel scale={0.018} animation={anim} />
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
    type: 'Aviation EdTech Platform',
    desc: 'A full-stack aviation education platform featuring insightful blogs, resources, and tools for the next generation of aviators.',
    stack: ['Next.js', 'Supabase'],
    url: 'https://www.dreamvator.com',
    year: '2024',
  },
  {
    num: '02',
    name: 'Odd Planet',
    type: 'Marketing Agency',
    desc: 'A striking marketing agency website crafted for brand identity and conversion.',
    stack: ['Next.js', 'Vercel'],
    url: 'https://oddplanet.vercel.app/',
    year: '2024',
  },
  {
    num: '03',
    name: 'Untitled',
    type: 'Coming Soon',
    desc: null,
    stack: [] as string[],
    url: null,
    year: '2025',
  },
]

const STACK = [
  { name: 'Next.js',      category: 'Framework'     },
  { name: 'React',        category: 'UI Library'    },
  { name: 'TypeScript',   category: 'Language'      },
  { name: 'Supabase',     category: 'Backend & DB'  },
  { name: 'Tailwind CSS', category: 'Styling'       },
  { name: 'Node.js',      category: 'Runtime'       },
  { name: 'PostgreSQL',   category: 'Database'      },
  { name: 'Three.js',     category: '3D & WebGL'    },
  { name: 'GSAP',         category: 'Animation'     },
  { name: 'Figma',        category: 'Design'        },
  { name: 'Vercel',       category: 'Deployment'    },
  { name: 'Git',          category: 'Version Control'},
]

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

      // Parallax on horizon background
      gsap.to('.horizon-glow', {
        y: -80,
        ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: true },
      })
      gsap.to('.horizon-arc', {
        y: -40,
        ease: 'none',
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

      // Work section entrance
      gsap.fromTo('.work-heading',
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.work-heading', start: 'top 88%' } }
      )
      gsap.fromTo('.work-card',
        { x: 32, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out', scrollTrigger: { trigger: '.work-card', start: 'top 88%' } }
      )

      // About
      gsap.fromTo('.about-heading',
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.about-heading', start: 'top 88%' } }
      )
      gsap.fromTo('.about-item',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: '.about-heading', start: 'top 75%' } }
      )

      // Tech stack
      gsap.fromTo('.tech-heading',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.tech-heading', start: 'top 88%' } }
      )
      gsap.fromTo('.tech-card',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out', scrollTrigger: { trigger: '.tech-card', start: 'top 88%' } }
      )

      // Fade avatar out as tech section enters, back in when scrolling up
      gsap.to('.avatar-canvas', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '#tech', start: 'top 70%', end: 'top 20%', scrub: 1 },
      })

      // Contact
      gsap.fromTo('.contact-heading',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', scrollTrigger: { trigger: '.contact-heading', start: 'top 88%' } }
      )
      gsap.fromTo('.contact-form',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: '.contact-form', start: 'top 85%' } }
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
            border: '1px solid rgba(196,181,253,0.25)',
          }}
        />


        <div className="absolute inset-x-0 top-0 h-28"
          style={{ background: 'linear-gradient(to bottom, #06040F 0%, transparent 100%)' }} />
      </div>

      {/* ── 3D CANVAS ──────────────────────────────── */}
      <div className="avatar-canvas fixed inset-0 z-10 pointer-events-none">
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

        {/* ── WORK SECTION ───────────────────────── */}
        <section id="work" className="relative min-h-[160vh]">
          {/* Large top gap — avatar finishes moving before content appears */}
          <div className="max-w-350 mx-auto px-8 md:px-14 pt-[42vh] pb-28">
            <div className="md:pl-[36%]">
              {/* Frosted panel so content is readable over avatar/glow */}
              <div style={{
                background: 'rgba(6,4,15,0.82)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 16,
                border: '1px solid rgba(139,92,246,0.1)',
                padding: '40px 36px',
              }}>

              {/* Heading */}
              <div className="work-heading mb-16">
                <p style={{
                  fontFamily: 'Satoshi, sans-serif',
                  fontSize: 10,
                  letterSpacing: '0.4em',
                  textTransform: 'uppercase',
                  color: 'rgba(167,139,250,0.45)',
                  marginBottom: 14,
                }}>
                  Selected Work
                </p>
                <h2 style={{
                  fontFamily: 'ClashDisplay, sans-serif',
                  fontSize: 'clamp(44px, 5vw, 68px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: 'rgba(255,255,255,0.9)',
                }}>
                  Work.
                </h2>
                <div style={{ width: 40, height: 1, background: 'rgba(139,92,246,0.35)', marginTop: 20 }} />
              </div>

              {/* Project list */}
              <div>
                {PROJECTS.map((p) => (
                  <div
                    key={p.num}
                    className="work-card group relative"
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      padding: '32px 0 32px 20px',
                      transition: 'padding-left 0.3s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '28px' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '20px' }}
                  >
                    {/* Left hover accent */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[2px] scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-500"
                      style={{ background: 'rgba(139,92,246,0.6)' }}
                    />

                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        {/* Number + type + year */}
                        <div className="flex items-center gap-4 mb-3" style={{ color: 'rgba(255,255,255,0.18)' }}>
                          <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.3em', color: 'rgba(167,139,250,0.5)' }}>
                            {p.num}
                          </span>
                          <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                            {p.type}
                          </span>
                          <span className="ml-auto" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.1em' }}>
                            {p.year}
                          </span>
                        </div>

                        {/* Name */}
                        <h3
                          className="transition-colors duration-300"
                          style={{
                            fontFamily: 'ClashDisplay, sans-serif',
                            fontSize: 'clamp(22px, 2.5vw, 32px)',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: p.url ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.25)',
                            marginBottom: 10,
                          }}
                        >
                          {p.name}
                        </h3>

                        {/* Description */}
                        {p.desc && (
                          <p style={{
                            fontFamily: 'Satoshi, sans-serif',
                            fontSize: 13,
                            lineHeight: 1.65,
                            color: 'rgba(148,163,184,0.45)',
                            maxWidth: 420,
                            marginBottom: 14,
                          }}>
                            {p.desc}
                          </p>
                        )}

                        {/* Stack tags */}
                        {p.stack.length > 0 && (
                          <div className="flex items-center gap-2">
                            {p.stack.map(tag => (
                              <span key={tag} style={{
                                fontFamily: 'Satoshi, sans-serif',
                                fontSize: 10,
                                padding: '3px 10px',
                                borderRadius: 999,
                                border: '1px solid rgba(255,255,255,0.07)',
                                color: 'rgba(255,255,255,0.28)',
                                letterSpacing: '0.05em',
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Visit link */}
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 mt-1 flex items-center gap-1.5 transition-all duration-300"
                          style={{
                            fontFamily: 'Satoshi, sans-serif',
                            fontSize: 10,
                            letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.18)',
                            pointerEvents: 'auto',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(167,139,250,0.9)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.18)' }}
                        >
                          Visit
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7M17 7H7M17 7v10" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {/* Bottom border */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
              </div>

              </div>{/* end frosted panel */}
            </div>
          </div>
        </section>
        {/* ── ABOUT SECTION ──────────────────────── */}
        <section id="about" className="relative min-h-screen py-28">
          <div className="max-w-350 mx-auto px-8 md:px-14 pt-[45vh]">
            {/* Card on LEFT, avatar on RIGHT */}
            <div className="md:pr-[46%]">
              <div style={{
                background: 'rgba(6,4,15,0.82)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 16,
                border: '1px solid rgba(139,92,246,0.1)',
                padding: '40px 36px',
              }}>

                <div className="about-heading mb-10">
                  <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.45)', marginBottom: 14 }}>
                    About Me
                  </p>
                  <h2 style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(38px, 4.5vw, 60px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'rgba(255,255,255,0.9)' }}>
                    A builder<br />at heart.
                  </h2>
                  <div style={{ width: 40, height: 1, background: 'rgba(139,92,246,0.35)', marginTop: 20 }} />
                </div>

                <p className="about-item" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 14, lineHeight: 1.8, color: 'rgba(148,163,184,0.6)', maxWidth: 420, marginBottom: 32 }}>
                  I&apos;m Arnav — a full-stack developer and CPO co-building Dreamvator from India. I care about clean code, thoughtful UI, and the space where product thinking meets engineering.
                </p>

                <div className="about-item" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 28 }}>
                  <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.4)', marginBottom: 16 }}>
                    What I do
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      'Full-stack Web & App Development',
                      'Product Strategy & Roadmapping',
                      'UI/UX with a focus on interactions',
                      'EdTech platform building at Dreamvator',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                        <span style={{ color: 'rgba(139,92,246,0.6)', fontSize: 10 }}>→</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

                {/* ── TECH STACK SECTION ─────────────────── */}
        <section id="tech" className="relative py-28" style={{ background: '#06040f' }}>
          <div className="max-w-350 mx-auto px-8 md:px-14">

            <div className="tech-heading mb-16">
              <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.45)', marginBottom: 14 }}>
                Tools &amp; Technologies
              </p>
              <h2 style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: 'rgba(255,255,255,0.88)' }}>
                The Stack.
              </h2>
            </div>

            {/* Editorial list */}
            <div>
              {STACK.slice(0, 8).map((item, i) => (
                <div
                  key={item.name}
                  className="tech-card group"
                  style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr auto',
                    alignItems: 'center',
                    gap: 24,
                    padding: '20px 0',
                    cursor: 'default',
                    transition: 'padding-left 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.paddingLeft = '12px'
                    const name = e.currentTarget.querySelector('.tech-name') as HTMLElement
                    if (name) name.style.color = '#fff'
                    const bar = e.currentTarget.querySelector('.tech-bar') as HTMLElement
                    if (bar) bar.style.background = 'rgba(139,92,246,0.6)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.paddingLeft = '0'
                    const name = e.currentTarget.querySelector('.tech-name') as HTMLElement
                    if (name) name.style.color = 'rgba(255,255,255,0.72)'
                    const bar = e.currentTarget.querySelector('.tech-bar') as HTMLElement
                    if (bar) bar.style.background = 'rgba(255,255,255,0.04)'
                  }}
                >
                  <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(139,92,246,0.5)', letterSpacing: '0.15em' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="tech-bar" style={{ width: 2, height: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 1, flexShrink: 0, transition: 'background 0.3s' }} />
                    <span
                      className="tech-name"
                      style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: 600, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.72)', transition: 'color 0.3s' }}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
                    {item.category}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
            </div>

            {/* Infinite marquee — remaining + repeated */}
            <div style={{ marginTop: 48, overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
              <div style={{
                display: 'flex',
                gap: 0,
                animation: 'marquee-scroll 22s linear infinite',
                width: 'max-content',
              }}>
                {[...STACK, ...STACK].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px', flexShrink: 0 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(139,92,246,0.5)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
          <style>{`@keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        </section>

        {/* ── CONTACT SECTION ────────────────────── */}
        <section id="contact" className="relative py-24" style={{ pointerEvents: 'auto', background: '#06040f' }}>
          <div className="max-w-350 mx-auto px-8 md:px-14">
            <div className="max-w-lg mx-auto">

              <div className="contact-heading mb-12 text-center">
                <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.45)', marginBottom: 14 }}>
                  Get In Touch
                </p>
                <h2 style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(38px, 4.5vw, 62px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'rgba(255,255,255,0.9)' }}>
                  Let&apos;s build<br />something.
                </h2>
                <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 13, color: 'rgba(148,163,184,0.65)', marginTop: 16, lineHeight: 1.7 }}>
                  Have a project in mind or just want to say hi? Drop me a message.
                </p>
              </div>

              <form
                className="contact-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.currentTarget
                  const name = (form.elements.namedItem('name') as HTMLInputElement).value
                  const email = (form.elements.namedItem('email') as HTMLInputElement).value
                  const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value
                  window.location.href = `mailto:arnavrajcodes@gmail.com?subject=Hey Arnav, from ${name}&body=${encodeURIComponent(message)}%0A%0A— ${name} (${email})`
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {(['name', 'email'] as const).map((field) => (
                  <input
                    key={field}
                    name={field}
                    type={field === 'email' ? 'email' : 'text'}
                    placeholder={field === 'name' ? 'Your name' : 'your@email.com'}
                    required
                    style={{
                      fontFamily: 'Satoshi, sans-serif',
                      fontSize: 13,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10,
                      padding: '14px 18px',
                      color: 'rgba(255,255,255,0.8)',
                      outline: 'none',
                      transition: 'border-color 0.25s',
                      width: '100%',
                    }}
                    onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.45)' }}
                    onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
                  />
                ))}
                <textarea
                  name="message"
                  placeholder="What's on your mind?"
                  required
                  rows={5}
                  style={{
                    fontFamily: 'Satoshi, sans-serif',
                    fontSize: 13,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    padding: '14px 18px',
                    color: 'rgba(255,255,255,0.88)',
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.25s',
                    width: '100%',
                  }}
                  onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.45)' }}
                  onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
                />
                <button
                  type="submit"
                  style={{
                    fontFamily: 'Satoshi, sans-serif',
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    padding: '13px 32px',
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.22) 100%)',
                    border: '1px solid rgba(139,92,246,0.35)',
                    color: 'rgba(196,181,253,0.9)',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(109,40,217,0.4) 100%)'
                    el.style.borderColor = 'rgba(167,139,250,0.6)'
                    el.style.color = '#fff'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.22) 100%)'
                    el.style.borderColor = 'rgba(139,92,246,0.35)'
                    el.style.color = 'rgba(196,181,253,0.9)'
                  }}
                >
                  Send message →
                </button>
              </form>

              <div className="contact-form" style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em' }}>
                  Or reach me directly at{' '}
                  <a href="mailto:arnavrajcodes@gmail.com" style={{ color: 'rgba(167,139,250,0.6)', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(196,181,253,1)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(167,139,250,0.6)' }}>
                    arnavrajcodes@gmail.com
                  </a>
                </p>
              </div>

            </div>
          </div>
        </section>

                {/* ── FOOTER ─────────────────────────────── */}
        <footer style={{ background: '#06040f', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Top footer row */}
          <div className="max-w-350 mx-auto px-8 md:px-14 py-12 flex items-end justify-between gap-8 flex-wrap">
            <div>
              <h3 style={{ fontFamily: 'ClashDisplay, sans-serif', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.85)', lineHeight: 1.1, marginBottom: 8 }}>
                Let&apos;s work<br />together.
              </h3>
              <a href="mailto:arnavrajcodes@gmail.com" style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, color: 'rgba(167,139,250,0.6)', letterSpacing: '0.05em', transition: 'color 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(196,181,253,1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(167,139,250,0.6)' }}>
                arnavrajcodes@gmail.com ↗
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', color: 'rgba(255,255,255,0.25)' }}>
                {[
                  { href: 'https://github.com/arnavraj-7', label: 'GitHub', icon: <GitHubIcon /> },
                  { href: 'https://www.linkedin.com/in/arnav-raj-7142b8313/', label: 'LinkedIn', icon: <LinkedInIcon /> },
                  { href: 'https://www.instagram.com/arnavraj.dev', label: 'Instagram', icon: <InstagramIcon /> },
                ].map(({ href, label, icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    style={{ transition: 'color 0.25s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)' }}>
                    {icon}
                  </a>
                ))}
              </div>
              <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.08em' }}>
                © 2025 Arnav Raj
              </span>
            </div>
          </div>
          {/* Bottom strip */}
          <div className="max-w-350 mx-auto px-8 md:px-14 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.06em' }}>
              Full Stack Developer · CPO @ Dreamvator
            </span>
            <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.1)', letterSpacing: '0.06em' }}>
              Built with Next.js &amp; Three.js
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}
