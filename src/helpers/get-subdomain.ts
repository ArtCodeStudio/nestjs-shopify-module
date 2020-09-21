/**
 * bestshopever.myshopify.com -> bestshopever
 * @param domain 
 */
export function getSubdomain(domain: string) {
    const index = domain.indexOf('.');
    if (index >= 0) { 
        return domain.substring(0, index);
    }
    return domain;
}