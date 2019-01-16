import { Options } from 'shopify-prime';
import { SyncOptions } from './sync-options'

export interface CustomCollectionListOptions extends Options.CollectionListOptions, SyncOptions {}

export interface CustomCollectionGetOptions extends Options.FieldOptions, SyncOptions {}

export interface CustomCollectionCountOptions extends Options.CollectionListOptions, SyncOptions {}