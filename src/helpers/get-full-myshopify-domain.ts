import { getSubdomain } from './get-subdomain';

/**
 * bestshopever -> bestshopever.myshopify.com
 * @param domain
 */
export function getFullMyshopifyDomain(domain: string) {
  const subdomain = getSubdomain(domain);
  return subdomain + '.myshopify.com';
}
