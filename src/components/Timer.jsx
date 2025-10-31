import React, { useEffect, useRef, useState } from 'react'

export default function Timer({
  initialMinutes = 25,
  onComplete,
  mode = 'pomodoro',
  autoStart = false,
  onTick // 👈 optional callback for FocusSession tracking
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60)
  const [running, setRunning] = useState(autoStart)
  const intervalRef = useRef(null)

  // 🧭 Reset when duration or autoStart changes
  useEffect(() => {
    setSecondsLeft(initialMinutes * 60)
    setRunning(autoStart)
  }, [initialMinutes, autoStart])

  // ⏱️ Countdown logic
  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(intervalRef.current)
          setRunning(false)
          onComplete?.()
          return 0
        }
        onTick?.(next) // 👈 report remaining seconds back
        return next
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [running, onComplete, onTick])

  // 🧮 Format display
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const color = mode === 'break' ? '#34D399' : '#C77DFF'

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        className="timer-display fade-in"
        style={{
          color,
          fontSize: '4rem',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}
      >
        {mm}:{ss}
      </div>
    </div>
  )
}
