import { Schema, Document } from 'mongoose';
import { Interfaces } from 'shopify-admin-api';

import { AddressSchema } from './address.schema';
import { CustomerSchema } from './customer.schema';
import { DiscountCodeSchema } from './discount-code.schema';
import { LineItemSchema } from './line-item.schema';
import { ShippingLineSchema } from './shipping-line.schema';
import { NoteAttributeSchema } from './note-attribute.schema';
import { TaxLineSchema } from './tax-line.schema';

export type CheckoutDocument = Interfaces.Checkout & Document;

export const CheckoutOptionSchema = new Schema({
  id: {type: Number, index: {unique: true}},
  values: [String],
});

export const CheckoutSchema = new Schema({
  /**
   * The ID for the checkout.
   */
  id: {type: Number, index: {unique: true}},
  /**
   * The recovery URL that's sent to a customer so they can recover their checkout.
   */
  abandoned_checkout_url: String,
  /**
   * The mailing address associated with the payment method.
   */
  billing_address: AddressSchema,
  /**
   * Whether the customer would like to receive email updates from the shop.
   * This is set by the "I want to receive occasional emails about new products, promotions and other news" checkbox during checkout.
   */
  buyer_accepts_marketing: Boolean,
  /**
   * The ID for the cart that's attached to the checkout.
   */
  cart_token: String,
  /**
   * The date and time (ISO 8601 format) when the checkout was closed. If the checkout was not closed, then this value is null.
   */
  closed_at: String,
  /**
   * The date and time (ISO 8601 format) when the checkout was completed. For abandoned checkouts, this value is always null.
   */
  completed_at: String,
  /**
   * The date and time (ISO 8601 format) when the checkout was created.
   */
  created_at: String,
  /**
   * The three-letter code (ISO 4217 format) of the shop's default currency at the time of checkout.
   * For the currency that the customer used at checkout, see presentment_currency.
   */
  currency: String,
  /**
   * Information about the customer. For more information, see the Customer resource.
   */
  customer: CustomerSchema,
  /**
   * The two or three-letter language code, optionally followed by a region modifier.
   * Example values: en, en-CA.
   */
  customer_locale: String,
  /**
   * The ID of the Shopify POS device that created the checkout.
   */
  device_id: Number,
  /**
   * Discount codes applied to the checkout. Returns an empty array when no codes are applied.
   */
  discount_codes: [DiscountCodeSchema],
  /**
   * The customer's email address.
   */
  email: String,
  /**
   * The payment gateway used by the checkout. For abandoned checkouts, this value is always null for abandoned checkouts.
   */
  gateway: String,
  /**
   * The URL for the page where the customer entered the shop.
   */
  landing_site: String,
  /**
   * A list of line items, each containing information about an item in the checkout.
   */
  line_items: [LineItemSchema],
  /**
   * The ID of the physical location where the checkout was processed.
   */
  location_id: Number,
  /**
   * The text of an optional note that a shop owner can attach to the order.
   */
  note: String,
  /**
   * Extra information that is added to the order.
   */
  note_attributes: [NoteAttributeSchema],
  /**
   * The customer's phone Number.
   */
  phone: String,
  /**
   * The three-letter code (ISO 4217 format) of the currency that the customer used at checkout.
   * For the shop's default currency, see currency.
   *
   * (BETA)
   */
  presentment_currency: String,
  /**
   * The website that referred the customer to the shop.
   */
  referring_site: String,
  /**
   * The mailing address where the order will be shipped to.
   */
  shipping_address: AddressSchema,
  /**
   * Information about the chosen shipping method.
   */
  shipping_lines: [ShippingLineSchema],
  /**
   * undocumented, always null in test data
   */
  source: String,
  /**
   * undocumented string, which seems to be of the format `${location_id}-${POS_DEVICE_ID}-${POS_ORDER_NUMBER}` for POS orders, where `POS_DEVICE_ID` is an id associated with the device and `POS_ORDER_NUMBER` is counted up for each separate device
   */
  source_identifier: String,
  /**
   * Where the checkout originated.
   * Valid values: web, pos, iphone, android.
   */
  source_name: String,
  /**
   * undocumented, always null in test data
   */
  source_url: String,
  /**
   * The price of the checkout before shipping and taxes.
   */
  subtotal_price: String,
  /**
   * An array of tax line objects, each of which details a tax applicable to the checkout.
   */
  tax_lines: [TaxLineSchema],
  /**
   * Whether taxes are included in the price.
   */
  taxes_included: Boolean,
  /**
   * A unique ID for a checkout.
   */
  token: String,
  /**
   * The total amount of discounts to be applied.
   */
  total_discounts: String,
  /**
   * The sum of the prices of all line items in the checkout.
   */
  total_line_items_price: String,
  /**
   * The sum of the prices of all line items in the checkout, discounts, shipping costs, and taxes.
   */
  total_price: String,
  /**
   * The sum of all the taxes applied to the checkout.
   */
  total_tax: String,
  /**
   * The sum of all the weights in grams of the line items in the checkout.
   */
  total_weight: Number,
  /**
   * The date and time (ISO 8601 format) when the checkout was last modified.
   */
  updated_at: String,
  /**
   * The ID of the user who created the checkout.
   */
  user_id: Number,
});