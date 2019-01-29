export interface ISyncOptions {
  /**
   * If true, sync the receive data to the internal database (MongoDB)
   */
  syncToDb?: boolean;
  /**
   * If true, sync the receive data to internal search engine (Elasticsearch)
   */
  syncToEs?: boolean;
  /**
   * If true, sync the receive data to internal search engine (Swiftype)
   */
  syncToSwiftype?: boolean;
  failOnSyncError?: boolean;
  cancelSignal?: string;
}