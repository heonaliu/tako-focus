import React, { useEffect, useRef, useState } from 'react'
import { FaPlay, FaPause } from 'react-icons/fa'

export default function Timer({ initialMinutes = 25, onComplete, mode = 'pomodoro' }) {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    setSecondsLeft(initialMinutes * 60)
  }, [initialMinutes])

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          onComplete && onComplete()
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [running, onComplete])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  const color = mode === 'break' ? 'green' : 'red'

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="timer-display" style={{ color }}>
        {mm}:{ss}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? <FaPause /> : <FaPlay />}
        </button>
      </div>
    </div>
  )
}
