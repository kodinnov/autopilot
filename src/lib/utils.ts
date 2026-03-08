// Utility functions for Autopilot

// Format date for display
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format time for display
export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Validate tweet content
export function validateTweet(content: string): { valid: boolean; error?: string } {
  if (!content.trim()) {
    return { valid: false, error: 'Content cannot be empty' }
  }
  if (content.length > 280) {
    return { valid: false, error: 'Tweet must be 280 characters or less' }
  }
  return { valid: true }
}

// Generate placeholder data for demo
export function generateDemoStats() {
  return {
    totalPosts: 0,
    scheduled: 0,
    aiGenerated: 0,
    twitterConnected: false,
  }
}
