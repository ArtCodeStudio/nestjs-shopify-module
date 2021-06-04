import type { SubSyncProgressDocument } from './mongoose/sync-progress.schema';
export type ISubSyncProgressFinishedCallback = (
  doc: SubSyncProgressDocument,
) => void;
