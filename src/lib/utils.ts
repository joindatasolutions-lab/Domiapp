export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatOrderNumber(value: string) {
  return value.replace(/^#?FLR-/i, '#').replace(/^Pedido\s*/i, '#')
}
