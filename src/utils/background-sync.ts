// ABOUTME: Background sync implementation for failed requests
// Queues and retries failed network requests when connectivity returns

export class BackgroundSyncManager {
  private queue: Request[] = []

  async queueRequest(request: Request): Promise<void> {
    this.queue.push(request)
  }

  getQueueLength(): number {
    return this.queue.length
  }

  async processQueue(): Promise<void> {
    const pendingRequests = [...this.queue]
    this.queue = []

    await Promise.all(
      pendingRequests.map(async (request) => {
        try {
          await fetch(request)
        } catch {
          // Re-queue failed requests
          this.queue.push(request)
        }
      })
    )
  }
}
