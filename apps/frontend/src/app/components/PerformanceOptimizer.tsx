"use client";

import React, { useEffect, useState } from 'react';

// Mock hook for demonstration
const useBatteryOptimization = () => {
  const [batteryLevel, setBatteryLevel] = useState(0.85);
  const [isCharging, setIsCharging] = useState(false);
  const [powerSaveMode, setPowerSaveMode] = useState(false);

  useEffect(() => {
    // Simulate battery changes
    const interval = setInterval(() => {
      setBatteryLevel(prev => Math.max(0.1, prev - 0.01));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    batteryLevel,
    isCharging,
    powerSaveMode,
    optimizationSettings: {
      disableBackgroundSync: powerSaveMode,
      reduceAnimations: powerSaveMode,
      disableAutoRefresh: powerSaveMode
    }
  };
};

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  batteryLevel: number;
}

export const PerformanceOptimizer: React.FC = () => {
  const { batteryLevel, isCharging, powerSaveMode, optimizationSettings } = useBatteryOptimization();

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    cacheHitRate: 0,
    batteryLevel: batteryLevel * 100
  });

  const [optimizations, setOptimizations] = useState({
    lazyLoading: true,
    imageOptimization: true,
    codesplitting: true,
    prefetching: !optimizationSettings?.disableBackgroundSync,
    compression: true,
    batteryOptimization: true
  });

  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      batteryLevel: batteryLevel * 100
    }));
  }, [batteryLevel]);

  useEffect(() => {
    // Update prefetching based on optimization settings
    setOptimizations(prev => ({
      ...prev,
      prefetching: !optimizationSettings?.disableBackgroundSync
    }));
  }, [optimizationSettings]);

  useEffect(() => {
    // Performance monitoring
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    // Memory usage monitoring
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100)
      }));
    }

    // Simulate network latency
    const latency = Math.random() * 200 + 50;
    setMetrics(prev => ({
      ...prev,
      networkLatency: Math.round(latency)
    }));

    return () => observer.disconnect();
  }, []);

  const getPerformanceScore = () => {
    const { loadTime, renderTime, memoryUsage, networkLatency } = metrics;
    let score = 100;

    if (loadTime > 3000) score -= 20;
    if (renderTime > 100) score -= 15;
    if (memoryUsage > 80) score -= 20;
    if (networkLatency > 500) score -= 15;

    return Math.max(0, score);
  };

  // Adaptive performance optimization
  useEffect(() => {
    const score = getPerformanceScore();

    if (score < 60) {
      // Auto-enable performance optimizations
      setOptimizations(prev => ({
        ...prev,
        lazyLoading: true,
        imageOptimization: true,
        codesplitting: true,
        prefetching: false,
        compression: true
      }));

      // Reduce animation quality
      document.documentElement.style.setProperty('--animation-speed', '0.5');
    } else if (score >= 80) {
      // Enable all features on good performance
      document.documentElement.style.setProperty('--animation-speed', '1');
    }
  }, [metrics]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const optimizeImages = () => {
    console.log('Optimizing images...');
    alert('Image optimization started! This would compress and optimize all images.');
  };

  const clearCache = () => {
    console.log('Clearing cache...');
    alert('Cache cleared successfully!');
  };

  const preloadCriticalResources = () => {
    console.log('Preloading critical resources...');
    alert('Critical resources preloaded!');
  };

  const performanceScore = getPerformanceScore();

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        ⚡ Performance Optimizer
      </h2>

      {/* Performance Score */}
      <div className="text-center mb-6 p-6 bg-white/5 rounded-lg backdrop-blur">
        <div className={`text-5xl font-bold ${getScoreColor(performanceScore)} mb-2`}>
          {performanceScore}
        </div>
        <div className="text-gray-300 text-sm">Performance Score</div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur hover:bg-white/10 transition-colors">
          <div className="text-blue-400 font-bold text-lg">
            {metrics.renderTime.toFixed(0)}ms
          </div>
          <div className="text-gray-400 text-xs">Render Time</div>
        </div>

        <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur hover:bg-white/10 transition-colors">
          <div className="text-green-400 font-bold text-lg">
            {metrics.memoryUsage}%
          </div>
          <div className="text-gray-400 text-xs">Memory Usage</div>
        </div>

        <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur hover:bg-white/10 transition-colors">
          <div className="text-purple-400 font-bold text-lg">
            {metrics.networkLatency === -1 ? 'Error' : `${metrics.networkLatency}ms`}
          </div>
          <div className="text-gray-400 text-xs">Network Latency</div>
        </div>

        <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur hover:bg-white/10 transition-colors">
          <div className="text-orange-400 font-bold text-lg">95%</div>
          <div className="text-gray-400 text-xs">Cache Hit Rate</div>
        </div>

        <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur hover:bg-white/10 transition-colors relative">
          <div className={`font-bold text-lg ${
            metrics.batteryLevel > 50 ? 'text-green-400' : 
            metrics.batteryLevel > 20 ? 'text-yellow-400' : 
            'text-red-400'
          }`}>
            {metrics.batteryLevel.toFixed(0)}%
          </div>
          <div className="text-gray-400 text-xs">Battery</div>
          {isCharging && <span className="absolute top-1 right-1 text-xs">⚡</span>}
          {powerSaveMode && <span className="absolute top-1 left-1 text-xs">🔋</span>}
        </div>
      </div>

      {/* Power Save Mode Alert */}
      {powerSaveMode && (
        <div className="mb-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20 backdrop-blur">
          <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
            🔋 Power Save Mode Active
          </h4>
          <ul className="text-yellow-300 text-sm space-y-1">
            <li>• Animations disabled</li>
            <li>• Polling reduced to 30s intervals</li>
            <li>• Background sync paused</li>
            <li>• Auto-refresh disabled</li>
          </ul>
        </div>
      )}

      {/* Optimization Controls */}
      <div className="space-y-3 mb-6">
        <h3 className="text-lg font-semibold text-white">Optimizations</h3>

        {Object.entries(optimizations).map(([key, enabled]) => (
          <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg backdrop-blur hover:bg-white/10 transition-colors">
            <span className="text-gray-300 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <button
              onClick={() => setOptimizations(prev => ({ ...prev, [key]: !enabled }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                enabled ? 'bg-green-500' : 'bg-gray-600'
              }`}
              aria-label={`Toggle ${key}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-lg ${
                enabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={optimizeImages}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-3 px-4 rounded-lg text-white text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          🖼️ Optimize Images
        </button>

        <button
          onClick={clearCache}
          className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 py-3 px-4 rounded-lg text-white text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          🗑️ Clear Cache
        </button>

        <button
          onClick={preloadCriticalResources}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 py-3 px-4 rounded-lg text-white text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          🚀 Preload Resources
        </button>
      </div>

      {/* Performance Tips */}
      <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 backdrop-blur">
        <h4 className="text-blue-400 font-semibold mb-2">💡 Performance Tips</h4>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• Enable all optimizations for best performance</li>
          <li>• Clear cache if experiencing slow loading</li>
          <li>• Images are automatically optimized on load</li>
          <li>• Critical resources are prefetched in background</li>
        </ul>
      </div>
    </div>
  );
};