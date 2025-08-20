"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageContent } from '@/lib/types';
import { 
  AccessibilityChecker as Checker, 
  AccessibilityReport, 
  AccessibilityIssue,
  accessibilityUtils 
} from '@/lib/accessibility-utils';

interface AccessibilityCheckerProps {
  page: PageContent;
  onIssuesFound?: (issues: AccessibilityIssue[]) => void;
  className?: string;
}

export default function AccessibilityChecker({ 
  page, 
  onIssuesFound, 
  className = '' 
}: AccessibilityCheckerProps) {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'issues' | 'recommendations'>('summary');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const checker = useMemo(() => new Checker(), []);

  // Analyze page accessibility
  const analyzePage = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // Extract page data for analysis
      const pageData = extractPageData(page);
      const accessibilityReport = checker.generateReport(pageData);
      
      setReport(accessibilityReport);
      onIssuesFound?.(accessibilityReport.issues);
      
      // Announce results to screen readers
      if (accessibilityReport.issues.length > 0) {
        accessibilityUtils.announce(
          `Accessibility analysis complete. Found ${accessibilityReport.issues.length} issues. Score: ${accessibilityReport.score} out of 100.`,
          'polite'
        );
      } else {
        accessibilityUtils.announce(
          'Accessibility analysis complete. No issues found. Perfect score!',
          'polite'
        );
      }
    } catch (error) {
      console.error('Accessibility analysis failed:', error);
      accessibilityUtils.announce('Accessibility analysis failed. Please try again.', 'assertive');
    } finally {
      setIsAnalyzing(false);
    }
  }, [page, onIssuesFound, checker]);

  // Extract data from page for accessibility analysis
  const extractPageData = (pageContent: PageContent) => {
    const data: any = {
      headings: [],
      images: [],
      forms: [],
      elements: [],
      ariaElements: [],
      links: []
    };

    // Extract data from sections
    pageContent.sections?.forEach(section => {
      // Extract headings from section content
      if (section.content?.title) {
        data.headings.push({
          level: 2, // Default to h2 for section titles
          text: section.content.title
        });
      }

      // TODO: Fix section data extraction for different section types
      // The current PageSection interface uses content instead of section_data
      // This will need to be updated based on the actual section data structure
    });

    return data;
  };

  // Filter issues based on selected filters
  const getFilteredIssues = () => {
    if (!report) return [];
    
    let filtered = report.issues;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(issue => issue.category === selectedCategory);
    }
    
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(issue => issue.severity === selectedSeverity);
    }
    
    return filtered;
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // Get score icon
  const getScoreIcon = (score: number) => {
    if (score >= 90) return '✅';
    if (score >= 70) return '⚠️';
    if (score >= 50) return '🔶';
    return '❌';
  };

  // Get issue type icon
  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contrast': return '🎨';
      case 'keyboard': return '⌨️';
      case 'semantics': return '📝';
      case 'aria': return '♿';
      case 'images': return '🖼️';
      case 'forms': return '📋';
      case 'headings': return '📄';
      case 'links': return '🔗';
      default: return '•';
    }
  };

  // Run analysis on mount and when page changes
  useEffect(() => {
    analyzePage();
  }, [analyzePage]);

  if (!report) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Accessibility Checker</h3>
          <button
            onClick={analyzePage}
            disabled={isAnalyzing}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            aria-label="Run accessibility analysis"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Analyzing page accessibility...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Accessibility Checker</h3>
          <button
            onClick={analyzePage}
            disabled={isAnalyzing}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            aria-label="Re-run accessibility analysis"
          >
            {isAnalyzing ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
        
        {/* Score Display */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${getScoreColor(report.score)}`}>
          <span className="text-lg">{getScoreIcon(report.score)}</span>
          <span className="font-semibold">{report.score}/100</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'summary'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'issues'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Issues ({report.issues.length})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'recommendations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Recommendations
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{report.summary.errors}</div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{report.summary.warnings}</div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{report.summary.info}</div>
                <div className="text-sm text-blue-700">Info</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Issues by Category</h4>
              <div className="space-y-2">
                {['contrast', 'keyboard', 'semantics', 'aria', 'images', 'forms', 'headings', 'links'].map(category => {
                  const categoryIssues = report.issues.filter(i => i.category === category);
                  if (categoryIssues.length === 0) return null;
                  
                  return (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="flex items-center space-x-2">
                        <span>{getCategoryIcon(category)}</span>
                        <span className="capitalize">{category}</span>
                      </span>
                      <span className="font-medium">{categoryIssues.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Categories</option>
                <option value="contrast">Contrast</option>
                <option value="keyboard">Keyboard</option>
                <option value="semantics">Semantics</option>
                <option value="aria">ARIA</option>
                <option value="images">Images</option>
                <option value="forms">Forms</option>
                <option value="headings">Headings</option>
                <option value="links">Links</option>
              </select>
              
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Issues List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getFilteredIssues().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No issues found with current filters.
                </div>
              ) : (
                getFilteredIssues().map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-lg border ${
                      issue.type === 'error' ? 'border-red-200 bg-red-50' :
                      issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getIssueTypeIcon(issue.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{issue.message}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                            issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        
                        {issue.element && (
                          <div className="text-sm text-gray-600 mb-1">
                            Element: <code className="bg-gray-100 px-1 rounded">{issue.element}</code>
                          </div>
                        )}
                        
                        {issue.suggestion && (
                          <div className="text-sm text-gray-700 mb-1">
                            <strong>Suggestion:</strong> {issue.suggestion}
                          </div>
                        )}
                        
                        {issue.wcagCriteria && (
                          <div className="text-xs text-gray-500">
                            WCAG: {issue.wcagCriteria}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Improvement Recommendations</h4>
            <div className="space-y-3">
              {report.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600">💡</span>
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </div>
              ))}
            </div>
            
            {report.recommendations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <span className="text-2xl">🎉</span>
                <p className="mt-2">Great job! No accessibility improvements needed.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible Details */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-between"
          aria-expanded={isExpanded}
        >
          <span>WCAG 2.1 AA Compliance Details</span>
          <svg
            className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 text-sm text-gray-600 space-y-2">
            <p>
              This accessibility checker evaluates your page against WCAG 2.1 AA standards, 
              which are widely adopted accessibility guidelines.
            </p>
            <p>
              <strong>Score breakdown:</strong> Errors (-10 points), Warnings (-5 points), Info (-2 points)
            </p>
            <p>
              <strong>Target:</strong> Score of 90+ for good accessibility, 70+ for acceptable accessibility.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 