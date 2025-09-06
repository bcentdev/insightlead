// Servicio de cache para métricas usando programación funcional
type CacheKey = string;
type CacheEntry<T> = {
  readonly data: T;
  readonly timestamp: number;
  readonly expiresAt: number;
};

type MetricsCache = {
  readonly [key: CacheKey]: CacheEntry<any>;
};

type PendingRequest = {
  readonly promise: Promise<any>;
  readonly timestamp: number;
};

type PendingRequests = {
  readonly [key: CacheKey]: PendingRequest;
};

// Estado del cache (inmutable)
let cache: MetricsCache = {};
let pendingRequests: PendingRequests = {};

// Configuración del cache
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos - más agresivo para evitar llamadas

// Funciones puras para manejo del cache
const createCacheKey = (prefix: string, params: readonly any[]): CacheKey => {
  return `${prefix}:${JSON.stringify(params)}`;
};

const createCacheEntry = <T>(data: T, ttl: number = CACHE_TTL): CacheEntry<T> => ({
  data,
  timestamp: Date.now(),
  expiresAt: Date.now() + ttl
});

const isExpired = (entry: CacheEntry<any>): boolean => {
  return Date.now() > entry.expiresAt;
};

const getCacheEntry = <T>(key: CacheKey): T | null => {
  const entry = cache[key];
  if (!entry || isExpired(entry)) {
    return null;
  }
  return entry.data;
};

const setCacheEntry = <T>(key: CacheKey, data: T): void => {
  cache = {
    ...cache,
    [key]: createCacheEntry(data)
  };
};

const clearExpiredEntries = (): void => {
  const now = Date.now();
  const validEntries = Object.entries(cache)
    .filter(([_, entry]) => entry.expiresAt > now)
    .reduce((acc, [key, entry]) => ({ ...acc, [key]: entry }), {});
  
  cache = validEntries;
};

const clearCache = (): void => {
  cache = {};
};

// Funciones para manejo de solicitudes pendientes
const setPendingRequest = (key: CacheKey, promise: Promise<any>): void => {
  pendingRequests = {
    ...pendingRequests,
    [key]: {
      promise,
      timestamp: Date.now()
    }
  };
};

const getPendingRequest = (key: CacheKey): Promise<any> | null => {
  const request = pendingRequests[key];
  if (!request) return null;
  
  // Si la solicitud es muy antigua (más de 30 segundos), la eliminamos
  if (Date.now() - request.timestamp > 30000) {
    const { [key]: _, ...rest } = pendingRequests;
    pendingRequests = rest;
    return null;
  }
  
  return request.promise;
};

const removePendingRequest = (key: CacheKey): void => {
  const { [key]: _, ...rest } = pendingRequests;
  pendingRequests = rest;
};

// Funciones de cache específicas para métricas con deduplicación
export const cacheGitHubMetrics = (teamMembers: readonly string[], days: number, data: any): void => {
  const key = createCacheKey('github', [teamMembers, days]);
  setCacheEntry(key, data);
  removePendingRequest(key);
};

export const getCachedGitHubMetrics = (teamMembers: readonly string[], days: number): any | null => {
  const key = createCacheKey('github', [teamMembers, days]);
  return getCacheEntry(key);
};

export const getPendingGitHubRequest = (teamMembers: readonly string[], days: number): Promise<any> | null => {
  const key = createCacheKey('github', [teamMembers, days]);
  return getPendingRequest(key);
};

export const setPendingGitHubRequest = (teamMembers: readonly string[], days: number, promise: Promise<any>): void => {
  const key = createCacheKey('github', [teamMembers, days]);
  setPendingRequest(key, promise);
};

export const cacheJiraMetrics = (projectKey: string, assigneeIds: readonly string[], days: number, data: any): void => {
  const key = createCacheKey('jira', [projectKey, assigneeIds, days]);
  setCacheEntry(key, data);
  removePendingRequest(key);
};

export const getCachedJiraMetrics = (projectKey: string, assigneeIds: readonly string[], days: number): any | null => {
  const key = createCacheKey('jira', [projectKey, assigneeIds, days]);
  return getCacheEntry(key);
};

export const getPendingJiraRequest = (projectKey: string, assigneeIds: readonly string[], days: number): Promise<any> | null => {
  const key = createCacheKey('jira', [projectKey, assigneeIds, days]);
  return getPendingRequest(key);
};

export const setPendingJiraRequest = (projectKey: string, assigneeIds: readonly string[], days: number, promise: Promise<any>): void => {
  const key = createCacheKey('jira', [projectKey, assigneeIds, days]);
  setPendingRequest(key, promise);
};

// Funciones de utilidad
export const getCacheStats = () => {
  const entries = Object.entries(cache);
  const now = Date.now();
  const validEntries = entries.filter(([_, entry]) => entry.expiresAt > now);
  const pendingEntries = Object.entries(pendingRequests);
  
  return {
    totalEntries: entries.length,
    validEntries: validEntries.length,
    expiredEntries: entries.length - validEntries.length,
    pendingRequests: pendingEntries.length
  };
};

// Limpieza automática del cache cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    clearExpiredEntries();
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Cache cleanup completed:', getCacheStats());
    }
  }, 10 * 60 * 1000);
}

// Función para debugging en desarrollo
export const debugCache = (): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🐛 Cache Debug:', {
      stats: getCacheStats(),
      keys: Object.keys(cache)
    });
  }
};

export { clearCache };