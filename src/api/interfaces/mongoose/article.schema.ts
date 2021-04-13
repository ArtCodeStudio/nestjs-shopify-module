import { Schema, Document, DocumentDefinition } from "mongoose";
import { Interfaces } from "shopify-admin-api";

export type ArticleDocument = DocumentDefinition<Interfaces.Article> & Document;

export const ImageSchema = new Schema({
  /**
   * A base64 image string only used when creating an image. It will be converted to the src property.
   */
  attachment: String,

  /**
   * The date and time the image was created.
   */
  created_at: String,

  /**
   * The image's src URL.
   */
  src: String,
});

export const ArticleSchema = new Schema({
  id: { type: Number, index: { unique: true } },
  /**
   * The name of the author of this article
   */
  author: String,

  /**
   * A unique numeric identifier for the blog containing the article.
   */
  blog_id: Number,

  /**
   * The text of the body of the article, complete with HTML markup.
   */
  body_html: String,

  /**
   * The date and time when the article was created.
   */
  created_at: String,

  /**
   * A human-friendly unique string for an article automatically generated from its title. It is used in the article's URL.
   */
  handle: String,

  /**
   * The article image.
   */
  image: ImageSchema,

  /**
   * States whether or not the article is visible.
   */
  published: Boolean,

  /**
   * The date and time when the article was published.
   */
  published_at: String,

  /**
   * The text of the summary of the article, complete with HTML markup.
   */
  summary_html: String,

  /**
   * Tags are additional short descriptors formatted as a string of comma-separated values.
   * For example, if an article has three tags: tag1, tag2, tag3.
   */
  tags: String,

  /**
   * States the name of the template an article is using if it is using an alternate template.
   * If an article is using the default article.liquid template, the value returned is null.
   */
  template_suffix: String,

  /**
   * The title of the article.
   */
  title: String,

  /**
   * The date and time when the article was last updated.
   */
  updated_at: String,

  /**
   * A unique numeric identifier for the author of the article.
   */
  user_id: Number,
});
