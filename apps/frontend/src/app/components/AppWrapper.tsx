"use client";
import React from "react";
import { ProductionErrorBoundary as ErrorBoundary } from "@components/ErrorBoundary/ErrorBoundaryWithPerformance";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("App Error:", error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}