import React from 'react';

const GrainOverlay = () => {
  return (
    <svg className="grain-overlay" xmlns="http://www.w3.org/2000/svg">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feBlend in="SourceGraphic" mode="overlay" result="blend"/>
        <feComposite in="blend" in2="SourceGraphic" operator="atop"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity="0.04"/>
    </svg>
  );
};

export default GrainOverlay;
