export interface ISyncOptions {
  includeOrders: boolean,
  includeTransactions: boolean,
  includeProducts: boolean,
  includePages: boolean,
  includeCustomCollection: boolean,
  includeSmartCollection: boolean,
  resync: boolean,
  cancelExisting: boolean,
}