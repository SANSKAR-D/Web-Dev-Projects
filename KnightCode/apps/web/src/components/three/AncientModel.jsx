import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, useGLTF, Billboard } from '@react-three/drei';
import * as THREE from 'three';

export default function AncientModel() {
  const { scene } = useGLTF('/Ancient.glb');
  const positionGroup = useRef();
  const rotationGroup = useRef();
  const scroll = useScroll();

  // Clone the scene to ensure isolated materials/changes if needed
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Create a soft radial gradient texture for the glowing aura
  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(232, 192, 96, 1)'); // Intense gold center
    gradient.addColorStop(0.4, 'rgba(212, 168, 60, 0.4)'); // Mid gold
    gradient.addColorStop(1, 'rgba(13, 11, 9, 0)'); // Fades out
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (!positionGroup.current || !rotationGroup.current || !scroll) return;
    
    // offset goes from 0 (top of page) to 1 (bottom of scroll area)
    const offset = scroll.offset;

    // Phase 1: 0 -> 0.5 (first half of scroll distance)
    // Phase 2: 0.5 -> 1.0 (second half of scroll distance)
    const r1 = scroll.range(0, 0.5);
    const r2 = scroll.range(0.5, 0.5);
    
    // The model comes from back (z: -10) to front (z: 1) linearly
    positionGroup.current.position.z = -10 + (offset * 11);
    
    // Phase 1 rotates 100 degrees
    // Phase 2 rotates the remaining 80 degrees
    const r1Rot = r1 * (120 * Math.PI / 180);
    const r2Rot = r2 * (60 * Math.PI / 180);
    
    // Apply rotation ONLY to the inner rotationGroup
    // Starts facing backward (180 deg / Math.PI) and progresses
    rotationGroup.current.rotation.y = Math.PI + r1Rot + r2Rot;

    // Movement: During Phase 1, move right and down. During Phase 2, return to the center horizontally.
    positionGroup.current.position.x = (r1 * 2.5) - (r2 * 2.5); // Sweeps further to the right during Phase 1
    const yScrollOffset = (r1 * -2.0) - (r2 * 4.0); // Gentle drop in Phase 1, deeper drop in Phase 2 (ends at exactly -6.0, as before)

    // The model only enlarges during Phase 2
    const baseScale = 0.035;
    const s = baseScale + (r2 * 0.015); // User's manual scale adjustment
    positionGroup.current.scale.set(s, s, s);
    
    // Add a continuous floating effect independent of scroll, heavily quieted down
    positionGroup.current.position.y = -4.0 + yScrollOffset + (Math.sin(state.clock.elapsedTime) * 0.04);
    // Add continuous slow idle rotation to make it feel alive, applied to the inner group
    rotationGroup.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
  });

  return (
    <group ref={positionGroup} dispose={null}>
       {/* Billboard sits far back on the Z axis, moved significantly up the Y axis, and vastly enlarged */}
       <Billboard position={[0, 150, -80]}>
         <mesh>
           <planeGeometry args={[800, 800]} />
           <meshBasicMaterial 
             map={glowTexture} 
             transparent 
             opacity={0.85} 
             depthWrite={false}
             depthTest={true} 
             blending={THREE.AdditiveBlending} 
           />
         </mesh>
       </Billboard>
       <group ref={rotationGroup}>
         <primitive object={clonedScene} />
       </group>
    </group>
  );
}

// Preload the model so it doesn't pop in
useGLTF.preload('/Ancient.glb');
