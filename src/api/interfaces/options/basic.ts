import { Options } from "shopify-admin-api";

/**
 * Sort options for listFromDb and listFromES methods
 */
export interface IAppListSortOptions {
  /**
   * Property to sort by
   */
  sort_by?: string;
  /**
   * Sort direction
   */
  sort_dir?: "asc" | "desc";
}

export interface IAppListFilterOptions {
  /**
   * Return only certain documents, specified by a comma-separated list of document IDs.
   */
  ids?: string;

  /**
   * Full text search for a string e.g. in `title` or `body_html`
   */
  text?: string;
}

/**
 * Basic list options wich should be implementated by listFromDb and listFromES
 */
export interface IAppBasicListOptions
  extends IAppListSortOptions,
    IAppListFilterOptions,
    Options.FieldOptions,
    Options.BasicListOptions,
    Options.DateOptions,
    Options.PublishedOptions {}
