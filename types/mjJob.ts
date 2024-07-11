export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface MjButtonCommandRequest {
  type: 'MJ_BUTTON_COMMAND';
  button: string;
  messageId: string;
}
export interface MjImageGenRequest {
  type: 'MJ_IMAGE_GEN';
  userPrompt: string;
  imageStyle: string | undefined;
  imageQuality: string | undefined;
  temperature: number | null;
  enhancedPrompt?: string;
}
export type MjRequest = MjImageGenRequest | MjButtonCommandRequest;

export interface BasedMjJob {
  jobId: string;
  status: JobStatus;
  enqueuedAt: string;
  startProcessingAt?: string;
  userId: string;
  mjRequest: MjRequest;
  usedOnDemandCredit?: boolean;
  lastUsedKey?: 'our-discord-key' | 'on-demand-credit-key';
}
export interface QueuedMjJob extends BasedMjJob {
  status: 'QUEUED';
  position: number;
}
export interface ProcessingMjJob extends BasedMjJob {
  status: 'PROCESSING';
  progress: number;
  imageUrl: string;
}
export interface CompletedMjJob extends BasedMjJob {
  status: 'COMPLETED';
  imageUrl: string;
  buttons: string[];
  messageId: string;
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
