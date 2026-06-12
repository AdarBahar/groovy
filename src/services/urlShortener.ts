/**
 * URL Shortener Service
 *
 * Integrates with the external URL shortener API (go.bahar.co.il)
 * to provide shorter, more shareable links for grooves.
 *
 * Configuration:
 * - VITE_URL_SHORTENER_API: Base URL of the shortener API
 * - VITE_URL_SHORTENER_PUBLISHABLE_KEY: Publishable (bundle-safe) pk_live_ API key.
 *   Origin-scoped and rate-limited server-side; safe to embed in the static bundle.
 */

import { logger } from '../utils/logger';

/** API configuration from environment */
const SHORTENER_API_URL = import.meta.env.VITE_URL_SHORTENER_API || 'https://go.bahar.co.il';
const SHORTENER_API_KEY = import.meta.env.VITE_URL_SHORTENER_PUBLISHABLE_KEY || '';

/**
 * In-memory cache of longUrl → shortUrl (successes only).
 * The server does not dedupe, so repeated share clicks in one session
 * would otherwise burn the daily creation quota.
 */
const shortUrlCache = new Map<string, string>();

/** Response from the shorten endpoint */
interface ShortenResponse {
  success: boolean;
  data?: {
    shortUrl: string;
    shortCode: string;
    originalUrl: string;
    createdAt: string;
    expiresAt?: string;
  };
  error?: {
    message: string;
    statusCode: number;
  };
}

/** Error types for better error handling */
export type ShortenerErrorType =
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'network'
  | 'unknown';

export class ShortenerError extends Error {
  type: ShortenerErrorType;
  statusCode?: number;
  /** Seconds to wait before retrying, parsed from the Retry-After header on 429 */
  retryAfter?: number;

  constructor(
    message: string,
    type: ShortenerErrorType,
    statusCode?: number,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'ShortenerError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

/**
 * Check if the URL shortener is configured with an API key
 */
export function isShortenerConfigured(): boolean {
  return Boolean(SHORTENER_API_KEY);
}

/**
 * Parse the Retry-After header value into seconds, or undefined if absent/invalid
 */
function parseRetryAfter(response: Response): number | undefined {
  const headerValue = response.headers.get('Retry-After');
  if (headerValue === null) {
    return undefined;
  }
  const seconds = Number(headerValue);
  return Number.isNaN(seconds) ? undefined : seconds;
}

/**
 * Shorten a URL using the external shortener API
 *
 * Successful results are memoized per longUrl for the session, so repeated
 * calls with the same URL do not issue additional requests.
 *
 * @param longUrl - The URL to shorten
 * @returns The shortened URL
 * @throws ShortenerError if the request fails
 */
export async function shortenURL(longUrl: string): Promise<string> {
  // If no API key configured, throw error
  if (!SHORTENER_API_KEY) {
    throw new ShortenerError(
      'URL shortener not configured',
      'unauthorized'
    );
  }

  const cached = shortUrlCache.get(longUrl);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const response = await fetch(`${SHORTENER_API_URL}/api/shorten`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': SHORTENER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: longUrl }),
    });

    const data: ShortenResponse = await response.json();

    // Any 2xx (response.ok) with a success body is a success; 201 is the normal code
    if (!response.ok || !data.success) {
      // Handle specific error codes
      if (response.status === 401) {
        throw new ShortenerError(
          'Invalid API key',
          'unauthorized',
          401
        );
      }

      if (response.status === 403) {
        // Allowlist/config problem or tampering — log loudly, never retry silently
        logger.error(
          'URL shortener rejected the request (403): origin/target allowlist or publishable key configuration problem.',
          data.error?.message
        );
        throw new ShortenerError(
          data.error?.message || 'Request not allowed',
          'forbidden',
          403
        );
      }

      if (response.status === 429) {
        throw new ShortenerError(
          'Rate limit reached. Try again later.',
          'rate_limited',
          429,
          parseRetryAfter(response)
        );
      }

      throw new ShortenerError(
        data.error?.message || 'Failed to shorten URL',
        'unknown',
        response.status
      );
    }

    const shortUrl = data.data?.shortUrl;
    if (!shortUrl) {
      throw new ShortenerError(
        'Malformed shortener response',
        'unknown',
        response.status
      );
    }

    shortUrlCache.set(longUrl, shortUrl);
    return shortUrl;
  } catch (error) {
    // Re-throw ShortenerError as-is
    if (error instanceof ShortenerError) {
      throw error;
    }

    // Network/CORS failures surface as TypeError (message varies by browser)
    if (error instanceof TypeError) {
      throw new ShortenerError(
        'Network error. Please check your connection.',
        'network'
      );
    }

    // Unknown error
    throw new ShortenerError(
      error instanceof Error ? error.message : 'Failed to shorten URL',
      'unknown'
    );
  }
}

/**
 * Get user-friendly error message based on error type
 */
export function getShortenerErrorMessage(error: unknown): string {
  if (error instanceof ShortenerError) {
    switch (error.type) {
      case 'unauthorized':
        return 'URL shortening unavailable';
      case 'forbidden':
        return 'URL shortening unavailable';
      case 'rate_limited':
        return 'Rate limit reached. Try again later.';
      case 'network':
        return 'Network error. Please try again.';
      default:
        return error.message;
    }
  }

  return 'Failed to shorten URL';
}
