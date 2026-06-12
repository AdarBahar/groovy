/**
 * Tests for urlShortener service
 *
 * Covers the publishable API key contract (#113):
 * 201/2xx success, request shape (X-API-Key only), 401/403/429/network
 * error mapping, Retry-After parsing, memoization, and configuration checks.
 *
 * The module reads env vars at top level, so each test stubs env + fetch,
 * resets the module registry, and dynamically imports a fresh instance.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

type ShortenerModule = typeof import('./urlShortener');

const TEST_KEY = 'pk_live_test';
const LONG_URL = 'https://www.bahar.co.il/groovy/?g=abc123';
const OTHER_URL = 'https://www.bahar.co.il/groovy/?g=def456';
const SHORT_URL = 'https://www.bahar.co.il/x1';

const SUCCESS_BODY = {
  success: true,
  data: {
    shortUrl: SHORT_URL,
    shortCode: 'x1',
    originalUrl: LONG_URL,
    createdAt: '2026-06-12T00:00:00.000Z',
    expiresAt: null,
  },
};

/** Build a minimal Response-like object for fetch mocks */
function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string): string | null => headers[name] ?? null,
    },
    json: async (): Promise<unknown> => body,
  } as unknown as Response;
}

/** Stub env + fetch, reset modules, and import a fresh module instance */
async function loadModule(
  fetchMock: ReturnType<typeof vi.fn>,
  key: string = TEST_KEY
): Promise<ShortenerModule> {
  vi.stubEnv('VITE_URL_SHORTENER_PUBLISHABLE_KEY', key);
  vi.stubGlobal('fetch', fetchMock);
  vi.resetModules();
  return import('./urlShortener');
}

/** Run a shortenURL call expected to reject, returning the thrown value */
async function captureError(mod: ShortenerModule, url: string): Promise<unknown> {
  return mod.shortenURL(url).then(
    () => {
      throw new Error('Expected shortenURL to reject');
    },
    (error: unknown) => error
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('shortenURL success handling', () => {
  it('resolves the short URL on 201 success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, SUCCESS_BODY));
    const mod = await loadModule(fetchMock);

    await expect(mod.shortenURL(LONG_URL)).resolves.toBe(SHORT_URL);
  });

  it('treats any 2xx status as success (200)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, SUCCESS_BODY));
    const mod = await loadModule(fetchMock);

    await expect(mod.shortenURL(LONG_URL)).resolves.toBe(SHORT_URL);
  });

  it('sends X-API-Key only, POST to /api/shorten, with exact { url } body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, SUCCESS_BODY));
    const mod = await loadModule(fetchMock);

    await mod.shortenURL(LONG_URL);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/shorten');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ url: LONG_URL }));
    const headers = init.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe(TEST_KEY);
    expect(headers).not.toHaveProperty('Authorization');
  });
});

describe('shortenURL error mapping', () => {
  it('maps 401 to unauthorized', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(401, { success: false, error: { message: 'Invalid key', statusCode: 401 } })
    );
    const mod = await loadModule(fetchMock);

    const error = await captureError(mod, LONG_URL);
    expect(error).toBeInstanceOf(mod.ShortenerError);
    expect((error as InstanceType<typeof mod.ShortenerError>).type).toBe('unauthorized');
    expect((error as InstanceType<typeof mod.ShortenerError>).statusCode).toBe(401);
  });

  it('maps 403 to forbidden and logs via logger.error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(403, {
        success: false,
        error: { message: 'Origin not allowed', statusCode: 403 },
      })
    );
    const mod = await loadModule(fetchMock);
    const { logger } = await import('../utils/logger');
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    const error = await captureError(mod, LONG_URL);
    expect(error).toBeInstanceOf(mod.ShortenerError);
    expect((error as InstanceType<typeof mod.ShortenerError>).type).toBe('forbidden');
    expect((error as InstanceType<typeof mod.ShortenerError>).statusCode).toBe(403);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('maps 429 to rate_limited and parses Retry-After into retryAfter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        429,
        { success: false, error: { message: 'Rate limit exceeded', statusCode: 429 } },
        { 'Retry-After': '30' }
      )
    );
    const mod = await loadModule(fetchMock);

    const error = await captureError(mod, LONG_URL);
    expect(error).toBeInstanceOf(mod.ShortenerError);
    expect((error as InstanceType<typeof mod.ShortenerError>).type).toBe('rate_limited');
    expect((error as InstanceType<typeof mod.ShortenerError>).statusCode).toBe(429);
    expect((error as InstanceType<typeof mod.ShortenerError>).retryAfter).toBe(30);
  });

  it('leaves retryAfter undefined when Retry-After is missing on 429', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(429, { success: false, error: { message: 'Rate limit', statusCode: 429 } })
    );
    const mod = await loadModule(fetchMock);

    const error = await captureError(mod, LONG_URL);
    expect((error as InstanceType<typeof mod.ShortenerError>).type).toBe('rate_limited');
    expect((error as InstanceType<typeof mod.ShortenerError>).retryAfter).toBeUndefined();
  });

  it('maps fetch TypeError (network/CORS) to network', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const mod = await loadModule(fetchMock);

    const error = await captureError(mod, LONG_URL);
    expect(error).toBeInstanceOf(mod.ShortenerError);
    expect((error as InstanceType<typeof mod.ShortenerError>).type).toBe('network');
  });

  it('maps CORS TypeError with browser-specific message to network', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Load failed'));
    const mod = await loadModule(fetchMock);

    const error = await captureError(mod, LONG_URL);
    expect((error as InstanceType<typeof mod.ShortenerError>).type).toBe('network');
  });
});

describe('shortenURL memoization', () => {
  it('returns the cached short URL without a second fetch for the same long URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, SUCCESS_BODY));
    const mod = await loadModule(fetchMock);

    const first = await mod.shortenURL(LONG_URL);
    const second = await mod.shortenURL(LONG_URL);

    expect(first).toBe(SHORT_URL);
    expect(second).toBe(SHORT_URL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches again for a different long URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(201, SUCCESS_BODY))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          success: true,
          data: { ...SUCCESS_BODY.data, shortUrl: 'https://www.bahar.co.il/x2' },
        })
      );
    const mod = await loadModule(fetchMock);

    await mod.shortenURL(LONG_URL);
    const second = await mod.shortenURL(OTHER_URL);

    expect(second).toBe('https://www.bahar.co.il/x2');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(429, { success: false, error: { message: 'Rate limit', statusCode: 429 } })
      )
      .mockResolvedValueOnce(jsonResponse(201, SUCCESS_BODY));
    const mod = await loadModule(fetchMock);

    await captureError(mod, LONG_URL);
    await expect(mod.shortenURL(LONG_URL)).resolves.toBe(SHORT_URL);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('isShortenerConfigured', () => {
  it('returns true when the publishable key env var is set', async () => {
    const fetchMock = vi.fn();
    const mod = await loadModule(fetchMock);

    expect(mod.isShortenerConfigured()).toBe(true);
  });

  it('returns false and shortenURL throws unauthorized when key is absent', async () => {
    const fetchMock = vi.fn();
    const mod = await loadModule(fetchMock, '');

    expect(mod.isShortenerConfigured()).toBe(false);
    const error = await captureError(mod, LONG_URL);
    expect(error).toBeInstanceOf(mod.ShortenerError);
    expect((error as InstanceType<typeof mod.ShortenerError>).type).toBe('unauthorized');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('getShortenerErrorMessage', () => {
  it('returns a user-facing message for forbidden errors', async () => {
    const fetchMock = vi.fn();
    const mod = await loadModule(fetchMock);

    const error = new mod.ShortenerError('Origin not allowed', 'forbidden', 403);
    expect(mod.getShortenerErrorMessage(error)).toBe('URL shortening unavailable');
  });

  it('keeps existing messages for other error types', async () => {
    const fetchMock = vi.fn();
    const mod = await loadModule(fetchMock);

    expect(
      mod.getShortenerErrorMessage(new mod.ShortenerError('x', 'rate_limited', 429))
    ).toBe('Rate limit reached. Try again later.');
    expect(mod.getShortenerErrorMessage(new mod.ShortenerError('x', 'network'))).toBe(
      'Network error. Please try again.'
    );
    expect(mod.getShortenerErrorMessage('not an error')).toBe('Failed to shorten URL');
  });
});
