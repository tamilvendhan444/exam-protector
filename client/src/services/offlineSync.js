const QUEUE_KEY = 'eduproctor_offline_queue';

export function queueRequest(endpoint, options) {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push({
      endpoint,
      options: {
        ...options,
        // Remove Authorization header as it will be re-added on replay by api.js
        headers: undefined
      },
      timestamp: Date.now()
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`[OfflineSync] Queued request for ${endpoint}`);
  } catch (err) {
    console.error('[OfflineSync] Failed to queue request', err);
  }
}

export async function flushQueue() {
  if (!navigator.onLine) return;
  
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (queue.length === 0) return;

  console.log(`[OfflineSync] Flushing ${queue.length} offline requests...`);
  
  // Clear queue from storage immediately to prevent duplicate flushes
  localStorage.setItem(QUEUE_KEY, '[]');
  
  const { request } = await import('./api.js');
  
  const failed = [];
  for (const item of queue) {
    try {
      await request(item.endpoint, item.options);
      console.log(`[OfflineSync] Replayed successfully: ${item.endpoint}`);
    } catch (err) {
      if (err instanceof TypeError || err.message === 'Failed to fetch') {
        // Still a network error, requeue
        failed.push(item);
      } else {
        console.error(`[OfflineSync] Hard failure replaying ${item.endpoint}`, err);
      }
    }
  }
  
  if (failed.length > 0) {
    const currentQueue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    localStorage.setItem(QUEUE_KEY, JSON.stringify([...failed, ...currentQueue]));
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flushQueue);
  if (navigator.onLine) {
    setTimeout(flushQueue, 1000);
  }
}
