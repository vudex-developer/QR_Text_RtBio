export function getSurveyUrl(pageUrl) {
  return `${String(pageUrl).split("#")[0]}#/survey`;
}

export function getQrImageUrl(value) {
  return `https://quickchart.io/qr?text=${encodeURIComponent(value)}&size=800&margin=2`;
}
