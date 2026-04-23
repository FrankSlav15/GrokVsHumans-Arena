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
        {/* Clean Header - Logo + Title + Auth */}
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
            justifyContent: 'space-between'
          }}>
            {/* Left: Logo + Title */}
            <a href="/" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              textDecoration: 'none', 
              color: '#fff' 
            }}>
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

            {/* Right: Auth Button */}
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