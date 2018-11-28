import * as mongoose from 'mongoose';

export const ShopifyShopSchema = new mongoose.Schema({
  id: Number,

  /**
   * The shop's street address.
   */
  address1: String,
  /**
   * The second line of the shop's street address.
   */
  address2: String,
  /**
   * The city in which the shop is located.
   */
  city: String,

  /**
   * The shop's country (by default equal to the two-letter country code).
   */
  country: String,

  /**
   * The two-letter country code corresponding to the shop's country.
   */
  country_code: String,

  /**
   * The shop's normalized country name.
   */
  country_name: String,

  /**
   * The date and time when the shop was created.
   */
  created_at: String,

  /**
   * The customer's email.
   */
  customer_email: String,

  /**
   * The three-letter code for the currency that the shop accepts.
   */
  currency: String,

  /**
   * The shop's description.
   */
  description: String,

  /**
   * The shop's domain.
   */
  domain: String,

  /**
   * The contact email address for the shop.
   */
  email: String,

  /**
   * Indicates whether the shop forces requests made to its resources to be made over SSL, using the HTTPS protocol.
   * If true, HTTP requests will be redirected to HTTPS.
   */
  force_ssl: Boolean,

  /**
   * Present when a shop has a google app domain. It will be returned as a URL, else null.
   */
  google_apps_domain: String,

  /**
   * Present if a shop has google apps enabled. Those shops with this feature will be able to login to the google apps login.
   */
  google_apps_login_enabled: Boolean,

  /**
   * Geographic coordinate specifying the north/south location of a shop.
   */
  latitude: String,

  /**
   * Geographic coordinate specifying the east/west location of a shop.
   */
  longitude: String,

  /**
   * A string representing the way currency is formatted when the currency isn't specified.
   */
  money_format: String,

  /**
   * A string representing the way currency is formatted when the currency is specified.
   */
  money_with_currency_format: String,

  /**
   * The shop's 'myshopify.com' domain.
   */
  myshopify_domain: String,

  /**
   * The name of the shop.
   */
  name: String,

  /**
   * The name of the Shopify plan the shop is on.
   */
  plan_name: String,

  /**
   * The display name of the Shopify plan the shop is on.
   */
  display_plan_name: String,

  /**
   * Indicates whether the Storefront password protection is enabled.
   */
  password_enabled: Boolean,

  /**
   * The contact phone number for the shop.
   */
  phone: String,

  /**
   * The shop's primary locale.
   */
  primary_locale: String,

  /**
   * The shop's normalized province or state name.
   */
  province: String,

  /**
   * The two-letter code for the shop's province or state.
   */
  province_code: String,

  /**
   * A list of countries the shop ships products to, separated by a comma.
   */
  ships_to_countries: String,

  /**
   * The username of the shop owner.
   */
  shop_owner: String,

  /**
   * Unkown. Shopify documentation does not currently indicate what this property actually is.
   */
  source: String,

  /**
   * Specifies whether or not taxes were charged for shipping. Although the Shopify docs don't indicate this, it's possible for the value to be null.
   */
  tax_shipping: Boolean,

  /**
   * The setting for whether applicable taxes are included in product prices.
   */
  taxes_included: Boolean,

  /**
   * The setting for whether the shop is applying taxes on a per-county basis or not (US-only). Valid values are: "true" or "null."
   */
  county_taxes: Boolean,

  /**
   * The name of the timezone the shop is in.
   */
  timezone: String,

  /**
   * The named timezone assigned by the IANA.
   */
  iana_timezone: String,

  /**
   * The zip or postal code of the shop's address.
   */
  zip: String,

  /**
   * Indicates whether the shop has web-based storefront or not.
   */
  has_storefront: Boolean,

  /**
   * Indicates whether the shop has any outstanding setup steps or not.
   */
  setup_required: Boolean,

  /**
   * Indicates whether the shop supports the Discounts api
   */
  has_discounts: Boolean,

  /**
   * Indicates whether the shop supports the Gift Cards api
   */
  has_gift_cards: Boolean,
});