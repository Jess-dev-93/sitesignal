import { getScoreStyles } from '../lib/scoreColors'

export default function ScoreCard({ label, score }) {
  const styles = getScoreStyles(score)
  const safeScore = styles.score

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white/[0.03] p-4 transition-all duration-200 hover:bg-white/[0.05] sm:p-5 ${styles.ring} ${styles.glow}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-[0.03]"
      />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles.badge}`}
          >
            {styles.icon} {styles.label}
          </span>
        </div>

        <div className="flex items-end gap-1.5">
          <span className={`text-4xl font-bold leading-none tabular-nums ${styles.text}`}>
            {safeScore}
          </span>
          <span className="mb-1 text-xs font-medium text-slate-500">/100</span>
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${styles.bar}`}
            style={{ width: `${safeScore}%` }}
          />
        </div>
      </div>
    </div>
  )
}