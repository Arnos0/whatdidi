/**
 * Calculate Levenshtein distance between two strings
 * Lower distance means more similar strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  // Limit string length to prevent DoS
  const maxLength = 100
  const s1 = str1.slice(0, maxLength).toLowerCase()
  const s2 = str2.slice(0, maxLength).toLowerCase()
  
  const distances: number[][] = []

  // Initialize the distance matrix
  for (let i = 0; i <= s1.length; i++) {
    distances[i] = [i]
  }
  
  for (let j = 0; j <= s2.length; j++) {
    distances[0][j] = j
  }

  // Calculate distances
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        distances[i][j] = distances[i - 1][j - 1]
      } else {
        distances[i][j] = Math.min(
          distances[i - 1][j] + 1,    // deletion
          distances[i][j - 1] + 1,    // insertion
          distances[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  return distances[s1.length][s2.length]
}

/**
 * Calculate similarity percentage between two strings
 * Returns a value between 0 and 1 (1 being identical)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2)
  const maxLength = Math.max(str1.length, str2.length)
  
  if (maxLength === 0) return 1
  
  return 1 - (distance / maxLength)
}

/**
 * Find similar strings from a list
 * Returns strings with similarity above the threshold
 */
export function findSimilarStrings(
  target: string, 
  options: string[], 
  threshold: number = 0.8
): Array<{ value: string; similarity: number }> {
  return options
    .map(option => ({
      value: option,
      similarity: stringSimilarity(target, option)
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
}

/**
 * Normalize retailer name for comparison
 * Removes special characters and normalizes spacing
 */
export function normalizeRetailerName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphen
    .replace(/\s+/g, ' ')     // Normalize multiple spaces to single space
}