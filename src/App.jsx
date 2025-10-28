import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FocusSession from './pages/FocusSession'
import Tasks from './pages/Tasks'
import About from './pages/About'
import ProtectedRoute from './components/ProtectedRoute'

export default function App(){
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    //const session = supabase.auth.getSession().then(r => r.data.session)
    // supabase v2: event listener
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) navigate('/dashboard')
    })
    // check initial
    supabase.auth.getSession().then(r => {
      setUser(r.data.session?.user ?? null)
    })
    return () => listener?.subscription.unsubscribe()
  }, [navigate])

  return (
    <>
      <Navbar user={user}/>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>
        } />
        <Route path="/focus" element={
          <ProtectedRoute user={user}><FocusSession user={user} /></ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute user={user}><Tasks user={user} /></ProtectedRoute>
        } />
      </Routes>
    </>
  )
}
