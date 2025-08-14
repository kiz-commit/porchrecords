"use client";

import { useState, useEffect, useCallback } from 'react';
import { type CartItem } from './useCart';
import { type InventoryIssue } from '@/components/InventoryAlert';

interface ValidationResult {
  itemId: string;
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
  maxQuantity?: number;
  isAvailable: boolean;
  isPreorder?: boolean;
  error?: string;
}

interface InventoryValidationState {
  issues: InventoryIssue[];
  isValidating: boolean;
  lastValidated: Date | null;
  canProceedToCheckout: boolean;
  summary: {
    totalIssues: number;
    outOfStockItems: number;
    lowStockItems: number;
    preorderIssues: number;
  };
}

export function useInventoryValidation() {
  const [state, setState] = useState<InventoryValidationState>({
    issues: [],
    isValidating: false,
    lastValidated: null,
    canProceedToCheckout: true,
    summary: {
      totalIssues: 0,
      outOfStockItems: 0,
      lowStockItems: 0,
      preorderIssues: 0
    }
  });

  const validateInventory = useCallback(async (cartItems: CartItem[]) => {
    if (cartItems.length === 0) {
      setState(prev => ({
        ...prev,
        issues: [],
        canProceedToCheckout: true,
        summary: {
          totalIssues: 0,
          outOfStockItems: 0,
          lowStockItems: 0,
          preorderIssues: 0
        }
      }));
      return;
    }

    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch('/api/checkout/validate-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartItems }),
      });

      if (response.ok) {
        const result = await response.json();
        const issues = convertValidationResultsToIssues(result.validationResults);
        const summary = calculateSummary(issues);

        setState(prev => ({
          ...prev,
          issues,
          canProceedToCheckout: result.success,
          lastValidated: new Date(),
          summary
        }));
      } else {
        throw new Error('Failed to validate inventory');
      }
    } catch (error) {
      console.error('Inventory validation failed:', error);
      // Set a generic error state
      setState(prev => ({
        ...prev,
        issues: cartItems.map(item => ({
          itemId: item.id,
          productName: item.product.title,
          issue: 'unavailable' as const,
          currentQuantity: item.quantity,
          requestedQuantity: item.quantity,
          availableQuantity: 0,
          message: 'Unable to check inventory - please try again'
        })),
        canProceedToCheckout: false,
        summary: {
          totalIssues: cartItems.length,
          outOfStockItems: cartItems.length,
          lowStockItems: 0,
          preorderIssues: 0
        }
      }));
    } finally {
      setState(prev => ({ ...prev, isValidating: false }));
    }
  }, []);

  const convertValidationResultsToIssues = (validationResults: ValidationResult[]): InventoryIssue[] => {
    return validationResults
      .filter(result => !result.isAvailable || result.error)
      .map(result => {
        let issue: InventoryIssue['issue'] = 'unavailable';
        let message = result.error || 'Item unavailable';

        if (result.availableQuantity === 0) {
          issue = 'out_of_stock';
          message = `${result.productName} is currently out of stock`;
        } else if (result.requestedQuantity > result.availableQuantity) {
          if (result.isPreorder) {
            issue = 'preorder_limited';
            message = `Only ${result.availableQuantity} preorder slots available for ${result.productName}`;
          } else {
            issue = 'low_stock';
            message = `Only ${result.availableQuantity} left in stock for ${result.productName}`;
          }
        }

        return {
          itemId: result.itemId,
          productName: result.productName,
          issue,
          currentQuantity: result.requestedQuantity,
          requestedQuantity: result.requestedQuantity,
          availableQuantity: result.availableQuantity,
          maxQuantity: result.maxQuantity,
          isPreorder: result.isPreorder,
          message
        };
      });
  };

  const calculateSummary = (issues: InventoryIssue[]) => {
    return {
      totalIssues: issues.length,
      outOfStockItems: issues.filter(i => i.issue === 'out_of_stock').length,
      lowStockItems: issues.filter(i => i.issue === 'low_stock').length,
      preorderIssues: issues.filter(i => i.issue === 'preorder_limited').length
    };
  };

  const getIssueForItem = useCallback((itemId: string): InventoryIssue | null => {
    return state.issues.find(issue => issue.itemId === itemId) || null;
  }, [state.issues]);

  const hasIssues = state.issues.length > 0;
  const hasBlockingIssues = state.issues.some(issue => 
    issue.issue === 'out_of_stock' || issue.issue === 'unavailable'
  );

  return {
    ...state,
    validateInventory,
    getIssueForItem,
    hasIssues,
    hasBlockingIssues,
    // Quick actions
    refresh: () => {
      // This would be called by the parent component with current cart items
    }
  };
}