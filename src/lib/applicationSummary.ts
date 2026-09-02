export function summarizeRecentApplications<T extends { createdAt: string | Date }>(
  applications: T[],
  limit: number
): T[] {
  return [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}
