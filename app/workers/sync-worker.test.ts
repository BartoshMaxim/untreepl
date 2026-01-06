import { describe, it, beforeAll } from 'vitest';
import { main } from './sync-worker';

/**
 * Simple test to run the sync-worker main function with real database data
 * 
 * Prerequisites:
 * 1. Set JOB_ID environment variable to an existing job in your database
 * 2. Ensure the job has a valid shop with session data
 * 3. Database should already contain all necessary test data
 */

describe('sync-worker main function', () => {
  beforeAll(() => {
    // Verify JOB_ID is set
    if (!process.env.JOB_ID) {
      console.log('⚠️  JOB_ID not set. Set it with: $env:JOB_ID="your-job-id"');
    }
  });

  it('should run main function with existing job', async () => {
    console.log('🚀 Running main function with JOB_ID:', process.env.JOB_ID);
    
    await main();
    
    console.log('✅ Main function completed');
  }, 300000); // 5 minute timeout
});
