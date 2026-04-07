// components/AuditForm.js
// ─────────────────────────────────────────────────────────
// Simple URL input form with loading state
// ─────────────────────────────────────────────────────────

'use client'
import { useState } from 'react'

export default function AuditForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('')
  const [inputError, setInputError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setInputError('')

    // Basic check before sending
    if (!url.trim()) {
      setInputError('Please enter a website URL')
      return
    }

    // Pass the URL up to the parent component
    onSubmit(url.trim())
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        🔍 Scan a Website
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Enter any website URL to get a full audit report with scores and AI analysis
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. bobsplumbing.com.au"
              disabled={isLoading}
              className="
                flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl
                focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                disabled:bg-gray-100 disabled:cursor-not-allowed
                text-gray-800 text-sm
              "
            />
            <button
              type="submit"
              disabled={isLoading}
              className="
                bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                text-white font-medium px-6 py-3 rounded-xl
                transition-colors disabled:cursor-not-allowed
                whitespace-nowrap
              "
            >
              {isLoading ? '⏳ Scanning...' : '🚀 Scan Site'}
            </button>
          </div>
          
          {/* Error message */}
          {inputError && (
            <p className="text-red-500 text-sm mt-2">{inputError}</p>
          )}
        </div>

        {/* Examples to help the user */}
        <div className="text-xs text-gray-400">
          <span className="font-medium">Examples:</span>{' '}
          {['bobsplumbing.com.au', 'localcafe.com.au', 'sydneydentist.com.au'].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setUrl(example)}
              className="text-blue-500 hover:text-blue-700 mr-2 underline"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {/* Loading state with steps so user knows whats happening */}
      {isLoading && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-blue-700 font-medium text-sm mb-3">
            ⏳ Scanning in progress...
          </p>
          <div className="space-y-2 text-xs text-blue-600">
            <p>📊 Running Google Lighthouse tests (mobile + desktop)...</p>
            <p>🔍 Checking SEO, performance and accessibility...</p>
            <p>🤖 Generating AI report...</p>
            <p className="text-blue-400 italic mt-2">
              This takes about 30-60 seconds. Google needs to fully scan the site!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}