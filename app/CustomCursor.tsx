'use client'

import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = 0
    let mouseY = 0
    let ringX = 0
    let ringY = 0
    let rafId: number
    let isHovering = false

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const onHoverIn = () => {
      isHovering = true
      ring.style.width = '52px'
      ring.style.height = '52px'
      ring.style.borderColor = 'rgba(167,139,250,0.5)'
      ring.style.background = 'rgba(139,92,246,0.06)'
      dot.style.opacity = '0'
    }

    const onHoverOut = () => {
      isHovering = false
      ring.style.width = '32px'
      ring.style.height = '32px'
      ring.style.borderColor = 'rgba(255,255,255,0.35)'
      ring.style.background = 'transparent'
      dot.style.opacity = '1'
    }

    const onMouseDown = () => {
      ring.style.transform = 'translate(-50%, -50%) scale(0.8)'
      dot.style.transform = 'translate(-50%, -50%) scale(0.6)'
    }

    const onMouseUp = () => {
      ring.style.transform = 'translate(-50%, -50%) scale(1)'
      dot.style.transform = 'translate(-50%, -50%) scale(1)'
    }

    const interactive = document.querySelectorAll('a, button, [role="button"]')
    interactive.forEach((el) => {
      el.addEventListener('mouseenter', onHoverIn)
      el.addEventListener('mouseleave', onHoverOut)
    })

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    const animate = () => {
      // Ring follows with lerp lag
      ringX += (mouseX - ringX) * 0.1
      ringY += (mouseY - ringY) * 0.1

      // Dot snaps instantly
      dot.style.left = mouseX + 'px'
      dot.style.top = mouseY + 'px'

      ring.style.left = ringX + 'px'
      ring.style.top = ringY + 'px'

      rafId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      interactive.forEach((el) => {
        el.removeEventListener('mouseenter', onHoverIn)
        el.removeEventListener('mouseleave', onHoverOut)
      })
    }
  }, [])

  return (
    <>
      {/* Outer ring — lagging */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          width: 32,
          height: 32,
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99999,
          top: 0,
          left: 0,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.3s ease, height 0.3s ease, border-color 0.3s ease, background 0.3s ease, transform 0.15s ease',
          mixBlendMode: 'difference',
        }}
      />
      {/* Inner dot — instant */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          width: 4,
          height: 4,
          background: 'white',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 100000,
          top: 0,
          left: 0,
          transform: 'translate(-50%, -50%)',
          transition: 'opacity 0.2s ease, transform 0.15s ease',
          mixBlendMode: 'difference',
        }}
      />
    </>
  )
}
