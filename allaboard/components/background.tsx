'use client'

import { useState, useEffect } from 'react'

export default function Background() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })

  // mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8e6f5] via-[#d8d5ed] to-[#c8c4e6]" />

      {/* Parallax mountains - Layer 1 (furthest back) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[60vh] opacity-20 transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${(mousePos.x - 50) * 0.02}px, ${
            (mousePos.y - 50) * 0.02
          }px)`,
        }}
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        <path
          d="M0,350 L200,250 L400,300 L600,200 L800,280 L1000,220 L1200,300 L1200,600 L0,600 Z"
          fill="#3d3e68"
          opacity="0.15"
        />
      </svg>

      {/* Layer 2 */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[55vh] opacity-25 transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${(mousePos.x - 50) * 0.04}px, ${
            (mousePos.y - 50) * 0.04
          }px)`,
        }}
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        <path
          d="M0,380 L150,300 L350,340 L550,260 L750,320 L950,280 L1200,350 L1200,600 L0,600 Z"
          fill="#4b4a7a"
          opacity="0.2"
        />
      </svg>

      {/* Layer 3 */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[50vh] opacity-30 transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${(mousePos.x - 50) * 0.06}px, ${
            (mousePos.y - 50) * 0.06
          }px)`,
        }}
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        <path
          d="M0,400 L180,320 L380,370 L580,300 L780,360 L980,320 L1200,380 L1200,600 L0,600 Z"
          fill="#5a5890"
          opacity="0.25"
        />
      </svg>

      {/* Layer 4 */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[45vh] opacity-35 transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${(mousePos.x - 50) * 0.08}px, ${
            (mousePos.y - 50) * 0.08
          }px)`,
        }}
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        <path
          d="M0,420 L220,360 L420,400 L620,340 L820,390 L1020,360 L1200,410 L1200,600 L0,600 Z"
          fill="#6b5fa4"
          opacity="0.3"
        />
      </svg>

      {/* Layer 5 (closest) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[40vh] opacity-40 transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${(mousePos.x - 50) * 0.1}px, ${
            (mousePos.y - 50) * 0.1
          }px)`,
        }}
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        <path
          d="M0,450 L250,400 L450,430 L650,380 L850,420 L1050,400 L1200,440 L1200,600 L0,600 Z"
          fill="#7d6fb8"
          opacity="0.35"
        />
      </svg>
    </div>
  )
}
