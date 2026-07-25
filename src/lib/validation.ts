/**
 * Validation utilities for common input patterns
 */

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const validateCoordinates = (latitude: number, longitude: number): boolean => {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

export const validatePhoneNumber = (phone: string): boolean => {
  return /^[\d+\-\s()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 8
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateScheduleTime = (scheduledAt: string): boolean => {
  try {
    const scheduleTime = new Date(scheduledAt)
    return scheduleTime > new Date()
  } catch {
    return false
  }
}

export const validateDelayRange = (min: number, max: number): boolean => {
  return min >= 500 && max >= 500 && min <= max
}

/**
 * Sanitize user input to prevent XSS
 * React auto-escapes by default, but explicit sanitization for safety
 */
export const sanitizeText = (text: string): string => {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Validate and normalize phone number
 */
export const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '')
}
