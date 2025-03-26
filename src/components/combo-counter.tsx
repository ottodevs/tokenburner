"use client"

import { useEffect, useState, useRef } from "react"
import { Trophy, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComboCounterProps {
  count: number
  total: number
}

export function ComboCounter({ count, total }: ComboCounterProps) {
  const [animate, setAnimate] = useState(false)
  const counterRef = useRef<HTMLDivElement>(null)

  // Determine combo level
  const getComboLevel = () => {
    if (count < 3) return { text: "Novice Burner", color: "text-orange-400" }
    if (count < 5) return { text: "Flame Apprentice", color: "text-orange-300" }
    if (count < 10) return { text: "Inferno Adept", color: "text-yellow-300" }
    if (count < 15) return { text: "Hellfire Master", color: "text-yellow-200" }
    return { text: "Demon Lord", color: "text-red-300" }
  }

  const comboLevel = getComboLevel()

  // Animate when count changes
  useEffect(() => {
    setAnimate(true)
    const timeout = setTimeout(() => setAnimate(false), 1000)
    return () => clearTimeout(timeout)
  }, [count])

  // Add 3D effect with tilt
  useEffect(() => {
    const counter = counterRef.current
    if (!counter) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = counter.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const tiltX = (y - centerY) / 10
      const tiltY = (centerX - x) / 10

      counter.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`
    }

    const handleMouseLeave = () => {
      counter.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)"
    }

    counter.addEventListener("mousemove", handleMouseMove)
    counter.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      counter.removeEventListener("mousemove", handleMouseMove)
      counter.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={counterRef}
      className="bg-gradient-to-r from-gray-900 to-red-900 p-4 rounded-lg border border-red-700 shadow-lg shadow-red-900/20 flex items-center justify-between w-full max-w-md transition-transform duration-300 card-3d-hover"
    >
      <div className="flex items-center">
        <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
        <div>
          <h3 className="text-lg font-bold text-orange-200 font-cinzel">Burn Combo</h3>
          <p className={cn("font-medium", comboLevel.color)}>{comboLevel.text}</p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="text-right mr-3">
          <div className="text-2xl font-bold text-white flex items-center">
            <span className={cn(animate ? "animate-bounce text-yellow-300" : "text-white")}>{count}</span>
            <Flame className={cn("h-5 w-5 ml-1", animate ? "text-yellow-300 animate-pulse" : "text-orange-400")} />
          </div>
          <p className="text-sm text-orange-200">Total: {total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}

