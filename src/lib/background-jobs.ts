// Background job management for periodic syncing
// This uses a simple interval-based approach, but could be enhanced with a proper job queue

export interface SyncJob {
  id: string;
  name: string;
  endpoint: string;
  intervalMs: number;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
  enabled: boolean;
}

export class BackgroundJobManager {
  private jobs: Map<string, SyncJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Initialize default jobs
    this.addJob({
      id: 'product-sync',
      name: 'Product Sync',
      endpoint: '/api/admin/sync',
      intervalMs: 30 * 60 * 1000, // 30 minutes
      isRunning: false,
      enabled: false // Disabled by default, can be enabled via admin
    });
  }

  addJob(job: SyncJob) {
    this.jobs.set(job.id, {
      ...job,
      nextRun: new Date(Date.now() + job.intervalMs)
    });
  }

  async startJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found`);
      return false;
    }

    if (this.intervals.has(jobId)) {
      console.log(`Job ${jobId} is already running`);
      return true;
    }

    console.log(`🚀 Starting background job: ${job.name}`);
    
    // Create interval
    const interval = setInterval(async () => {
      await this.executeJob(jobId);
    }, job.intervalMs);

    this.intervals.set(jobId, interval);
    job.enabled = true;
    job.nextRun = new Date(Date.now() + job.intervalMs);

    return true;
  }

  stopJob(jobId: string): boolean {
    const interval = this.intervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(jobId);
      
      const job = this.jobs.get(jobId);
      if (job) {
        job.enabled = false;
        job.nextRun = undefined;
      }
      
      console.log(`⏹️  Stopped background job: ${jobId}`);
      return true;
    }
    return false;
  }

  async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.isRunning) {
      return;
    }

    job.isRunning = true;
    job.lastRun = new Date();
    job.nextRun = new Date(Date.now() + job.intervalMs);

    console.log(`⚙️  Executing background job: ${job.name}`);

    try {
      // Make HTTP request to the sync endpoint
      const response = await fetch(`http://localhost:3000${job.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Background job ${job.name} completed successfully:`, result);
      } else {
        console.error(`❌ Background job ${job.name} failed:`, response.status, response.statusText);
      }
    } catch (error) {
      console.error(`❌ Background job ${job.name} error:`, error);
    } finally {
      job.isRunning = false;
    }
  }

  getJobStatus(jobId: string): SyncJob | null {
    return this.jobs.get(jobId) || null;
  }

  getAllJobs(): SyncJob[] {
    return Array.from(this.jobs.values());
  }

  async executeJobNow(jobId: string): Promise<void> {
    await this.executeJob(jobId);
  }

  // Cleanup method to stop all jobs
  stopAllJobs() {
    for (const jobId of this.intervals.keys()) {
      this.stopJob(jobId);
    }
  }
}

// Singleton instance
export const backgroundJobManager = new BackgroundJobManager();

// Auto-cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    console.log('🛑 Stopping all background jobs...');
    backgroundJobManager.stopAllJobs();
  });

  process.on('SIGTERM', () => {
    console.log('🛑 Stopping all background jobs...');
    backgroundJobManager.stopAllJobs();
  });
}
