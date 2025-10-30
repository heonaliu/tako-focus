import React from 'react'
import './css/FloatingMascot.css'
import takoFocus from '../assets/tako_focus.png'
import takoBreak from '../assets/tako_break.png'

export default function FloatingMascot({ mode }) {
  const image = mode === 'break' ? takoBreak : takoFocus
  const altText = mode === 'break' ? 'Tako resting' : 'Tako focusing'

  return (
    <div className="floating-mascot">
      <img src={image} alt={altText} className="mascot-img" />
    </div>
  )
}
