import { Options } from 'shopify-prime';

/**
 * Sort options for listFromDb and listFromSearch methods
 */
export interface IAppListSortOptions {
  /**
   * Property to sort by
   */
  sortBy?: string;
  /**
   * Sort direction
   */
  sortDir?: 'asc' | 'desc';
}

/**
 * Basic list options wich should be implementated by listFromDb and listFromSearch
 */
export interface IAppBasicListOptions extends
  IAppListSortOptions,
  Options.FieldOptions,
  Options.BasicListOptions,
  Options.DateOptions,
  Options.PublishedOptions {}