import React, { useRef, useState, useEffect } from 'react'
import './css/ExitButton.css'
import takoFocused from '../assets/tako_idle.png'

export default function ExitButton({ onExit }) {
  const holdDuration = 3000 // 3 seconds
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const [pulse, setPulse] = useState(false)
  const holdStartRef = useRef(null)
  const intervalRef = useRef(null)

  const startHold = () => {
    if (holding) return
    setHolding(true)
    holdStartRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current
      const newProgress = Math.min((elapsed / holdDuration) * 100, 100)
      setProgress(newProgress)

      if (newProgress >= 100) {
        clearInterval(intervalRef.current)
        setHolding(false)

        // ✅ Subtle vibration & glow pulse
        if (navigator.vibrate) navigator.vibrate(60)
        setPulse(true)
        setTimeout(() => setPulse(false), 400)

        onExit?.()
      }
    }, 30)
  }

  const cancelHold = () => {
    clearInterval(intervalRef.current)
    setHolding(false)
    setProgress(0)
  }

  useEffect(() => {
    return () => clearInterval(intervalRef.current)
  }, [])

  return (
    <div className="exit-button-container">
      <div
        className={`exit-button ${pulse ? 'pulse' : ''}`}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
      >
        <div
          className="exit-progress-ring"
          style={{
            background: `conic-gradient(
              #34D399 ${progress * 3.6}deg,
              rgba(255,255,255,0.1) ${progress * 3.6}deg
            )`
          }}
        >
          <img src={takoFocused} alt="Exit" className="exit-icon" />
        </div>
      </div>
      <p className="exit-text">Hold to end session</p>
    </div>
  )
}
