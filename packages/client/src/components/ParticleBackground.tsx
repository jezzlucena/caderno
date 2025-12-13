import { useEffect, useRef, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseRadius: number
  opacity: number
  baseOpacity: number
  // Orbital movement properties
  anchorX: number
  anchorY: number
  orbitalRadius: number
  orbitalSpeed: number
  orbitalPhase: number
  orbitalDirection: number
  // Pulse properties
  pulseSpeed: number
  pulsePhase: number
}

interface ParticleBackgroundProps {
  /** Color scheme: 'purple' for brand colors, 'gray' for grayscale */
  colorScheme?: 'purple' | 'gray'
  /** Number of particles (default: 100) */
  particleCount?: number
  /** Maximum connection distance between particles (default: 140) */
  connectionDistance?: number
  /** Mouse influence radius (default: 180) */
  mouseRadius?: number
}

export function ParticleBackground({
  colorScheme = 'purple',
  particleCount = 100,
  connectionDistance = 140,
  mouseRadius = 180,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animationRef = useRef<number | undefined>(undefined)
  const resizeTimeoutRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(0)

  // Color configuration based on scheme
  const colors = colorScheme === 'purple'
    ? {
        particle: 'rgba(139, 92, 246, opacity)', // violet-500
        connection: 'rgba(139, 92, 246, opacity)',
      }
    : {
        particle: 'rgba(156, 163, 175, opacity)', // gray-400
        connection: 'rgba(156, 163, 175, opacity)',
      }

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      const baseRadius = Math.random() * 2 + 1
      const baseOpacity = Math.random() * 0.4 + 0.4
      const x = Math.random() * width
      const y = Math.random() * height
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: baseRadius,
        baseRadius,
        opacity: baseOpacity,
        baseOpacity,
        // Orbital properties - each particle orbits around a drifting anchor
        anchorX: x,
        anchorY: y,
        orbitalRadius: Math.random() * 25 + 8, // 8-33px orbital radius
        orbitalSpeed: (Math.random() * 0.0008 + 0.0003), // Very slow orbital speed
        orbitalPhase: Math.random() * Math.PI * 2, // Random starting phase
        orbitalDirection: Math.random() > 0.5 ? 1 : -1, // Clockwise or counter-clockwise
        // Pulse properties for subtle size/opacity variation
        pulseSpeed: Math.random() * 0.002 + 0.001,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }
    particlesRef.current = particles
  }, [particleCount])

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
    ctx.fillStyle = colors.particle.replace('opacity', String(particle.opacity))
    ctx.fill()
  }, [colors.particle])

  const drawConnection = useCallback((
    ctx: CanvasRenderingContext2D,
    p1: Particle,
    p2: Particle,
    distance: number
  ) => {
    const opacity = (1 - distance / connectionDistance) * 0.6
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.strokeStyle = colors.connection.replace('opacity', String(opacity))
    ctx.lineWidth = 0.8
    ctx.stroke()
  }, [colors.connection, connectionDistance])

  const updateParticle = useCallback((particle: Particle, width: number, height: number, time: number) => {
    // Update orbital phase
    particle.orbitalPhase += particle.orbitalSpeed * particle.orbitalDirection

    // Calculate orbital offset from anchor point
    const orbitalX = Math.cos(particle.orbitalPhase) * particle.orbitalRadius
    const orbitalY = Math.sin(particle.orbitalPhase) * particle.orbitalRadius

    // Mouse interaction - gentle attraction applied to anchor point
    const anchorDx = mouseRef.current.x - particle.anchorX
    const anchorDy = mouseRef.current.y - particle.anchorY
    const anchorDistance = Math.sqrt(anchorDx * anchorDx + anchorDy * anchorDy)

    if (anchorDistance < mouseRadius && anchorDistance > 0) {
      const force = (mouseRadius - anchorDistance) / mouseRadius * 0.025
      particle.vx += (anchorDx / anchorDistance) * force
      particle.vy += (anchorDy / anchorDistance) * force
    }

    // Apply velocity with damping to anchor point
    particle.vx *= 0.985
    particle.vy *= 0.985

    // Add subtle random drift to anchor for organic movement
    particle.vx += (Math.random() - 0.5) * 0.015
    particle.vy += (Math.random() - 0.5) * 0.015

    // Clamp velocity
    const maxSpeed = 1.2
    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
    if (speed > maxSpeed) {
      particle.vx = (particle.vx / speed) * maxSpeed
      particle.vy = (particle.vy / speed) * maxSpeed
    }

    // Update anchor position
    particle.anchorX += particle.vx
    particle.anchorY += particle.vy

    // Wrap anchor around edges
    if (particle.anchorX < -particle.orbitalRadius) particle.anchorX = width + particle.orbitalRadius
    if (particle.anchorX > width + particle.orbitalRadius) particle.anchorX = -particle.orbitalRadius
    if (particle.anchorY < -particle.orbitalRadius) particle.anchorY = height + particle.orbitalRadius
    if (particle.anchorY > height + particle.orbitalRadius) particle.anchorY = -particle.orbitalRadius

    // Update actual particle position (anchor + orbital offset)
    particle.x = particle.anchorX + orbitalX
    particle.y = particle.anchorY + orbitalY

    // Pulse effect for radius and opacity
    const pulseFactor = Math.sin(time * particle.pulseSpeed + particle.pulsePhase)
    particle.radius = particle.baseRadius * (1 + pulseFactor * 0.2)
    particle.opacity = particle.baseOpacity * (1 + pulseFactor * 0.15)
  }, [mouseRadius])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas

    // Increment time for animations
    timeRef.current += 16 // Approximate ms per frame at 60fps

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    const particles = particlesRef.current

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      updateParticle(particles[i], width, height, timeRef.current)
      drawParticle(ctx, particles[i])

      // Draw connections
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < connectionDistance) {
          drawConnection(ctx, particles[i], particles[j], distance)
        }
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [connectionDistance, drawConnection, drawParticle, updateParticle])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      // Debounce resize
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        initParticles(canvas.width, canvas.height)
      }, 100)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    const handleTouchEnd = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    // Initial setup
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    initParticles(canvas.width, canvas.height)

    // Start animation
    animate()

    // Event listeners
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [animate, initParticles])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
