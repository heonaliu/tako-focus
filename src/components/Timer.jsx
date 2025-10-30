import React, { useEffect, useRef, useState } from 'react'

export default function Timer({
  initialMinutes = 25,
  onComplete,
  mode = 'pomodoro',
  autoStart = false
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60)
  const [running, setRunning] = useState(autoStart)
  const intervalRef = useRef(null)

  // Reset timer when duration changes
  useEffect(() => {
    setSecondsLeft(initialMinutes * 60)
    if (autoStart) setRunning(true)
    else setRunning(false)
  }, [initialMinutes, autoStart])

  // Countdown logic
  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [running, onComplete])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const color = mode === 'break' ? '#22c55e' : '#ef4444' // Tailwind green/red tones

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
