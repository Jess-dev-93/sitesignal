// app/page.js
// ─────────────────────────────────────────────────────────
// The main page that ties everything together
// Handles state and calls the API
// ─────────────────────────────────────────────────────────

'use client'
import { useState } from 'react'
import AuditForm from '../components/AuditForm'
import AuditReport from '../components/AuditReport'
import ScoreCard from '../components/ScoreCard'

export default function Home() {
  // State variables - these store our data
  const [isLoading, setIsLoading] = useState(false)    // Is scan running?
  const [auditData, setAuditData] = useState(null)     // The results
  const [error, setError] = useState('')               // Any errors

  // This runs when the user clicks Scan
  const handleAudit = async (url) => {
    // Reset everything first
    setIsLoading(true)
    setError('')
    setAuditData(null)

    try {
      // Call our API route
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      // Check if the API returned an error
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Scan failed. Please try again.')
      }

      // All good! Save the results
      setAuditData(data)

    } catch (err) {
      setError(err.message)
    } finally {
      // Always stop the loading spinner
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950">
      
      {/* Header */}
      <header className="border-b border-white border-opacity-10 bg-white bg-opacity-5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              🎯 Client Finder
            </h1>
            <p className="text-blue-300 text-xs">Website Audit Tool</p>
          </div>
          <div className="text-right">
            <p className="text-white text-sm font-medium">Your Name</p>
            <p className="text-blue-300 text-xs">Web Developer</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        
        {/* Hero Text */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-3">
            Website Audit Tool
          </h2>
          <p className="text-blue-300 text-lg max-w-xl mx-auto">
            Get an instant audit of any website. 
            Find performance issues, SEO problems and more in 60 seconds.
          </p>
        </div>

        {/* The Form */}
        <AuditForm onSubmit={handleAudit} isLoading={isLoading} />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-700">
            <p className="font-bold">❌ Scan Failed</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 text-red-500">
              Common causes: Website is down, blocks scanners, or the URL is incorrect.
            </p>
          </div>
        )}

        {/* Results */}
        {auditData && (
          <div className="space-y-6">
            
            {/* Score Cards Row */}
            <div className="bg-white bg-opacity-10 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 text-lg">
                📊 Scores at a Glance — {auditData.url}
              </h3>
              
              {/* Overall Score - big and prominent */}
              <div className="text-center mb-6">
                <div className={`
                  inline-flex items-center justify-center w-28 h-28 rounded-full border-4 text-white
                  ${auditData.scores.overallScore >= 70 ? 'border-green-400 bg-green-500 bg-opacity-30' :
                    auditData.scores.overallScore >= 50 ? 'border-yellow-400 bg-yellow-500 bg-opacity-30' :
                    'border-red-400 bg-red-500 bg-opacity-30'}
                `}>
                  <div>
                    <div className="text-4xl font-bold">{auditData.scores.overallScore}</div>
                    <div className="text-xs opacity-80">Overall</div>
                  </div>
                </div>
                <p className="text-white text-sm mt-2 opacity-70">
                  Overall Score (average of all categories, mobile)
                </p>
              </div>

              {/* Individual Score Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ScoreCard label="Performance" score={auditData.scores.mobile.performance} />
                <ScoreCard label="SEO" score={auditData.scores.mobile.seo} />
                <ScoreCard label="Accessibility" score={auditData.scores.mobile.accessibility} />
                <ScoreCard label="Best Practices" score={auditData.scores.mobile.bestPractices} />
              </div>

              {/* Mobile vs Desktop comparison */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-white bg-opacity-10 rounded-xl p-3 text-center">
                  <p className="text-blue-300 text-xs mb-1">📱 Mobile Performance</p>
                  <p className={`text-2xl font-bold ${
                    auditData.scores.mobile.performance >= 70 ? 'text-green-400' :
                    auditData.scores.mobile.performance >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {auditData.scores.mobile.performance}/100
                  </p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-xl p-3 text-center">
                  <p className="text-blue-300 text-xs mb-1">🖥️ Desktop Performance</p>
                  <p className={`text-2xl font-bold ${
                    auditData.scores.desktop.performance >= 70 ? 'text-green-400' :
                    auditData.scores.desktop.performance >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {auditData.scores.desktop.performance}/100
                  </p>
                </div>
              </div>
            </div>

            {/* The Full AI Report */}
            <AuditReport 
              report={auditData.aiReport}
              url={auditData.url}
              scores={auditData.scores}
            />

          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-blue-400 text-xs pb-6">
          <p>Client Finder — Built for finding clients & winning work 🚀</p>
        </footer>
      </div>
    </main>
  )
}