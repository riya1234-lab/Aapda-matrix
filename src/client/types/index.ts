// Re-export shared interfaces
export * from '../../shared/types/index';

export type SupportedLanguage = 'en' | 'mr' | 'hi';

export interface QueuedOfflineIncident {
  localQueueId: string;
  incidentId: string;
  payload: any;
  audioBlob?: Blob;
  createdAt: number;
  retryCount: number;
  lastAttemptAt?: number;
}
