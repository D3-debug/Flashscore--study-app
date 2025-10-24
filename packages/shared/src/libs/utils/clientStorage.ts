/**
 * Client-side storage utilities with SSR safety
 */

export class ClientStorage {
  static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  static setItem<T>(key: string, value: T): void {
    if (!this.isClient()) return;

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to set localStorage item (${key}):`, error);
    }
  }

  static getItem<T>(key: string, defaultValue: T): T {
    if (!this.isClient()) return defaultValue;

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to get localStorage item (${key}):`, error);
      return defaultValue;
    }
  }

  static removeItem(key: string): void {
    if (!this.isClient()) return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage item (${key}):`, error);
    }
  }

  static clear(): void {
    if (!this.isClient()) return;

    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}

/**
 * React hook for localStorage with SSR safety
 */
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const value = ClientStorage.getItem(key, initialValue);
    setStoredValue(value);
  }, [key, initialValue]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (isClient) {
        ClientStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(`Failed to update localStorage (${key}):`, error);
    }
  };

  return [storedValue, setValue];
}