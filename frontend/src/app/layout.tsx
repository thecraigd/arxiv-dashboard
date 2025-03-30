import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Safety arXiv Trends Dashboard',
  description: 'Track trends in AI research papers from arXiv, with a focus on AI Safety',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header className="bg-primary-700 text-white py-4 shadow-md">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold">AI Safety arXiv Trends Dashboard</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-gray-100 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>Data sourced from <a href="https://arxiv.org/" className="text-primary-600 hover:underline">arXiv.org</a></p>
            <p className="mt-2 text-sm">
              Updated daily via GitHub Actions | 
              <a href="https://github.com/your-username/arxiv-dashboard" className="text-primary-600 hover:underline ml-1">
                View on GitHub
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}