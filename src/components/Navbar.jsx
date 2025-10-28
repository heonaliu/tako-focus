import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Navbar({ user }){
  const navigate = useNavigate()
  async function signOut(){
    await supabase.auth.signOut()
    navigate('/')
  }
  return (
    <nav style={{padding:'12px 22px', borderBottom:'1px solid rgba(0,0,0,0.03)'}}>
      <div className="container" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <img src="/assets/tako_idle.png" alt="Tako" style={{width:42, height:42}}/>
          <Link to="/dashboard" style={{fontWeight:700, color:'var(--purple-main)', textDecoration:'none'}}>TakoFocus</Link>
        </div>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <Link to="/about" style={{textDecoration:'none', color:'var(--muted)'}}>About</Link>
          {user ? (
            <>
              <Link to="/tasks" style={{textDecoration:'none', color:'var(--muted)'}}>Tasks</Link>
              <Link to="/focus" style={{textDecoration:'none', color:'var(--muted)'}}>Focus</Link>
              <button className="btn" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link to="/" className="btn">Log in</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
