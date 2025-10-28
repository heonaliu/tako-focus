import React from 'react'
import { supabase } from '../supabaseClient'
import './css/Login.css'

export default function Login() {
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
    // Supabase will redirect to the URL you set in Supabase auth settings.
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <img src="/assets/tako_idle.png" alt="Tako" />
        <h1>Welcome to TakoFocus</h1>
        <p>Sign in with Google to save your sessions and tasks.</p>
        <div className="btn-wrapper">
          <button className="btn" onClick={signInWithGoogle}>Get Started!</button>
        </div>
      </div>
    </div>
  )
}
