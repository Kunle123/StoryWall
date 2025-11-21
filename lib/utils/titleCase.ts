/**
 * Converts a string to title case (capitalizes first letter of each word)
 * Handles common exceptions like "a", "an", "the", "of", "in", etc.
 */
export function toTitleCase(str: string): string {
  if (!str || str.trim().length === 0) return str;

  // Words that should remain lowercase unless they're the first word
  const lowercaseWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with'];

  return str
    .split(/\s+/)
    .map((word, index) => {
      // Always capitalize first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      // Check if word should remain lowercase
      const lowerWord = word.toLowerCase();
      if (lowercaseWords.includes(lowerWord)) {
        return lowerWord;
      }
      
      // Capitalize other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

