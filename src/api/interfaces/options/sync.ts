export interface ISyncOptions {
  /**
   * If true, sync the receive data to the internal database (MongoDB)
   */
  syncToDb?: boolean;
  failOnSyncError?: boolean;
  cancelSignal?: string;
}