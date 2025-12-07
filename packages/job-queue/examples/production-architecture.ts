/**
 * @license
 * Copyright 2025 Steven Roussey <sroussey@gmail.com>
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Example demonstrating the production-grade client-server-worker architecture
 */

import { Job, JobQueueClient, JobQueueServer } from "@workglow/job-queue";
import { InMemoryQueueStorage } from "@workglow/storage";
import { IJobExecuteContext } from "@workglow/job-queue";

// Define job types
interface ImageInput {
  url: string;
  format: "webp" | "jpg" | "png";
}

interface ImageOutput {
  processedUrl: string;
  size: number;
  duration: number;
}

// Define custom job
class ImageProcessingJob extends Job<ImageInput, ImageOutput> {
  async execute(input: ImageInput, context: IJobExecuteContext): Promise<ImageOutput> {
    await context.updateProgress(10, "Downloading image");
    await new Promise((resolve) => setTimeout(resolve, 100));

    await context.updateProgress(40, "Converting format");
    await new Promise((resolve) => setTimeout(resolve, 100));

    await context.updateProgress(70, "Optimizing");
    await new Promise((resolve) => setTimeout(resolve, 100));

    await context.updateProgress(100, "Complete");

    return {
      processedUrl: `https://cdn.example.com/${input.url.split("/").pop()}`,
      size: 1024 * 512,
      duration: 300,
    };
  }
}

async function runExample() {
  console.log("=== Production Architecture Example ===\n");

  const storage = new InMemoryQueueStorage<ImageInput, ImageOutput>("image-processing");

  console.log("1. Starting server with 3 workers...");
  const server = new JobQueueServer("image-processing", ImageProcessingJob, storage, {
    workerCount: 3,
    waitDurationInMilliseconds: 50,
  });

  server.on("job_complete", (queueName, jobId, output) => {
    console.log(`   [SERVER] Job ${jobId} completed - ${output.processedUrl}`);
  });

  await server.start();
  console.log(`   Server started with ${server.getWorkerCount()} workers\n`);

  console.log("2. Starting client...");
  const client = new JobQueueClient("image-processing", ImageProcessingJob, storage, {
    waitDurationInMilliseconds: 50,
  });

  await client.start();
  console.log("   Client started\n");

  console.log("3. Submitting 5 image processing jobs...");
  const jobPromises = [];

  for (let i = 1; i <= 5; i++) {
    const job = new ImageProcessingJob({
      input: {
        url: `https://example.com/image${i}.jpg`,
        format: "webp",
      },
    });

    const jobId = await client.add(job);
    console.log(`   Submitted job ${jobId} for image${i}.jpg`);

    client.onJobProgress(jobId, (progress, message) => {
      console.log(`   [CLIENT] Job ${jobId}: ${progress}% - ${message}`);
    });

    jobPromises.push(
      client.waitFor(jobId).then((result) => {
        console.log(`   [CLIENT] Job ${jobId} result:`, result);
        return result;
      })
    );
  }

  console.log("\n4. Waiting for all jobs to complete...");
  const results = await Promise.all(jobPromises);
  console.log(`\n   All ${results.length} jobs completed successfully!\n`);

  console.log("5. Server statistics:");
  const stats = server.getStats();
  console.log(`   Total jobs: ${stats.totalJobs}`);
  console.log(`   Completed: ${stats.completedJobs}`);
  console.log(`   Failed: ${stats.failedJobs}`);
  console.log(`   Average processing time: ${stats.averageProcessingTime?.toFixed(2)}ms\n`);

  console.log("6. Shutting down...");
  await client.stop();
  await server.stop();
  console.log("   Client and server stopped\n");

  console.log("=== Example Complete ===");
}

runExample().catch(console.error);
