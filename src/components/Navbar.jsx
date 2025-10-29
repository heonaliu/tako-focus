import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './css/Navbar.css'
import takoIdle from '../assets/tako_idle.png'

export default function Navbar({ user }) {
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="logo-section">
          <img src={takoIdle} alt="Tako" />
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div className="links">
          <Link to="/about">About</Link>
          {user ? (
            <>
              <Link to="/tasks">Tasks</Link>
              <Link to="/focus">Focus</Link>
              <button className="btn" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <Link to="/" className="btn btn-login">Sign Up</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
