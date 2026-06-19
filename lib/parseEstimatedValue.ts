export function parseEstimatedValue(value?: string | null): number {
  if (!value) return 0

  const numbers = value
    .match(/[\d,]+/g)
    ?.map((part) => parseInt(part.replace(/,/g, ''), 10))
    .filter((num) => !Number.isNaN(num))

  if (!numbers?.length) return 0
  if (numbers.length === 1) return numbers[0]

  const low = numbers[0]
  const high = numbers[numbers.length - 1]
  return Math.round((low + high) / 2)
}

export function formatPipelineValue(total: number): string {
  if (total <= 0) return '$0'
  if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`
  if (total >= 1_000) return `$${(total / 1_000).toFixed(1)}k`
  return `$${total.toLocaleString('en-AU')}`
}
