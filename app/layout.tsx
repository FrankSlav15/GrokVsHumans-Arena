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
        <header className="header">
          <div className="header__inner">
            <div className="header__logo-row">
              <a href="/" className="header__logo-link">
                <div className="header__logo-circle">G</div>
                <span className="header__title">GrokVsHumans</span>
              </a>
            </div>

            <nav className="header__nav">
              <a href="#all" className="nav-link">All</a>
              <a href="#battles" className="nav-link">Battles</a>
              <a href="#memes" className="nav-link">Memes</a>
              <a href="#ai" className="nav-link">AI Content</a>
            </nav>

            <AuthButton />
          </div>
        </header>

        <main>{children}</main>

        <footer className="footer">
          <div className="footer__container">
            <p>© {new Date().getFullYear()} GrokVsHumans • Built with ❤️ for the community</p>
          </div>
        </footer>
      </body>
    </html>
  )
}