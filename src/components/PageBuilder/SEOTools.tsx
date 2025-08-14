"use client";

import React, { useState, useEffect } from 'react';
import { 
  analyzeSEO, 
  generateMetaTags, 
  getSEOSuggestions,
  getCharacterCount,
  getWordCount,
  getReadingTime,
  SEOScore, 
  MetaTags, 
  PageContent 
} from '@/lib/seo-utils';
import { Search, TrendingUp, Target, Eye, Share2, Settings, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface SEOToolsProps {
  page: PageContent;
  onUpdateMeta?: (meta: MetaTags) => void;
  className?: string;
}

export default function SEOTools({ page, onUpdateMeta, className = '' }: SEOToolsProps) {
  const [seoScore, setSeoScore] = useState<SEOScore | null>(null);
  const [metaTags, setMetaTags] = useState<MetaTags | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'meta' | 'suggestions'>('analysis');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (page) {
      analyzePage();
      generateMeta();
    }
  }, [page]);

  const analyzePage = async () => {
    setIsAnalyzing(true);
    try {
      const score = analyzeSEO(page);
      setSeoScore(score);
    } catch (error) {
      console.error('SEO analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMeta = () => {
    const meta = generateMetaTags(page);
    setMetaTags(meta);
  };

  const handleMetaUpdate = (field: keyof MetaTags, value: string | string[]) => {
    if (!metaTags) return;
    
    const updatedMeta = { ...metaTags, [field]: value };
    setMetaTags(updatedMeta);
    onUpdateMeta?.(updatedMeta);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-4 h-4" />;
    if (score >= 70) return <AlertCircle className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  const renderScoreCard = (title: string, score: number, details: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
          {getScoreIcon(score)}
          <span>{score}/100</span>
        </div>
      </div>
      
      {details.issues.length > 0 && (
        <div className="mb-3">
          <h5 className="text-xs font-medium text-red-700 mb-1">Issues:</h5>
          <ul className="text-xs text-red-600 space-y-1">
            {details.issues.map((issue: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {details.suggestions.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-blue-700 mb-1">Suggestions:</h5>
          <ul className="text-xs text-blue-600 space-y-1">
            {details.suggestions.map((suggestion: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderMetaEditor = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Page Title
            <span className="text-xs text-gray-500 ml-1">
              ({getCharacterCount(metaTags?.title || '')}/60)
            </span>
          </label>
          <input
            type="text"
            value={metaTags?.title || ''}
            onChange={(e) => handleMetaUpdate('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter page title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
            <span className="text-xs text-gray-500 ml-1">
              ({getCharacterCount(metaTags?.description || '')}/160)
            </span>
          </label>
          <textarea
            value={metaTags?.description || ''}
            onChange={(e) => handleMetaUpdate('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter meta description"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Keywords (comma-separated)
        </label>
        <input
          type="text"
          value={metaTags?.keywords?.join(', ') || ''}
          onChange={(e) => handleMetaUpdate('keywords', e.target.value.split(',').map(k => k.trim()))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter keywords"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Open Graph Title
          </label>
          <input
            type="text"
            value={metaTags?.ogTitle || ''}
            onChange={(e) => handleMetaUpdate('ogTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter OG title"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Open Graph Description
          </label>
          <textarea
            value={metaTags?.ogDescription || ''}
            onChange={(e) => handleMetaUpdate('ogDescription', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter OG description"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Open Graph Image URL
        </label>
        <input
          type="url"
          value={metaTags?.ogImage || ''}
          onChange={(e) => handleMetaUpdate('ogImage', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter OG image URL"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Canonical URL
          </label>
          <input
            type="url"
            value={metaTags?.canonical || ''}
            onChange={(e) => handleMetaUpdate('canonical', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter canonical URL"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Robots
          </label>
          <select
            value={metaTags?.robots || ''}
            onChange={(e) => handleMetaUpdate('robots', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="index, follow">Index, Follow</option>
            <option value="noindex, follow">No Index, Follow</option>
            <option value="index, nofollow">Index, No Follow</option>
            <option value="noindex, nofollow">No Index, No Follow</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderContentStats = () => {
    const allContent = page.sections
      .map(section => {
        let content = '';
        if (section.content) content += JSON.stringify(section.content) + ' ';
        return content;
      })
      .join(' ');

    const wordCount = getWordCount(allContent);
    const charCount = getCharacterCount(allContent);
    const readingTime = getReadingTime(allContent);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{wordCount}</div>
          <div className="text-xs text-gray-600">Words</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{charCount}</div>
          <div className="text-xs text-gray-600">Characters</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{readingTime}</div>
          <div className="text-xs text-gray-600">Min Read</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{page.sections.length}</div>
          <div className="text-xs text-gray-600">Sections</div>
        </div>
      </div>
    );
  };

  if (!page) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2" />
          <p>No page content to analyze</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">SEO Tools</h3>
          </div>
          <button
            onClick={analyzePage}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Target className="w-4 h-4" />
            <span className="text-sm">{isAnalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
          </button>
        </div>
      </div>

      {/* Overall Score */}
      {seoScore && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Overall SEO Score</h4>
              <p className="text-xs text-gray-600">Based on 8 key factors</p>
            </div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(seoScore.overall)}`}>
              {getScoreIcon(seoScore.overall)}
              <span>{seoScore.overall}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* Content Stats */}
      {renderContentStats()}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Analysis</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('meta')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'meta'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Meta Tags</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suggestions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Suggestions</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'analysis' && seoScore && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderScoreCard('Title', seoScore.title, seoScore.details.title)}
            {renderScoreCard('Description', seoScore.description, seoScore.details.description)}
            {renderScoreCard('Headings', seoScore.headings, seoScore.details.headings)}
            {renderScoreCard('Content', seoScore.content, seoScore.details.content)}
            {renderScoreCard('Images', seoScore.images, seoScore.details.images)}
            {renderScoreCard('Links', seoScore.links, seoScore.details.links)}
            {renderScoreCard('Mobile', seoScore.mobile, seoScore.details.mobile)}
            {renderScoreCard('Speed', seoScore.speed, seoScore.details.speed)}
          </div>
        )}

        {activeTab === 'meta' && metaTags && (
          <div>
            {renderMetaEditor()}
            
            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Search Result Preview</h4>
              <div className="bg-white p-4 rounded border">
                <div className="text-blue-600 text-sm mb-1">{metaTags.canonical}</div>
                <div className="text-lg text-blue-800 font-medium mb-1">{metaTags.title}</div>
                <div className="text-sm text-gray-600">{metaTags.description}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && seoScore && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Priority Actions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {getSEOSuggestions(seoScore).map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">Best Practices</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Use descriptive, keyword-rich titles (30-60 characters)</li>
                <li>• Write compelling meta descriptions (120-160 characters)</li>
                <li>• Structure content with proper heading hierarchy</li>
                <li>• Add alt text to all images</li>
                <li>• Include internal and external links</li>
                <li>• Optimize for mobile devices</li>
                <li>• Ensure fast loading times</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 