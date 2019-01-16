import { Options } from 'shopify-prime';
import { SyncOptions } from './sync-options'

export interface SmartCollectionListOptions extends Options.CollectionListOptions, SyncOptions {}

export interface SmartCollectionGetOptions extends Options.FieldOptions, SyncOptions {}

export interface SmartCollectionCountOptions extends Options.CollectionListOptions, SyncOptions {}