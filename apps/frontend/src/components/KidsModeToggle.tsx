
"use client";

import React from 'react';
import { useKidsMode } from '@hooks/useKidsMode';

export function KidsModeToggle() {
  const { isKidsModeEnabled, toggleKidsMode } = useKidsMode();

  return (
    <button
      onClick={toggleKidsMode}
      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
        isKidsModeEnabled
          ? 'bg-green-500 text-white hover:bg-green-600'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
      aria-label="Toggle Kids Mode"
    >
      {isKidsModeEnabled ? '👶 Kids Mode ON' : '👨 Kids Mode OFF'}
    </button>
  );
}
