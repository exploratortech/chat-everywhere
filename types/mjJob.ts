export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface BasedMjJob {
  jobId: string;
  userPrompt: string;
  status: JobStatus;
  enqueuedAt: string;
}
export interface QueuedMjJob extends BasedMjJob {
  status: 'QUEUED';
  position: number;
}
export interface ProcessingMjJob extends BasedMjJob {
  status: 'PROCESSING';
  progress: number;
}
export interface CompletedMjJob extends BasedMjJob {
  status: 'COMPLETED';
  imageUrl: string;
}
export interface FailedMjJob extends BasedMjJob {
  status: 'FAILED';
  reason: string;
}
export type MjJob =
  | QueuedMjJob
  | ProcessingMjJob
  | CompletedMjJob
  | FailedMjJob;
