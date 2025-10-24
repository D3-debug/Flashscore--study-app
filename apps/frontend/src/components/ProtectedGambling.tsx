
"use client";

import React, { ReactNode } from 'react';
import { useKidsMode } from '@hooks/useKidsMode';

interface ProtectedGamblingProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedGambling({ children, fallback }: ProtectedGamblingProps) {
  const { isKidsModeEnabled } = useKidsMode();

  if (isKidsModeEnabled) {
    return fallback || (
      <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <p className="text-yellow-800 font-semibold">
          This content is not available in Kids Mode
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
