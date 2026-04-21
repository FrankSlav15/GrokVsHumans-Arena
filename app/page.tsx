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

  // Rotating Background (from your old common.js)
  useEffect(() => {
    const bgs = [
      '/assets/images/backgrounds/bg1.webp','/assets/images/backgrounds/bg2.webp',
      '/assets/images/backgrounds/bg3.webp','/assets/images/backgrounds/bg4.webp',
      '/assets/images/backgrounds/bg5.webp','/assets/images/backgrounds/bg6.webp',
      '/assets/images/backgrounds/bg7.webp','/assets/images/backgrounds/bg8.webp',
      '/assets/images/backgrounds/bg9.webp','/assets/images/backgrounds/bg10.webp',
      '/assets/images/backgrounds/bg11.webp','/assets/images/backgrounds/bg12.webp',
      '/assets/images/backgrounds/bg13.webp','/assets/images/backgrounds/bg14.webp',
      '/assets/images/backgrounds/bg15.webp','/assets/images/backgrounds/bg16.webp',
      '/assets/images/backgrounds/bg17.webp','/assets/images/backgrounds/bg18.webp',
      '/assets/images/backgrounds/bg19.webp','/assets/images/backgrounds/bg20.webp'
    ]
    const randomBg = bgs[Math.floor(Math.random() * bgs.length)]
    document.body.style.backgroundImage = `url('${randomBg}')`
    document.body.style.backgroundPosition = '50% 35%'
    document.body.style.backgroundSize = 'cover'
    document.body.style.backgroundRepeat = 'no-repeat'
    document.body.style.backgroundAttachment = 'fixed'
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

  // Infinite scroll
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
    <div className="container" style={{ paddingTop: '6rem' }}>
      {/* Hero Title matching old site style */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="page__title">GrokVsHumans Arena</h1>
        <p style={{ color: '#e5e7eb', fontSize: '1.25rem' }}>
          {filteredThreads.length} threads • Real-time Grok vs Humans
        </p>
      </div>

      {/* Filter Tabs (styled like old sticky tabs) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
              borderRadius: '9999px',
              background: filter === tab.value ? 'var(--purple)' : '#18181b',
              color: filter === tab.value ? '#fff' : '#e5e7eb',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Infinite Scroll Grid (old card style) */}
      <div className="content-grid">
        {filteredThreads.map((thread) => (
          <div 
            key={thread.id} 
            onClick={() => setSelectedThread(thread)}
            className="card"
          >
            <div className="card__media">
              {thread.image && <img src={thread.image} alt={thread.title} />}
            </div>
            <div className="card__content">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ 
                  background: thread.type === 'battle' ? '#4ade80' : thread.type === 'meme' ? '#fbbf24' : '#60a5fa',
                  color: '#000',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {thread.type.toUpperCase()}
                </span>
              </div>

              <h3 className="card__title">{thread.title}</h3>
              <p className="card__description">{thread.description || thread.content}</p>
            </div>

            {thread.type === 'battle' && (
              <div className="card__vote-bar">
                <div 
                  onClick={(e) => { e.stopPropagation(); handleVote(thread.id, 'human') }}
                  className="human-bar"
                >
                  Human <span className="vote-count">{thread.votes_human}</span>
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); handleVote(thread.id, 'grok') }}
                  className="grok-bar"
                >
                  Grok <span className="vote-count">{thread.votes_grok}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} style={{ height: '60px', marginTop: '20px', textAlign: 'center', color: '#666' }}>
        {hasMore ? 'Loading more threads...' : 'No more threads'}
      </div>

      {/* Thread Detail Modal (old style) */}
      {selectedThread && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setSelectedThread(null)}>
          <div className="modal__content" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedThread(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer' }}
            >
              ×
            </button>

            <div style={{ padding: '32px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ 
                  background: selectedThread.type === 'battle' ? '#4ade80' : selectedThread.type === 'meme' ? '#fbbf24' : '#60a5fa',
                  color: '#000',
                  padding: '6px 14px',
                  borderRadius: '9999px',
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

              {/* Thread Conversation Placeholder */}
              <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#888' }}>Conversation Thread</h3>
                <div style={{ color: '#ccc', lineHeight: '1.7' }}>
                  {selectedThread.content || 'Full thread conversation will appear here.'}
                </div>
              </div>

              {selectedThread.x_link && (
                <a 
                  href={selectedThread.x_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  View full thread on X →
                </a>
              )}

              {selectedThread.type === 'battle' && (
                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button 
                    onClick={() => handleVote(selectedThread.id, 'human')}
                    style={{ flex: 1, padding: '16px', background: '#9f1239', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}
                  >
                    🧑 Human Wins ({selectedThread.votes_human})
                  </button>
                  <button 
                    onClick={() => handleVote(selectedThread.id, 'grok')}
                    style={{ flex: 1, padding: '16px', background: '#6b21a8', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}
                  >
                    🤖 Grok Wins ({selectedThread.votes_grok})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}