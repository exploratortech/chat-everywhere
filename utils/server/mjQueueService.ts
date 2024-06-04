import redis from './upstashRedisClient';

const QUEUE_KEY = 'priority_queue';
const QUEUE_INFO_KEY = 'queue_info';

interface QueueUser {
  userId: string;
  status: string;
  enqueuedAt: string;
  position: number;
}

export async function addUserToQueue(userId: string, status: string) {
  const enqueuedAt = new Date().toISOString();
  const userInfo = { userId, status, enqueuedAt };

  // Add user to the end of the list
  await redis.rpush(QUEUE_KEY, userId);

  // Store user information in a hash
  await redis.hset(`${QUEUE_INFO_KEY}:${userId}`, {
    userId,
    status,
    enqueuedAt,
  });
  console.log(`added ${userId} to queue`);
  return userInfo;
}

export async function getUserInfo(userId: string): Promise<QueueUser | null> {
  // Retrieve the entire list to find the user's position
  const userList = await redis.lrange(QUEUE_KEY, 0, -1);
  const position = userList.indexOf(userId);
  console.log({
    position,
    userId,
  });
  if (position === -1) return null; // User not found in the queue

  // Get user information from the hash
  const userInfo = await redis.hgetall(`${QUEUE_INFO_KEY}:${userId}`);
  console.log({
    userInfo,
  });
  if (!userInfo) return null;

  return {
    userId,
    position: position + 1, // Convert 0-based index to 1-based position
    enqueuedAt: userInfo.enqueuedAt as string,
    status: userInfo.status as string,
  };
}

export async function processNextUser() {
  const userId = await redis.lpop(QUEUE_KEY); // Pop from the beginning
  console.log({
    userId,
  });
  if (userId) {
    // Process the user with userId
    console.log(`Processing user ${userId}`);

    // Set status to 'processing'
    await redis.hset(`${QUEUE_INFO_KEY}:${userId}`, { status: 'processing' });

    // Sleep for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`User ${userId} processed, Now removing from queue`);

    // Remove user information from the hash
    await redis.del(`${QUEUE_INFO_KEY}:${userId}`);
    console.log(`User ${userId} removed from queue`);
  }
}
