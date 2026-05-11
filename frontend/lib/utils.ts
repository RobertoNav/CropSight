export function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function truncateText(
  text: string,
  maxLength = 100
) {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength) + "...";
}