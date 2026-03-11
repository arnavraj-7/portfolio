'use client'

import * as THREE from 'three'
import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from '@react-three/rapier'

// Images live at /public/*.webp — no /images/ prefix
const imageUrls = [
  '/react2.webp',
  '/next2.webp',
  '/node2.webp',
  '/express.webp',
  '/mongo.webp',
  '/mysql.webp',
  '/typescript.webp',
  '/javascript.webp',
]

// sphereGeometry is safe at module level (no browser APIs)
const sphereGeometry = new THREE.SphereGeometry(1, 28, 28)

// Textures must be created client-side only — loaded inside useMemo in the component

const spheres = [...Array(20)].map(() => ({
  scale: [0.75, 1, 0.85, 1, 1.1][Math.floor(Math.random() * 5)],
}))

type SphereProps = {
  vec?: THREE.Vector3
  scale: number
  r?: typeof THREE.MathUtils.randFloatSpread
  material: THREE.MeshPhysicalMaterial
  isActive: boolean
}

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  material,
  isActive,
}: SphereProps) {
  const api = useRef<RapierRigidBody | null>(null)

  useFrame((_state, delta) => {
    if (!isActive || !api.current) return
    delta = Math.min(0.1, delta)
    const impulse = vec
      .copy(api.current.translation())
      .normalize()
      .multiply(
        new THREE.Vector3(
          -50 * delta * scale,
          -150 * delta * scale,
          -50 * delta * scale,
        ),
      )
    api.current.applyImpulse(impulse, true)
  })

  return (
    <RigidBody
      linearDamping={0.75}
      angularDamping={0.15}
      friction={0.2}
      position={[r(18), r(14), r(8)]}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <mesh
        castShadow
        receiveShadow
        scale={scale}
        geometry={sphereGeometry}
        material={material}
        rotation={[0.3, 1, 1]}
      />
    </RigidBody>
  )
}

type PointerProps = {
  vec?: THREE.Vector3
  isActive: boolean
}

function Pointer({ vec = new THREE.Vector3(), isActive }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null)

  useFrame(({ pointer, viewport }) => {
    if (!isActive || !ref.current) return
    const target = vec.lerp(
      new THREE.Vector3(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0,
      ),
      0.2,
    )
    ref.current.setNextKinematicTranslation(target)
  })

  return (
    <RigidBody position={[100, 100, 100]} type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[2]} />
    </RigidBody>
  )
}

export function TechStack() {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const check = () => {
      const el = document.getElementById('tech')
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Activate when tech section is within viewport
      setIsActive(rect.top < window.innerHeight && rect.bottom > 0)
    }
    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [])

  const materials = useMemo(() => {
    if (typeof window === 'undefined') return []
    const loader = new THREE.TextureLoader()
    return imageUrls.map((url) => {
      const texture = loader.load(url)
      texture.flipY = false
      return new THREE.MeshPhysicalMaterial({
        map: texture,
        emissive: '#ffffff',
        emissiveMap: texture,
        emissiveIntensity: 0.25,
        metalness: 0.5,
        roughness: 0.9,
        clearcoat: 0.1,
      })
    })
  }, [])

  return (
    <Canvas
      shadows
      gl={{ alpha: true, stencil: false, depth: false, antialias: false }}
      camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
      frameloop={isActive ? 'always' : 'never'}
      dpr={1}
      onCreated={(state) => { state.gl.toneMappingExposure = 1.5 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={1} />
      <spotLight
        position={[20, 20, 25]}
        penumbra={1}
        angle={0.2}
        color="white"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[0, 5, -4]} intensity={2} />
      <Physics gravity={[0, 0, 0]}>
        <Pointer isActive={isActive} />
        {spheres.map((props, i) => (
          <SphereGeo
            key={i}
            {...props}
            material={materials[i % materials.length]}
            isActive={isActive}
          />
        ))}
      </Physics>
      <Environment preset="city" environmentIntensity={0.5} />
      <EffectComposer enableNormalPass={false}>
        <N8AO color="#0f002c" aoRadius={2} intensity={1.15} />
      </EffectComposer>
    </Canvas>
  )
}
