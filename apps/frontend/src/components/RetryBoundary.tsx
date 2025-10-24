"use client";

import React, { Component, ReactNode } from 'react';

interface RetryBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetries?: number;
}

interface RetryBoundaryState {
  hasError: boolean;
  retryCount: number;
}

export class RetryBoundary extends Component<RetryBoundaryProps, RetryBoundaryState> {
  constructor(props: RetryBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): RetryBoundaryState {
    return { hasError: true, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RetryBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    if (this.state.retryCount < maxRetries) {
      this.setState(prev => ({ 
        hasError: false, 
        retryCount: prev.retryCount + 1 
      }));
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8">
          <p className="text-red-600 mb-4">Something went wrong</p>
          <button 
            onClick={this.handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry ({this.state.retryCount}/{this.props.maxRetries || 3})
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}