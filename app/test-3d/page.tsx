'use client'

import React, { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, ContactShadows, Center } from '@react-three/drei'
import { AjModel, ActionName } from '../AjModel'

export default function Test3DPage() {
  const [currentAnim, setCurrentAnim] = useState<ActionName>('BreathingIdle')

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#111', position: 'relative' }}>
      
      {/* UI Controls Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '12px 24px',
        borderRadius: '30px',
        backdropFilter: 'blur(10px)',
      }}>
        {['BreathingIdle', 'WavingGesture', 'ThumbsUp'].map((anim) => (
          <button
            key={anim}
            onClick={() => setCurrentAnim(anim as ActionName)}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 600,
              transition: 'all 0.2s',
              background: currentAnim === anim ? '#fff' : 'rgba(255, 255, 255, 0.2)',
              color: currentAnim === anim ? '#000' : '#fff',
            }}
          >
            {anim.replace(/([A-Z])/g, ' $1').trim()} {/* Adds spaces to CamelCase */}
          </button>
        ))}
      </div>

      <Canvas 
        shadows 
        camera={{ position: [0, 2, 5], fov: 50 }}
      >
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
        
        <Suspense fallback={null}>
          <Center top>
            <AjModel scale={0.01} animation={currentAnim} />
          </Center>
          
          <Environment preset="city" />
          <ContactShadows 
            opacity={0.5} 
            scale={10} 
            blur={2} 
            far={4.5} 
          />
        </Suspense>

        <OrbitControls 
          makeDefault 
          minDistance={2} 
          maxDistance={10} 
        />
      </Canvas>
    </main>
  )
}
