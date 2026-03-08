import Link from 'next/link'
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white">Autopilot</h1>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton>
              <button className="px-6 py-2 bg-white text-purple-900 rounded-full font-semibold hover:bg-gray-100 transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          Your Personal Brand,<br />
          <span className="text-purple-400">Autopilot</span>
        </h2>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          AI-powered social media management. Schedule posts, generate content, 
          and grow your Twitter presence—on autopilot.
        </p>
        <div className="flex gap-4 justify-center">
          <SignedOut>
            <SignInButton>
              <button className="px-8 py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition">
                Get Started Free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link 
              href="/dashboard"
              className="px-8 py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition"
            >
              Go to Dashboard
            </Link>
          </SignedIn>
          <button className="px-8 py-4 border border-white text-white rounded-full font-semibold text-lg hover:bg-white/10 transition">
            Learn More
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          { title: 'Connect X', desc: 'Link your Twitter account securely via OAuth' },
          { title: 'AI Generation', desc: 'Let AI create engaging content for you' },
          { title: 'Schedule Posts', desc: 'Queue posts for optimal engagement times' },
        ].map((feature, i) => (
          <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-300">{feature.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
