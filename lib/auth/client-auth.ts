export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Session cookies are automatically included in same-origin requests
  // No need to manually add Authorization headers
  return fetch(url, {
    ...options,
    credentials: 'same-origin', // Ensure cookies are included
  });
}
