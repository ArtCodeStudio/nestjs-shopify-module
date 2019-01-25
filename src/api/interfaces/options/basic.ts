import { Options } from 'shopify-prime';

/**
 * Sort options for listFromDb and listFromSearch methods
 */
export interface IAppListSortOptions {
  /**
   * Property to sort by
   */
  sort_by?: string;
  /**
   * Sort direction
   */
  sort_dir?: 'asc' | 'desc';
}

export interface IAppListFilterOptions {
  /**
   * Return only certain documents, specified by a comma-separated list of document IDs.
   */
  ids?: string;
}

/**
 * Basic list options wich should be implementated by listFromDb and listFromSearch
 */
export interface IAppBasicListOptions extends
  IAppListSortOptions,
  IAppListFilterOptions,
  Options.FieldOptions,
  Options.BasicListOptions,
  Options.DateOptions,
  Options.PublishedOptions {}