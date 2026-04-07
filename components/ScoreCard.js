// components/ScoreCard.js
// ─────────────────────────────────────────────────────────
// Displays a single score as a coloured circle
// Green = good, Yellow = ok, Red = bad
// ─────────────────────────────────────────────────────────

export default function ScoreCard({ label, score }) {
  
  // Figure out what color to show based on the score
  const getColor = (score) => {
    if (score >= 70) return {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-400',
      label: '✅ Good'
    }
    if (score >= 50) return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-400',
      label: '⚠️ Needs Work'
    }
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-400',
      label: '❌ Poor'
    }
  }

  const colors = getColor(score)

  return (
    <div className={`
      flex flex-col items-center justify-center 
      p-4 rounded-xl border-2 ${colors.border} ${colors.bg}
      min-w-[120px]
    `}>
      {/* The big score number */}
      <span className={`text-4xl font-bold ${colors.text}`}>
        {score}
      </span>
      
      {/* Out of 100 */}
      <span className={`text-sm ${colors.text} font-medium`}>
        / 100
      </span>
      
      {/* Category name */}
      <span className="text-gray-600 text-sm mt-1 text-center font-medium">
        {label}
      </span>
      
      {/* Good/Needs Work/Poor label */}
      <span className={`text-xs mt-1 ${colors.text}`}>
        {colors.label}
      </span>
    </div>
  )
}