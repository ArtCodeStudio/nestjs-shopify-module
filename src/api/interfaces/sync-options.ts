export interface SyncOptions {
  /**
   * If true, sync the receive data to the internal database (MongoDB)
   */
  syncToDb?: boolean,
  /**
   * If true, sync the receive data to internal search engine (Elasticsearch)
   */
  syncToSearch?: boolean,
  failOnSyncError?: boolean,
  cancelSignal?: string,
}