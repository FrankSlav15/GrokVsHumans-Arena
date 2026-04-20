'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Thread {
  id: string
  type: 'battle' | 'meme' | 'ai_content'
  title: string
  description: string
  content: string
  image: string
  tags: string
  x_link: string
  author: string
  votes_human: number
  votes_grok: number
  created_at: string
}

export default function Arena() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [filter, setFilter] = useState<'all' | 'battle' | 'meme' | 'ai_content'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchThreads() {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error:', error)
      } else {
        setThreads(data || [])
      }
      setLoading(false)
    }

    fetchThreads()
  }, [])

  const filteredThreads = filter === 'all' 
    ? threads 
    : threads.filter(t => t.type === filter)

  const handleVote = async (id: string, voteType: 'human' | 'grok') => {
    const thread = threads.find(t => t.id === id)
    if (!thread || thread.type !== 'battle') return

    const update = voteType === 'human' 
      ? { votes_human: thread.votes_human + 1 }
      : { votes_grok: thread.votes_grok + 1 }

    const { error } = await supabase
      .from('threads')
      .update(update)
      .eq('id', id)

    if (!error) {
      setThreads(threads.map(t => 
        t.id === id 
          ? { ...t, ...update }
          : t
      ))
    }
  }

  if (loading) {
    return <div className="container">Loading Arena...</div>
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>GrokVsHumans Arena</h1>
      <p style={{ color: '#888', marginBottom: '30px' }}>
        {filteredThreads.length} threads • Real-time Grok vs Humans
      </p>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {[
          { label: 'All', value: 'all' },
          { label: 'Battles (Vote)', value: 'battle' },
          { label: 'Memes', value: 'meme' },
          { label: 'AI Content', value: 'ai_content' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              background: filter === tab.value ? '#fff' : '#222',
              color: filter === tab.value ? '#000' : '#fff',
              cursor: 'pointer',
              fontWeight: filter === tab.value ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Threads Grid */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {filteredThreads.map((thread) => (
          <div key={thread.id} style={{
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '24px',
            background: '#111'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ 
                background: thread.type === 'battle' ? '#4ade80' : 
                           thread.type === 'meme' ? '#fbbf24' : '#60a5fa',
                color: '#000',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {thread.type.toUpperCase()}
              </span>
              <span style={{ color: '#666', fontSize: '14px' }}>
                {new Date(thread.created_at).toLocaleDateString()}
              </span>
            </div>

            <h2 style={{ margin: '0 0 12px 0', fontSize: '1.4rem' }}>{thread.title}</h2>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>{thread.description || thread.content}</p>

            {thread.image && (
              <img 
                src={thread.image} 
                alt={thread.title}
                style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', marginTop: '16px' }}
              />
            )}

            {/* Voting (only for battles) */}
            {thread.type === 'battle' && (
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #333'
              }}>
                <button 
                  onClick={() => handleVote(thread.id, 'human')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#22c55e',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🧑 Human W ({thread.votes_human})
                </button>
                <button 
                  onClick={() => handleVote(thread.id, 'grok')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🤖 Grok W ({thread.votes_grok})
                </button>
              </div>
            )}

            {thread.x_link && (
              <a 
                href={thread.x_link} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: '16px', color: '#3b82f6', textDecoration: 'none' }}
              >
                View on X →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}