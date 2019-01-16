import { Options } from 'shopify-prime';
import { SyncOptions } from './sync-options'

export interface ProductListOptions extends Options.ProductListOptions, SyncOptions {}

export interface ProductGetOptions extends Options.FieldOptions, SyncOptions {}

export interface ProductCountOptions extends Options.ProductCountOptions {}