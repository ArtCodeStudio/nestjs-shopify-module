export interface ISyncOptions {
  includeOrders: boolean,
  includeTransactions: boolean,
  includeProducts: boolean,
  includePages: boolean,
  includeCustomCollections: boolean,
  includeSmartCollections: boolean,
  resync: boolean,
  cancelExisting: boolean,
}