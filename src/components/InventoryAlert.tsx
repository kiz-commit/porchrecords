"use client";

import { useState } from 'react';

export interface InventoryIssue {
  itemId: string;
  productName: string;
  issue: 'out_of_stock' | 'low_stock' | 'preorder_limited' | 'unavailable';
  currentQuantity: number;
  requestedQuantity: number;
  availableQuantity: number;
  maxQuantity?: number;
  isPreorder?: boolean;
  message: string;
}

interface InventoryAlertProps {
  issue: InventoryIssue;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  className?: string;
}

export default function InventoryAlert({ 
  issue, 
  onUpdateQuantity, 
  onRemoveItem, 
  className = '' 
}: InventoryAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getAlertStyle = () => {
    switch (issue.issue) {
      case 'out_of_stock':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgb(239, 68, 68)',
          textColor: 'rgb(185, 28, 28)',
          icon: '❌',
          severity: 'high'
        };
      case 'low_stock':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgb(245, 158, 11)',
          textColor: 'rgb(146, 64, 14)',
          icon: '⚠️',
          severity: 'medium'
        };
      case 'preorder_limited':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          textColor: 'rgb(30, 64, 175)',
          icon: '📅',
          severity: 'medium'
        };
      default:
        return {
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          borderColor: 'rgb(156, 163, 175)',
          textColor: 'rgb(75, 85, 99)',
          icon: '❌',
          severity: 'medium'
        };
    }
  };

  const style = getAlertStyle();

  const handleQuickFix = async () => {
    setIsUpdating(true);
    try {
      if (issue.availableQuantity > 0) {
        await onUpdateQuantity(issue.itemId, issue.availableQuantity);
      } else {
        await onRemoveItem(issue.itemId);
      }
    } catch (error) {
      console.error('Failed to apply quick fix:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getSuggestions = () => {
    const suggestions = [];
    
    switch (issue.issue) {
      case 'out_of_stock':
        suggestions.push({
          action: 'Remove Item',
          description: 'Remove this item from your cart',
          onClick: () => onRemoveItem(issue.itemId),
          primary: true
        });
        suggestions.push({
          action: 'Check Back Later',
          description: 'We\'ll restock soon',
          onClick: () => {/* Could add to wishlist */},
          primary: false
        });
        break;
        
      case 'low_stock':
      case 'preorder_limited':
        if (issue.availableQuantity > 0) {
          suggestions.push({
            action: `Update to ${issue.availableQuantity}`,
            description: `Set quantity to ${issue.availableQuantity} (maximum available)`,
            onClick: () => onUpdateQuantity(issue.itemId, issue.availableQuantity),
            primary: true
          });
        }
        suggestions.push({
          action: 'Remove Item',
          description: 'Remove this item from your cart',
          onClick: () => onRemoveItem(issue.itemId),
          primary: false
        });
        break;
    }
    
    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <div 
      className={`rounded-lg border-l-4 p-4 mt-3 ${className}`}
      style={{ 
        backgroundColor: style.backgroundColor, 
        borderLeftColor: style.borderColor,
        border: `1px solid ${style.borderColor}`,
        borderLeft: `4px solid ${style.borderColor}`
      }}
    >
      {/* Alert Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg flex-shrink-0">{style.icon}</span>
          <div className="flex-1">
            <p className="font-semibold font-mono text-sm" style={{ color: style.textColor }}>
              {issue.message}
            </p>
            
            {/* Quick status info */}
            <div className="mt-1 text-xs font-mono" style={{ color: style.textColor }}>
              {issue.issue === 'out_of_stock' && (
                <span>Currently out of stock</span>
              )}
              {issue.issue === 'low_stock' && (
                <span>Only {issue.availableQuantity} left in stock</span>
              )}
              {issue.issue === 'preorder_limited' && (
                <span>Only {issue.availableQuantity} preorder slots available</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-3 text-sm font-mono underline hover:no-underline transition-all"
          style={{ color: style.textColor }}
        >
          {isExpanded ? 'Less' : 'Fix'}
        </button>
      </div>

      {/* Expanded Actions */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: style.borderColor }}>
          <p className="text-sm font-mono mb-3" style={{ color: style.textColor }}>
            What would you like to do?
          </p>
          
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={suggestion.onClick}
                disabled={isUpdating}
                className={`w-full text-left p-3 rounded border transition-all font-mono text-sm ${
                  suggestion.primary 
                    ? 'font-semibold' 
                    : 'font-normal'
                } ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: suggestion.primary ? style.borderColor : 'transparent',
                  color: suggestion.primary ? 'white' : style.textColor,
                  borderColor: style.borderColor
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{suggestion.action}</span>
                  {isUpdating && suggestion.primary && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {suggestion.description}
                </div>
              </button>
            ))}
          </div>
          
          {/* Additional info */}
          <div className="mt-3 p-2 rounded text-xs font-mono" style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            color: style.textColor 
          }}>
            <strong>Product:</strong> {issue.productName}<br />
            <strong>Requested:</strong> {issue.requestedQuantity}<br />
            <strong>Available:</strong> {issue.availableQuantity}
            {issue.isPreorder && <><br /><strong>Type:</strong> Preorder</>}
          </div>
        </div>
      )}
    </div>
  );
}

// Summary component for multiple inventory issues
interface InventorySummaryProps {
  issues: InventoryIssue[];
  onFixAll: () => void;
  className?: string;
}

export function InventorySummary({ issues, onFixAll, className = '' }: InventorySummaryProps) {
  if (issues.length === 0) return null;

  const highPriorityIssues = issues.filter(issue => issue.issue === 'out_of_stock').length;
  const mediumPriorityIssues = issues.length - highPriorityIssues;

  return (
    <div 
      className={`rounded-lg border-l-4 p-4 mb-4 ${className}`}
      style={{ 
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderLeftColor: 'rgb(239, 68, 68)',
        border: '1px solid rgb(239, 68, 68)'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🛒</span>
          <div>
            <p className="font-semibold font-mono text-sm" style={{ color: 'rgb(185, 28, 28)' }}>
              Cart Needs Attention
            </p>
            <p className="text-xs font-mono mt-1" style={{ color: 'rgb(185, 28, 28)' }}>
              {issues.length} item{issues.length !== 1 ? 's' : ''} {issues.length === 1 ? 'needs' : 'need'} updating
              {highPriorityIssues > 0 && ` • ${highPriorityIssues} out of stock`}
            </p>
          </div>
        </div>
        
        <button
          onClick={onFixAll}
          className="px-4 py-2 text-sm font-mono font-semibold rounded transition-all hover:opacity-80"
          style={{
            backgroundColor: 'rgb(239, 68, 68)',
            color: 'white'
          }}
        >
          Fix All
        </button>
      </div>
    </div>
  );
}