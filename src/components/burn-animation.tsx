"use client"

import { useEffect, useState, useRef } from "react"

export function BurnAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  useEffect(() => {
    // Create particles
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

    for (let i = 0; i < 100; i++) {
      newParticles.push({
        id: i,
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
        size: Math.random() * 30 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: (Math.random() - 0.5) * 15,
          y: (Math.random() - 0.5) * 15 - 5, // Bias upward
        },
        opacity: Math.random() * 0.5 + 0.5,
        rotation: Math.random() * 360,
        depth: Math.random() * 8, // Enhanced 3D depth effect
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      })
    }

    setParticles(newParticles)

    // Setup canvas for 3D effect
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Animation loop
        let animationId: number
        let lastTime = 0

        const animate = (timestamp: number) => {
          const deltaTime = timestamp - lastTime
          lastTime = timestamp

          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Update and draw particles
          setParticles((prev) =>
            prev
              .map((particle) => {
                // Update particle with time-based animation
                const speed = deltaTime / 16 // normalize to ~60fps
                const newParticle = {
                  ...particle,
                  x: particle.x + particle.velocity.x * speed,
                  y: particle.y + particle.velocity.y * speed,
                  opacity: particle.opacity - 0.01 * speed,
                  rotation: particle.rotation + 2 * speed,
                  size: particle.opacity < 0.2 ? particle.size - 0.5 * speed : particle.size,
                }

                // Draw particle with 3D effect
                if (newParticle.opacity > 0.05) {
                  ctx.save()
                  ctx.translate(newParticle.x, newParticle.y)
                  ctx.rotate((newParticle.rotation * Math.PI) / 180)

                  // Shadow for 3D effect
                  ctx.shadowColor = newParticle.color
                  ctx.shadowBlur = 15 + newParticle.depth * 3
                  ctx.shadowOffsetX = newParticle.depth
                  ctx.shadowOffsetY = newParticle.depth

                  ctx.globalAlpha = newParticle.opacity
                  ctx.fillStyle = newParticle.color

                  // Draw different shapes based on particle type
                  if (newParticle.shape === "circle") {
                    // Draw circle
                    ctx.beginPath()
                    ctx.arc(0, 0, newParticle.size / 2, 0, Math.PI * 2)
                    ctx.fill()
                  } else if (newParticle.shape === "triangle") {
                    // Draw triangle (flame-like)
                    ctx.beginPath()
                    ctx.moveTo(0, -newParticle.size / 2)
                    ctx.lineTo(newParticle.size / 2, newParticle.size / 2)
                    ctx.lineTo(-newParticle.size / 2, newParticle.size / 2)
                    ctx.closePath()
                    ctx.fill()
                  } else {
                    // Draw ember (flame-like shape)
                    ctx.beginPath()
                    ctx.moveTo(0, -newParticle.size / 2)
                    ctx.quadraticCurveTo(newParticle.size / 2, 0, 0, newParticle.size / 2)
                    ctx.quadraticCurveTo(-newParticle.size / 2, 0, 0, -newParticle.size / 2)
                    ctx.fill()
                  }

                  // Add glow effect
                  ctx.globalCompositeOperation = "lighter"
                  ctx.globalAlpha = newParticle.opacity * 0.5
                  ctx.shadowBlur = 20 + newParticle.depth * 4

                  if (newParticle.shape === "circle") {
                    ctx.beginPath()
                    ctx.arc(0, 0, newParticle.size / 1.5, 0, Math.PI * 2)
                    ctx.fill()
                  }

                  ctx.restore()
                }

                return newParticle
              })
              .filter((particle) => particle.opacity > 0.05),
          )

          // Add devil face silhouette in the flames occasionally
          if (Math.random() < 0.02) {
            ctx.save()
            ctx.globalAlpha = 0.1
            ctx.fillStyle = "#330000"

            // Draw devil face silhouette
            const centerX = canvas.width / 2
            const centerY = canvas.height / 2
            const size = 100 + Math.random() * 100

            // Head
            ctx.beginPath()
            ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)

            // Horns
            ctx.moveTo(centerX - size / 4, centerY - size / 3)
            ctx.lineTo(centerX - size / 2, centerY - size / 1.5)
            ctx.lineTo(centerX - size / 6, centerY - size / 4)

            ctx.moveTo(centerX + size / 4, centerY - size / 3)
            ctx.lineTo(centerX + size / 2, centerY - size / 1.5)
            ctx.lineTo(centerX + size / 6, centerY - size / 4)

            ctx.fill()
            ctx.restore()
          }

          animationId = requestAnimationFrame(animate)
        }

        animate(0)

        return () => {
          cancelAnimationFrame(animationId)
        }
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />
}

