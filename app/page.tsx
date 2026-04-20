'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Thread {
  id: string
  title: string
  content: string
  category: string
  author: string
  votes_human: number
  votes_grok: number
  created_at: string
}

export default function Arena() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchThreads() {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching threads:', error)
      } else {
        setThreads(data || [])
      }
      setLoading(false)
    }

    fetchThreads()
  }, [])

  if (loading) {
    return <div className="container">Loading threads...</div>
  }

  return (
    <div className="container">
      <h1>GrokVsHumans Arena</h1>
      <p>{threads.length} threads loaded from your old data</p>

      <div style={{ marginTop: '40px' }}>
        {threads.map((thread) => (
          <div key={thread.id} style={{ 
            border: '1px solid #333', 
            padding: '20px', 
            marginBottom: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ color: '#888', fontSize: '14px' }}>
              {thread.category} • {thread.author || 'Anonymous'}
            </div>
            <h2 style={{ margin: '10px 0' }}>{thread.title}</h2>
            <p>{thread.content}</p>
            <div style={{ marginTop: '15px', color: '#888' }}>
              Human: {thread.votes_human} | Grok: {thread.votes_grok}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}