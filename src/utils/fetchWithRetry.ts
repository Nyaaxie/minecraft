export async function fetchWithRetry<T>(
  fetchFn: () => PromiseLike<T>,
  retries = 3,
  delay = 1000,
  timeoutMs = 30000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
  );

  try {
    return await Promise.race([fetchFn(), timeoutPromise]);
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fetchFn, retries - 1, delay * 2, timeoutMs); // Exponential backoff
  }
}
