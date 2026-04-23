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
  // New fields for reactions (we'll add these to Supabase later)
  reactions?: {
    like: number
    dislike: number
    wut: number
    funny: number
    savage: number
    fatality: number
  }
  comment_count?: number
}

type OrderBy = 'newest' | 'oldest' | 'most_reactions' | 'most_comments'

export default function Arena() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [filter, setFilter] = useState<'all' | 'battle' | 'meme' | 'ai_content'>('all')
  const [orderBy, setOrderBy] = useState<OrderBy>('newest')
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

  // Fetch threads
  const fetchThreads = async (pageNum: number) => {
    const from = (pageNum - 1) * 10
    const to = from + 9

    let query = supabase
      .from('threads')
      .select('*')
      .range(from, to)

    // Apply ordering
    switch (orderBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'most_reactions':
        // For now using votes_human + votes_grok as proxy
        query = query.order('votes_human', { ascending: false })
        break
      case 'most_comments':
        query = query.order('created_at', { ascending: false }) // placeholder
        break
    }

    const { data, error } = await query

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
      setHasMore(initialThreads.length === 10)
    }
    loadInitial()
  }, [orderBy]) // Reload when order changes

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
            setHasMore(newThreads.length === 10)
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
  }, [page, hasMore, loading, orderBy])

  const filteredThreads = filter === 'all' 
    ? threads 
    : threads.filter(t => t.type === filter)

  const handleReaction = async (id: string, reaction: 'like' | 'dislike' | 'wut' | 'funny' | 'savage' | 'fatality') => {
    if (!user) {
      alert('Please login with X to react!')
      return
    }

    // For now, we'll just increment votes_human as a placeholder
    // Later we'll add a proper reactions table
    const thread = threads.find(t => t.id === id)
    if (!thread) return

    const { error } = await supabase
      .from('threads')
      .update({ votes_human: thread.votes_human + 1 })
      .eq('id', id)

    if (!error) {
      setThreads(threads.map(t => 
        t.id === id ? { ...t, votes_human: t.votes_human + 1 } : t
      ))
    }
  }

  const handleXLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'x',
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
    <div style={{ paddingTop: '4rem' }}>
      {/* Sticky Filter Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10, 10, 31, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
        padding: '12px 0'
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
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
                  background: filter === tab.value ? '#a855f7' : '#18181b',
                  color: filter === tab.value ? '#fff' : '#e5e7eb',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ordering Dropdown */}
          <select 
            value={orderBy} 
            onChange={(e) => setOrderBy(e.target.value as OrderBy)}
            style={{
              padding: '10px 16px',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#e5e7eb',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_reactions">Most Reactions</option>
            <option value="most_comments">Most Comments</option>
          </select>

          <div style={{ flex: 1 }} />

          {/* Auth */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
                @{user.user_metadata?.user_name}
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
          ) : (
            <button 
              onClick={handleXLogin}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(90deg, #a855f7, #22d3ee)',
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
          )}
        </div>
      </div>

      // ... keep all your existing imports and logic ...

return (
  <div>
    {/* Hero Section */}
    <div style={{ 
      textAlign: 'center', 
      padding: '80px 24px 60px',
      background: 'linear-gradient(180deg, rgba(168,85,247,0.08) 0%, transparent 100%)'
    }}>
      <h1 style={{ 
        fontSize: '3.5rem', 
        fontWeight: 700, 
        marginBottom: '12px',
        background: 'linear-gradient(90deg, #fff, #e5e7eb)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        GrokVsHumans Arena
      </h1>
      <p style={{ color: '#a1a1aa', fontSize: '1.1rem' }}>
        {filteredThreads.length} threads • Real-time Grok vs Humans
      </p>
    </div>

    {/* Filter Bar - Now rendered in layout, but we can add ordering here if needed */}
    {/* The sticky filter bar is in layout.tsx - we just need to make sure the tabs work */}
    
    {/* ... rest of your content (single column thread feed) ... */}
  </div>
)

      {/* Single Column Thread Feed */}
      <div style={{ 
        maxWidth: '720px', 
        margin: '0 auto', 
        padding: '0 24px 80px'
      }}>
        {filteredThreads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
            No threads found in this category.
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div 
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                marginBottom: '20px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#a855f7'
                e.currentTarget.style.boxShadow = '0 0 30px rgba(168,85,247,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#27272a'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Thread Header */}
              <div style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ 
                  background: thread.type === 'battle' ? '#22c55e' : 
                             thread.type === 'meme' ? '#fbbf24' : '#60a5fa',
                  color: '#000',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {thread.type.toUpperCase()}
                </span>
                <span style={{ color: '#666', fontSize: '13px' }}>
                  {new Date(thread.created_at).toLocaleDateString()}
                </span>
                <div style={{ flex: 1 }} />
                {thread.x_link && (
                  <a 
                    href={thread.x_link} 
                    target="_blank" 
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#3b82f6', fontSize: '13px', textDecoration: 'none' }}
                  >
                    View on X →
                  </a>
                )}
              </div>

              {/* Thread Content */}
              <div style={{ padding: '20px' }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  lineHeight: 1.3
                }}>
                  {thread.title}
                </h3>
                
                <p style={{ 
                  color: '#a1a1aa', 
                  fontSize: '15px', 
                  lineHeight: 1.6,
                  marginBottom: '16px'
                }}>
                  {thread.description || thread.content}
                </p>

                {thread.image && (
                  <img 
                    src={thread.image} 
                    alt={thread.title}
                    style={{ 
                      width: '100%', 
                      borderRadius: '12px', 
                      marginBottom: '16px',
                      maxHeight: '400px',
                      objectFit: 'cover'
                    }}
                  />
                )}
              </div>

              {/* Reaction Bar */}
              <div style={{ 
                display: 'flex', 
                borderTop: '1px solid #27272a',
                background: '#111'
              }}>
                {[
                  { emoji: '👍', label: 'Like', key: 'like' },
                  { emoji: '👎', label: 'Dislike', key: 'dislike' },
                  { emoji: '😕', label: 'Wut?', key: 'wut' },
                  { emoji: '😂', label: 'Funny', key: 'funny' },
                  { emoji: '😈', label: 'Savage', key: 'savage' },
                  { emoji: '💀', label: 'Fatality', key: 'fatality' }
                ].map((r) => (
                  <button
                    key={r.key}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReaction(thread.id, r.key as any)
                    }}
                    style={{
                      flex: 1,
                      padding: '14px 8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#e5e7eb',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.1s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#222'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <span>{r.emoji}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {thread.reactions?.[r.key as keyof typeof thread.reactions] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Comments Bar */}
              <div 
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedThread(thread)
                }}
                style={{
                  padding: '12px 20px',
                  background: '#0f0f17',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#888',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                💬 {thread.comment_count || 0} comments • Click to join discussion
              </div>
            </div>
          ))
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} style={{ height: '60px', textAlign: 'center', color: '#666' }}>
          {hasMore ? 'Loading more threads...' : 'No more threads'}
        </div>
      </div>

      {/* Thread Modal */}
      {selectedThread && (
        <div 
          onClick={() => setSelectedThread(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#18181b',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '1px solid #27272a'
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ 
                background: selectedThread.type === 'battle' ? '#22c55e' : 
                           selectedThread.type === 'meme' ? '#fbbf24' : '#60a5fa',
                color: '#000',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {selectedThread.type.toUpperCase()}
              </span>
              <span style={{ color: '#666', fontSize: '14px' }}>
                {new Date(selectedThread.created_at).toLocaleDateString()}
              </span>
              <div style={{ flex: 1 }} />
              <button 
                onClick={() => setSelectedThread(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#888', 
                  fontSize: '28px',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Thread Content */}
            <div style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
                {selectedThread.title}
              </h2>
              
              <p style={{ color: '#ccc', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
                {selectedThread.description || selectedThread.content}
              </p>

              {selectedThread.image && (
                <img 
                  src={selectedThread.image} 
                  alt={selectedThread.title}
                  style={{ width: '100%', borderRadius: '12px', marginBottom: '24px' }}
                />
              )}

              {/* X Thread Preview */}
              <div style={{ 
                background: '#111', 
                borderRadius: '12px', 
                padding: '20px',
                marginBottom: '24px'
              }}>
                <div style={{ color: '#888', fontSize: '13px', marginBottom: '12px' }}>
                  📌 Original X Thread
                </div>
                <div style={{ color: '#e5e7eb', lineHeight: 1.6 }}>
                  {selectedThread.content || 'Click "View on X" to see the full conversation thread.'}
                </div>
                {selectedThread.x_link && (
                  <a 
                    href={selectedThread.x_link} 
                    target="_blank"
                    style={{ 
                      display: 'inline-block',
                      marginTop: '16px',
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    View full thread on X →
                  </a>
                )}
              </div>

              {/* Reactions */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>
                  React to this thread:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { emoji: '👍', label: 'Like', key: 'like' },
                    { emoji: '👎', label: 'Dislike', key: 'dislike' },
                    { emoji: '😕', label: 'Wut?', key: 'wut' },
                    { emoji: '😂', label: 'Funny', key: 'funny' },
                    { emoji: '😈', label: 'Savage', key: 'savage' },
                    { emoji: '💀', label: 'Fatality', key: 'fatality' }
                  ].map((r) => (
                    <button
                      key={r.key}
                      onClick={() => handleReaction(selectedThread.id, r.key as any)}
                      style={{
                        padding: '10px 16px',
                        background: '#222',
                        border: '1px solid #333',
                        borderRadius: '9999px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.label}</span>
                      <span style={{ color: '#666', fontSize: '12px' }}>
                        {selectedThread.reactions?.[r.key as keyof typeof selectedThread.reactions] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{ color: '#e5e7eb', fontWeight: '600' }}>
                    Comments ({selectedThread.comment_count || 0})
                  </div>
                  <button 
                    style={{
                      padding: '8px 16px',
                      background: '#a855f7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Comment
                  </button>
                </div>

                <div style={{ 
                  background: '#111', 
                  borderRadius: '12px', 
                  padding: '20px',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  Comments coming soon. This will allow users to discuss the thread directly on the site.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}