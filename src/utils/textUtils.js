export const formatNameInput = (value = '') => {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b([a-z])/g, (character) => character.toUpperCase())
}
