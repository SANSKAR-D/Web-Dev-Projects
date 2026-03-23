// src/components/three/SacredGeometryCanvas.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SacredGeometryCanvas = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    if(mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Geometry generators per architecture.md
    const SHAPES = [
      () => new THREE.OctahedronGeometry(0.4),
      () => new THREE.TetrahedronGeometry(0.5),
      () => new THREE.IcosahedronGeometry(0.35),
    ];

    // Colors
    const GOLD_EMISSIVE = 0x4A3010;

    // Material — wireframe + translucent fill
    const wireMat = new THREE.MeshPhongMaterial({
      color: 0xB8902A, 
      wireframe: true,
      transparent: true, 
      opacity: 0.18,
      emissive: GOLD_EMISSIVE,
    });

    const meshes = [];

    // 30 artifacts placed in a 20×20×12 volume
    for (let i = 0; i < 30; i++) {
      const geometry = SHAPES[Math.floor(Math.random() * SHAPES.length)]();
      const mesh = new THREE.Mesh(geometry, wireMat);

      mesh.position.x = (Math.random() - 0.5) * 20;
      mesh.position.y = (Math.random() - 0.5) * 20;
      mesh.position.z = (Math.random() - 0.5) * 12;

      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;
      
      mesh.userData = { drift_factor: Math.random() * 0.5 + 0.5 };

      scene.add(mesh);
      meshes.push(mesh);
    }

    // Two point lights: amber + sienna
    const amberLight = new THREE.PointLight(0xD4831A, 0.8, 100);
    amberLight.position.set(5, 5, 5);
    scene.add(amberLight);

    const siennaLight = new THREE.PointLight(0x8B4513, 0.3, 100);
    siennaLight.position.set(-5, -5, -5);
    scene.add(siennaLight);

    // Subtle drift and auto-pan config
    let mouseX = 0;
    let mouseY = 0;
    const targetX = 0;
    const targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event) => {
      mouseX = (event.clientX - windowHalfX) * 0.0005;
      mouseY = (event.clientY - windowHalfY) * 0.0005;
    };

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    // Resize handler
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', onWindowResize, false);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Slow drift
      meshes.forEach(mesh => {
        mesh.rotation.y += 0.0008 * mesh.userData.drift_factor;
        mesh.rotation.x += 0.0004 * mesh.userData.drift_factor;
      });

      // Subtle auto-pan on mouse move (±5° yaw, ±3° pitch approximation)
      camera.position.x += (mouseX - camera.position.x) * .05;
      camera.position.y += (-mouseY - camera.position.y) * .05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if(animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // dispose geometries and materials
      meshes.forEach(mesh => {
        mesh.geometry.dispose();
      });
      wireMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }} 
    />
  );
};

export default SacredGeometryCanvas;
