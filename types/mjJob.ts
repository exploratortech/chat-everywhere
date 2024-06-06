export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface MjImageGenRequest {
  userPrompt: string;
  imageStyle: string | undefined;
  imageQuality: string | undefined;
  temperature: number | null;
}

export interface BasedMjJob {
  jobId: string;
  status: JobStatus;
  enqueuedAt: string;
  userId: string;
  mjRequest: MjImageGenRequest;
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
