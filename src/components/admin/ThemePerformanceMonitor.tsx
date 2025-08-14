'use client';

import React, { useState, useEffect } from 'react';
import { useThemeCacheManagement } from '@/hooks/useThemeCache';
import { performanceMonitor } from '@/lib/theme-cache';

interface ThemePerformanceMonitorProps {
  className?: string;
}

export function ThemePerformanceMonitor({ className = '' }: ThemePerformanceMonitorProps) {
  const { clearCache, getCacheStats, getPerformanceMetrics } = useThemeCacheManagement();
  const [stats, setStats] = useState(getCacheStats());
  const [metrics, setMetrics] = useState(getPerformanceMetrics());
  const [isExpanded, setIsExpanded] = useState(false);

  // Update stats and metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats());
      setMetrics(getPerformanceMetrics());
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [getCacheStats, getPerformanceMetrics]);

  const formatTime = (ms: number): string => {
    if (ms < 1) return '<1ms';
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getPerformanceColor = (value: number, threshold: number): string => {
    if (value <= threshold) return 'text-green-600';
    if (value <= threshold * 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleClearCache = () => {
    clearCache();
    setStats(getCacheStats());
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Theme Performance</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={handleClearCache}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getPerformanceColor(metrics.averageLoadTime, 100)}`}>
            {formatTime(metrics.averageLoadTime)}
          </div>
          <div className="text-sm text-gray-600">Avg Load Time</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${getPerformanceColor(metrics.averageCSSUpdateTime, 16)}`}>
            {formatTime(metrics.averageCSSUpdateTime)}
          </div>
          <div className="text-sm text-gray-600">Avg CSS Update</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {formatPercentage(metrics.cacheHitRate)}
          </div>
          <div className="text-sm text-gray-600">Cache Hit Rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700">
            {stats.hits + stats.misses}
          </div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-green-50 p-3 rounded">
          <div className="text-lg font-semibold text-green-700">{stats.hits}</div>
          <div className="text-sm text-green-600">Cache Hits</div>
        </div>
        
        <div className="bg-red-50 p-3 rounded">
          <div className="text-lg font-semibold text-red-700">{stats.misses}</div>
          <div className="text-sm text-red-600">Cache Misses</div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-lg font-semibold text-blue-700">{stats.sets}</div>
          <div className="text-sm text-blue-600">Cache Sets</div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded">
          <div className="text-lg font-semibold text-yellow-700">{stats.invalidations}</div>
          <div className="text-sm text-yellow-600">Invalidations</div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {isExpanded && (
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Performance Metrics</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {metrics.recentMetrics.slice(-10).reverse().map((metric, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                <div className="flex items-center space-x-4">
                  <span className={`w-3 h-3 rounded-full ${metric.cacheHit ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-gray-600">
                    Load: {formatTime(metric.loadTime)}
                  </span>
                  <span className="text-gray-600">
                    CSS: {formatTime(metric.cssUpdateTime)}
                  </span>
                </div>
                <span className="text-gray-500">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Performance Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {metrics.averageLoadTime > 100 && (
            <li>• Consider enabling more aggressive caching for theme data</li>
          )}
          {metrics.averageCSSUpdateTime > 16 && (
            <li>• CSS updates are taking longer than ideal - check for heavy DOM operations</li>
          )}
          {metrics.cacheHitRate < 0.8 && (
            <li>• Cache hit rate is low - consider increasing cache TTL or preloading themes</li>
          )}
          {metrics.cacheHitRate >= 0.8 && metrics.averageLoadTime < 50 && (
            <li>• Excellent performance! Theme system is running optimally</li>
          )}
        </ul>
      </div>
    </div>
  );
} 