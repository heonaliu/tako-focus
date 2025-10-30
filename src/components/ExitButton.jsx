import React, { useState, useRef, useEffect } from 'react'
import './css/ExitButton.css'
import takoFocused from '../assets/tako_idle.png'

export default function ExitButton({ onConfirmExit }) {
  const [progress, setProgress] = useState(0)
  const holdRef = useRef(null)
  const HOLD_DURATION = 3000 // 3 seconds

  const radius = 36
  const circumference = 2 * Math.PI * radius

  const startHold = () => {
    const startTime = Date.now()
    holdRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(elapsed / HOLD_DURATION, 1)
      setProgress(pct)
      if (pct >= 1) {
        clearInterval(holdRef.current)
        onConfirmExit?.()
      }
    }, 20)
  }

  const stopHold = () => {
    clearInterval(holdRef.current)
    setProgress(0)
  }

  // Cleanup safety
  useEffect(() => () => clearInterval(holdRef.current), [])

  const offset = circumference - progress * circumference

  return (
    <div className="exit-button-container">
      <div
        className="exit-button"
        onMouseDown={startHold}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
      >
        <svg className="progress-ring" width="80" height="80">
          <circle
            className="progress-ring-bg"
            stroke="#333"
            strokeWidth="5"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
          />
          <circle
            className="progress-ring-progress"
            stroke="var(--purple-light)"
            strokeWidth="5"
            fill="transparent"
            r={radius}
            cx="40"
            cy="40"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <img src={takoFocused} alt="Tako Focused" className="exit-icon" />
      </div>
      <p className="exit-hint">Hold to end session</p>
    </div>
  )
}
