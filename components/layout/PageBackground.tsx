/** Ambient gradient orbs — matches the marketing home page. */
export default function PageBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="absolute top-[35%] right-[-200px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
    </div>
  )
}
