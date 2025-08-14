import { NextRequest, NextResponse } from 'next/server';
import { backgroundJobManager } from '@/lib/background-jobs';

// GET - Get all background job statuses
export async function GET() {
  try {
    const jobs = backgroundJobManager.getAllJobs();
    
    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => ({
        ...job,
        lastRun: job.lastRun?.toISOString(),
        nextRun: job.nextRun?.toISOString()
      }))
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error getting background jobs:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - Control background jobs (start/stop/execute)
export async function POST(request: NextRequest) {
  try {
    const { action, jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { status: 400 });
    }

    let result: boolean | void = false;
    let message = '';

    switch (action) {
      case 'start':
        result = await backgroundJobManager.startJob(jobId);
        message = result ? `Job ${jobId} started` : `Failed to start job ${jobId}`;
        break;
        
      case 'stop':
        result = backgroundJobManager.stopJob(jobId);
        message = result ? `Job ${jobId} stopped` : `Failed to stop job ${jobId}`;
        break;
        
      case 'execute':
        await backgroundJobManager.executeJobNow(jobId);
        result = true;
        message = `Job ${jobId} executed`;
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, stop, or execute'
        }, { status: 400 });
    }

    // Get updated job status
    const jobStatus = backgroundJobManager.getJobStatus(jobId);

    return NextResponse.json({
      success: !!result,
      message,
      job: jobStatus ? {
        ...jobStatus,
        lastRun: jobStatus.lastRun?.toISOString(),
        nextRun: jobStatus.nextRun?.toISOString()
      } : null
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error controlling background job:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}
