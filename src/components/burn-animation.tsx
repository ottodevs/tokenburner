"use client"

import { useEffect, useState, useRef, useCallback } from "react"

interface BurnAnimationProps {
  value?: number
}

export function BurnAnimation({ value = 1 }: BurnAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [particles, setParticles] = useState<
    Array<{
      id: number
      x: number
      y: number
      size: number
      color: string
      velocity: { x: number; y: number }
      opacity: number
      rotation: number
      depth: number
      shape: "circle" | "triangle" | "ember"
    }>
  >([])

  // Function to draw a single particle
  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: (typeof particles)[0]) => {
    ctx.save()
    ctx.translate(particle.x, particle.y)
    ctx.rotate((particle.rotation * Math.PI) / 180)

    // Shadow for 3D effect
    ctx.shadowColor = particle.color
    ctx.shadowBlur = 15 + particle.depth * 3
    ctx.shadowOffsetX = particle.depth
    ctx.shadowOffsetY = particle.depth

    ctx.globalAlpha = particle.opacity
    ctx.fillStyle = particle.color

    // Draw different shapes based on particle type
    if (particle.shape === "circle") {
      ctx.beginPath()
      ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (particle.shape === "triangle") {
      ctx.beginPath()
      ctx.moveTo(0, -particle.size / 2)
      ctx.lineTo(particle.size / 2, particle.size / 2)
      ctx.lineTo(-particle.size / 2, particle.size / 2)
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.moveTo(0, -particle.size / 2)
      ctx.quadraticCurveTo(particle.size / 2, 0, 0, particle.size / 2)
      ctx.quadraticCurveTo(-particle.size / 2, 0, 0, -particle.size / 2)
      ctx.fill()
    }

    // Add glow effect
    ctx.globalCompositeOperation = "lighter"
    ctx.globalAlpha = particle.opacity * 0.5
    ctx.shadowBlur = 20 + particle.depth * 4

    if (particle.shape === "circle") {
      ctx.beginPath()
      ctx.arc(0, 0, particle.size / 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }, [])

  // Animation loop
  const animate = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    let lastTime = timestamp
    const deltaTime = timestamp - lastTime
    lastTime = timestamp

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Update and draw particles
    setParticles(prev => 
      prev.map(particle => {
        const speed = deltaTime / 16
        return {
          ...particle,
          x: particle.x + particle.velocity.x * speed,
          y: particle.y + particle.velocity.y * speed,
          opacity: particle.opacity - 0.01 * speed,
          rotation: particle.rotation + 2 * speed,
          size: particle.opacity < 0.2 ? particle.size - 0.5 * speed : particle.size,
        }
      }).filter(particle => particle.opacity > 0.05)
    )

    // Draw all particles
    particles.forEach(particle => {
      if (particle.opacity > 0.05) {
        drawParticle(ctx, particle)
      }
    })

    // Add devil face silhouette
    if (Math.random() < 0.02) {
      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.fillStyle = "#330000"

      const centerX = ctx.canvas.width / 2
      const centerY = ctx.canvas.height / 2
      const size = 100 + Math.random() * 100

      ctx.beginPath()
      ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)

      ctx.moveTo(centerX - size / 4, centerY - size / 3)
      ctx.lineTo(centerX - size / 2, centerY - size / 1.5)
      ctx.lineTo(centerX - size / 6, centerY - size / 4)

      ctx.moveTo(centerX + size / 4, centerY - size / 3)
      ctx.lineTo(centerX + size / 2, centerY - size / 1.5)
      ctx.lineTo(centerX + size / 6, centerY - size / 4)

      ctx.fill()
      ctx.restore()
    }

    animationFrameRef.current = requestAnimationFrame((newTimestamp) => animate(ctx, newTimestamp))
  }, [particles, drawParticle])

  useEffect(() => {
    // Create particles
    const particleCount = Math.min(Math.floor(value * 20), 200)
    const newParticles = []
    const colors = [
      "#ff4500",
      "#ff6000",
      "#ff7700",
      "#ff8800",
      "#ff9900",
      "#ffaa00",
      "#ffcc00",
      "#ff3300",
      "#ff5500",
      "#ff0000",
      "#cc3300",
      "#ff2200",
    ]

    const shapes = ["circle", "triangle", "ember"] as const

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
        size: Math.random() * 30 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: (Math.random() - 0.5) * 15,
          y: (Math.random() - 0.5) * 15 - 5,
        },
        opacity: Math.random() * 0.5 + 0.5,
        rotation: Math.random() * 360,
        depth: Math.random() * 8,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      })
    }

    setParticles(newParticles)
  }, [value])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    animationFrameRef.current = requestAnimationFrame((timestamp) => animate(ctx, timestamp))

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />
}

