'use client'

import { useEffect, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AjModel, AjModelHandle } from './AjModel'

function FaceScene() {
  const ajRef = useRef<AjModelHandle>(null)
  useEffect(() => {
    const t = setTimeout(() => ajRef.current?.playAnimation('BreathingIdle'), 300)
    return () => clearTimeout(t)
  }, [])
  return (
    // Group position places the avatar so the face is centered in the circle.
    // Camera at y=2.6 looks at the face area. Adjust y here to reframe.
    <group position={[0, -0.4, 0]}>
      <AjModel ref={ajRef} scale={0.018} />
    </group>
  )
}

export default function MobileAvatarCircle() {
  return (
    <Canvas
      // Camera framing: y=2.6 ≈ face level, z=1.2 zooms in tight
      // fov=30 keeps it narrow (face-only crop)
      camera={{ position: [0, 2.6, 1.2], fov: 30 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      dpr={Math.min(window.devicePixelRatio, 2)}
      frameloop="always"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <ambientLight intensity={2.8} />
      <directionalLight position={[2, 4, 3]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-1, 2, -1]} intensity={0.5} color="#c4b5fd" />
      <pointLight position={[0, 3, 1]} color="#a78bfa" intensity={8} />
      <Suspense fallback={null}>
        <FaceScene />
      </Suspense>
    </Canvas>
  )
}
