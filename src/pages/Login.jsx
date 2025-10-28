import React from 'react'
import { supabase } from '../supabaseClient'

export default function Login(){
  async function signInWithGoogle(){
    await supabase.auth.signInWithOAuth({ provider: 'google' })
    // Supabase will redirect to the URL you set in Supabase auth settings.
  }
  return (
    <div style={{minHeight:'78vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <img src="/assets/tako_idle.png" alt="Tako" style={{width:160}}/>
        <h1 style={{fontSize:36, margin:'12px 0'}}>Welcome to TakoFocus</h1>
        <p style={{color:'var(--muted)'}}>Sign in with Google to save your sessions and tasks.</p>
        <div style={{marginTop:20}}>
          <button className="btn" onClick={signInWithGoogle}>Continue with Google</button>
        </div>
      </div>
    </div>
  )
}
