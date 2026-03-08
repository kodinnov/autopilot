import { Queue, Worker } from 'bullmq'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

// Tweet queue for scheduling posts
export const tweetQueue = new Queue('tweet-scheduler', { connection })

// Job types
export interface TweetJob {
  userId: string
  content: string
  scheduledFor: number // timestamp
  tweetId?: string // if rescheduling
}

// Add a tweet to the queue
export async function scheduleTweet(data: TweetJob) {
  const delay = data.scheduledFor - Date.now()
  
  if (delay <= 0) {
    // Post immediately if time has passed
    await tweetQueue.add('post-tweet', data, { jobId: `${data.userId}-${Date.now()}` })
  } else {
    // Schedule for future
    await tweetQueue.add('post-tweet', data, {
      delay,
      jobId: `${data.userId}-${data.scheduledFor}`,
    })
  }
}

// Process scheduled tweets
export async function startTweetWorker() {
  const worker = new Worker('tweet-scheduler', async (job) => {
    const data = job.data as TweetJob
    
    console.log(`Processing scheduled tweet for user ${data.userId}`)
    
    // Get user's tokens from database
    // const tokens = await getUserTokens(data.userId)
    // if (!tokens) throw new Error('No tokens')
    
    // Post to Twitter API
    // const response = await fetch('https://api.twitter.com/2/tweets', { ... })
    
    return { success: true }
  }, { connection })

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message)
  })

  return worker
}
