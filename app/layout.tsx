import type { Metadata } from 'next'
import './globals.css'
import AuthButton from './components/AuthButton'

export const metadata: Metadata = {
  title: 'GrokVsHumans Arena',
  description: 'Real-time Grok vs Humans Arena',
  icons: {
    icon: '/assets/images/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Main Header - Logo + Filter Bar + Auth */}
        <header style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(10, 10, 31, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.2)'
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px'
          }}>
            {/* Left: Logo + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: '700',
                  color: '#fff',
                  boxShadow: '0 0 0 4px rgba(168, 85, 247, 0.3)'
                }}>
                  G
                </div>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  letterSpacing: '-0.04em'
                }}>
                  GrokVsHumans
                </span>
              </a>
            </div>

            {/* Center: Sticky Filter Bar */}
            <div id="filter-bar" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(24, 24, 27, 0.8)',
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '1px solid #27272a'
            }}>
              {/* Filter tabs will be injected here by page.tsx */}
            </div>

            {/* Right: Auth */}
            <AuthButton />
          </div>
        </header>

        <main style={{ paddingTop: '64px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}