import { vi } from 'vitest';
import '@testing-library/react';

// Stub navigator.requestMIDIAccess for test environment
global.navigator.requestMIDIAccess = vi.fn().mockResolvedValue({});

// Stub localStorage for test environment (required by logger utility)
const localStorageMock: Storage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(() => null),
  length: 0,
};
global.localStorage = localStorageMock;
