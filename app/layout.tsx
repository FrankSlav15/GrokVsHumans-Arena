import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GrokVsHumans Arena',
  description: 'Real-time Grok vs Humans Arena',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}