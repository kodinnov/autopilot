import { currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div className="dashboard-main">
      <header className="dashboard-header">
        <h1>Welcome back, {user?.firstName || 'User'}!</h1>
        <p className="subtitle">Here&apos;s your social media overview</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Total Posts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">0</div>
          <div className="stat-label">AI Generated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value status-pending">Connect X</div>
          <div className="stat-label">Twitter Status</div>
        </div>
      </div>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <a href="/dashboard/compose" className="action-card">
            <span className="action-icon">✍️</span>
            <span className="action-title">Compose Post</span>
            <span className="action-desc">Write and publish a new tweet</span>
          </a>
          <a href="/dashboard/schedule" className="action-card">
            <span className="action-icon">📅</span>
            <span className="action-title">Schedule Post</span>
            <span className="action-desc">Plan your content for later</span>
          </a>
          <a href="/dashboard/connections" className="action-card">
            <span className="action-icon">🔗</span>
            <span className="action-title">Connect X</span>
            <span className="action-desc">Link your Twitter account</span>
          </a>
          <a href="/dashboard/ai" className="action-card">
            <span className="action-icon">🤖</span>
            <span className="action-title">AI Generate</span>
            <span className="action-desc">Let AI write your content</span>
          </a>
        </div>
      </section>

      <section className="recent-posts">
        <h2>Recent Posts</h2>
        <div className="posts-empty">
          <p>No posts yet. Connect your Twitter account to get started!</p>
        </div>
      </section>
    </div>
  )
}
