'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { User, Session } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleXLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'x',
      options: {
        redirectTo: 'https://grokvshumans.de'
      }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
          @{user.user_metadata?.user_name || 'User'}
        </span>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={handleXLogin}
      style={{
        padding: '10px 20px',
        background: 'linear-gradient(90deg, rgb(168 85 247), #22d3ee)',
        color: '#000',
        border: 'none',
        borderRadius: '9999px',
        fontWeight: '600',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      🐦 Login with X
    </button>
  )
}