'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [user, setUser] = useState<any>(null)
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch threads with pagination
  const fetchThreads = async (pageNum: number) => {
    const from = (pageNum - 1) * 12
    const to = from + 11

    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error:', error)
      return []
    }

    return data || []
  }

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      const initialThreads = await fetchThreads(1)
      setThreads(initialThreads)
      setLoading(false)
      setHasMore(initialThreads.length === 12)
    }
    loadInitial()
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1
          const newThreads = await fetchThreads(nextPage)
          
          if (newThreads.length > 0) {
            setThreads(prev => [...prev, ...newThreads])
            setPage(nextPage)
            setHasMore(newThreads.length === 12)
          } else {
            setHasMore(false)
          }
        }
      },
      { threshold: 1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [page, hasMore, loading])

  const filteredThreads = filter === 'all' 
    ? threads 
    : threads.filter(t => t.type === filter)

  const handleVote = async (id: string, voteType: 'human' | 'grok') => {
    if (!user) {
      alert('Please login with X to vote!')
      return
    }

    const thread = threads.find(t => t.id === id)
    if (!thread || thread.type !== 'battle') return

    const update = voteType === 'human' 
      ? { votes_human: thread.votes_human + 1 }
      : { votes_grok: thread.votes_grok + 1 }

    await supabase.from('threads').update(update).eq('id', id)
    setThreads(threads.map(t => t.id === id ? { ...t, ...update } : t))
  }

  const handleXLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: { redirectTo: window.location.origin }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading && threads.length === 0) {
    return <div className="container">Loading Arena...</div>
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '5px' }}>GrokVsHumans Arena</h1>
          <p style={{ color: '#888' }}>{filteredThreads.length} threads • Real-time Grok vs Humans</p>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#888' }}>Logged in as @{user.user_metadata?.user_name}</span>
            <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        ) : (
          <button onClick={handleXLogin} style={{ padding: '12px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            🐦 Login with X
          </button>
        )}
      </div>

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

      {/* Infinite Scroll Grid */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {filteredThreads.map((thread) => (
          <div 
            key={thread.id} 
            onClick={() => setSelectedThread(thread)}
            style={{
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '24px',
              background: '#111',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ 
                background: thread.type === 'battle' ? '#4ade80' : thread.type === 'meme' ? '#fbbf24' : '#60a5fa',
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
            <p style={{ color: '#ccc', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {thread.description || thread.content}
            </p>

            {thread.image && (
              <img 
                src={thread.image} 
                alt={thread.title}
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '16px' }}
              />
            )}

            {thread.type === 'battle' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#1a1a1a', borderRadius: '6px' }}>
                  🧑 {thread.votes_human}
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: '#1a1a1a', borderRadius: '6px' }}>
                  🤖 {thread.votes_grok}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} style={{ height: '50px', marginTop: '40px' }}>
        {hasMore && <div style={{ textAlign: 'center', color: '#666' }}>Loading more...</div>}
        {!hasMore && threads.length > 0 && <div style={{ textAlign: 'center', color: '#666' }}>No more threads</div>}
      </div>

      {/* Thread Detail Modal */}
      {selectedThread && (
        <div 
          onClick={() => setSelectedThread(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111',
              borderRadius: '16px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px'
            }}
          >
            <button 
              onClick={() => setSelectedThread(null)}
              style={{ float: 'right', background: 'none', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer' }}
            >
              ×
            </button>

            <div style={{ marginBottom: '24px' }}>
              <span style={{ 
                background: selectedThread.type === 'battle' ? '#4ade80' : selectedThread.type === 'meme' ? '#fbbf24' : '#60a5fa',
                color: '#000',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold'
              }}>
                {selectedThread.type.toUpperCase()}
              </span>
            </div>

            <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>{selectedThread.title}</h1>
            
            <p style={{ fontSize: '1.1rem', color: '#ccc', lineHeight: '1.7', marginBottom: '24px' }}>
              {selectedThread.description || selectedThread.content}
            </p>

            {selectedThread.image && (
              <img 
                src={selectedThread.image} 
                alt={selectedThread.title}
                style={{ width: '100%', borderRadius: '12px', marginBottom: '24px' }}
              />
            )}

            {/* Thread Conversation View */}
            <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#888' }}>Conversation Thread</h3>
              <div style={{ color: '#ccc', lineHeight: '1.7' }}>
                {selectedThread.content || 'Full thread conversation will be displayed here. The back-and-forth between humans and Grok is captured in the original data.'}
              </div>
            </div>

            {selectedThread.x_link && (
              <a 
                href={selectedThread.x_link} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}
              >
                View full thread on X →
              </a>
            )}

            {selectedThread.type === 'battle' && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <button 
                  onClick={() => handleVote(selectedThread.id, 'human')}
                  style={{ flex: 1, padding: '16px', background: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}
                >
                  🧑 Human Wins ({selectedThread.votes_human})
                </button>
                <button 
                  onClick={() => handleVote(selectedThread.id, 'grok')}
                  style={{ flex: 1, padding: '16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}
                >
                  🤖 Grok Wins ({selectedThread.votes_grok})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}