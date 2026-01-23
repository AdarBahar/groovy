/**
 * URL Shortener Service
 *
 * Integrates with the external URL shortener API (go.bahar.co.il)
 * to provide shorter, more shareable links for grooves.
 *
 * Configuration:
 * - VITE_URL_SHORTENER_API: Base URL of the shortener API
 * - VITE_URL_SHORTENER_KEY: API key for authentication
 */

/** API configuration from environment */
const SHORTENER_API_URL = import.meta.env.VITE_URL_SHORTENER_API || 'https://go.bahar.co.il';
const SHORTENER_API_KEY = import.meta.env.VITE_URL_SHORTENER_KEY || '';

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
export type ShortenerErrorType = 'unauthorized' | 'rate_limited' | 'network' | 'unknown';

export class ShortenerError extends Error {
  type: ShortenerErrorType;
  statusCode?: number;

  constructor(message: string, type: ShortenerErrorType, statusCode?: number) {
    super(message);
    this.name = 'ShortenerError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

/**
 * Check if the URL shortener is configured with an API key
 */
export function isShortenerConfigured(): boolean {
  return Boolean(SHORTENER_API_KEY);
}

/**
 * Shorten a URL using the external shortener API
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

  try {
    const response = await fetch(`${SHORTENER_API_URL}/api/shorten`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${SHORTENER_API_KEY}`,
        'X-API-Key': SHORTENER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: longUrl }),
    });

    const data: ShortenResponse = await response.json();

    if (!response.ok || !data.success) {
      // Handle specific error codes
      if (response.status === 401) {
        throw new ShortenerError(
          'Invalid API key',
          'unauthorized',
          401
        );
      }

      if (response.status === 429) {
        throw new ShortenerError(
          'Rate limit reached. Try again later.',
          'rate_limited',
          429
        );
      }

      throw new ShortenerError(
        data.error?.message || 'Failed to shorten URL',
        'unknown',
        response.status
      );
    }

    return data.data!.shortUrl;
  } catch (error) {
    // Re-throw ShortenerError as-is
    if (error instanceof ShortenerError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
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
