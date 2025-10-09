export function isGoodReason(reason = '') {
  const r = reason.trim().toLowerCase();
  if (!r) return false;

  // Common low-effort phrases that shouldn't pass
  const badPhrases = [
    'idk',
    "i don't know",
    'dont know',
    'bored',
    'no reason',
    'just because',
    'because',
    'why not'
  ];
  if (badPhrases.some(p => r.includes(p))) return false;

  // Keywords that usually indicate a specific task
  const goodKeywords = [
    'homework',
    'assignment',
    'project',
    'deadline',
    'work',
    'study',
    'research',
    'school',
    'urgent'
  ];
  if (goodKeywords.some(k => r.includes(k))) return true;

  // Fallback heuristic: require at least 5 words
  return r.split(/\s+/).length >= 5;
}
