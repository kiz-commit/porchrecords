export interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'contrast' | 'keyboard' | 'semantics' | 'aria' | 'images' | 'forms' | 'headings' | 'links';
  message: string;
  element?: string;
  suggestion?: string;
  wcagCriteria?: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
    total: number;
  };
  recommendations: string[];
}

export interface ColorContrastResult {
  ratio: number;
  passes: boolean;
  level: 'AAA' | 'AA' | 'fail';
}

// WCAG 2.1 AA Compliance Checker
export class AccessibilityChecker {
  private issues: AccessibilityIssue[] = [];

  // Check color contrast ratio
  checkColorContrast(foreground: string, background: string): ColorContrastResult {
    const ratio = this.calculateContrastRatio(foreground, background);
    
    return {
      ratio,
      passes: ratio >= 4.5, // AA standard for normal text
      level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'fail'
    };
  }

  // Calculate contrast ratio using WCAG formula
  private calculateContrastRatio(foreground: string, background: string): number {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Calculate relative luminance
  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Convert hex color to RGB
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Check heading structure
  checkHeadingStructure(headings: { level: number; text: string }[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    let previousLevel = 0;
    
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      
      // Check for skipped heading levels
      if (heading.level > previousLevel + 1) {
        issues.push({
          id: `heading-skip-${i}`,
          type: 'error',
          category: 'headings',
          message: `Heading level ${heading.level} is skipped. Previous heading was level ${previousLevel}`,
          element: `h${heading.level}`,
          suggestion: `Use heading level ${previousLevel + 1} instead of ${heading.level}`,
          wcagCriteria: '1.3.1',
          severity: 'high'
        });
      }
      
      previousLevel = heading.level;
    }
    
    return issues;
  }

  // Check for missing alt text on images
  checkImageAccessibility(images: { src: string; alt?: string; decorative?: boolean }[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    images.forEach((image, index) => {
      if (!image.alt && !image.decorative) {
        issues.push({
          id: `image-alt-${index}`,
          type: 'error',
          category: 'images',
          message: 'Image missing alt text',
          element: 'img',
          suggestion: 'Add descriptive alt text or mark as decorative',
          wcagCriteria: '1.1.1',
          severity: 'high'
        });
      } else if (image.alt === '' && !image.decorative) {
        issues.push({
          id: `image-alt-empty-${index}`,
          type: 'warning',
          category: 'images',
          message: 'Image has empty alt text but is not marked as decorative',
          element: 'img',
          suggestion: 'Add descriptive alt text or mark as decorative',
          wcagCriteria: '1.1.1',
          severity: 'medium'
        });
      }
    });
    
    return issues;
  }

  // Check form accessibility
  checkFormAccessibility(forms: { 
    inputs: { id?: string; label?: string; type: string; required?: boolean }[];
    buttons: { text: string; type: string }[];
  }[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    forms.forEach((form, formIndex) => {
      form.inputs.forEach((input, inputIndex) => {
        // Check for missing labels
        if (!input.label && input.type !== 'hidden') {
          issues.push({
            id: `form-label-${formIndex}-${inputIndex}`,
            type: 'error',
            category: 'forms',
            message: `Form input missing label`,
            element: 'input',
            suggestion: 'Add a label element or aria-label attribute',
            wcagCriteria: '3.3.2',
            severity: 'high'
          });
        }
        
        // Check for missing IDs on required inputs
        if (input.required && !input.id) {
          issues.push({
            id: `form-id-${formIndex}-${inputIndex}`,
            type: 'warning',
            category: 'forms',
            message: 'Required form input missing ID',
            element: 'input',
            suggestion: 'Add an ID attribute for better accessibility',
            wcagCriteria: '3.3.2',
            severity: 'medium'
          });
        }
      });
      
      // Check for submit buttons
      const hasSubmitButton = form.buttons.some(btn => btn.type === 'submit');
      if (!hasSubmitButton) {
        issues.push({
          id: `form-submit-${formIndex}`,
          type: 'warning',
          category: 'forms',
          message: 'Form missing submit button',
          element: 'form',
          suggestion: 'Add a submit button or ensure form can be submitted',
          wcagCriteria: '3.2.2',
          severity: 'medium'
        });
      }
    });
    
    return issues;
  }

  // Check keyboard navigation
  checkKeyboardNavigation(elements: { 
    type: string; 
    focusable: boolean; 
    tabIndex?: number;
    interactive?: boolean;
  }[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    elements.forEach((element, index) => {
      // Check for non-focusable interactive elements
      if (element.interactive && !element.focusable) {
        issues.push({
          id: `keyboard-focus-${index}`,
          type: 'error',
          category: 'keyboard',
          message: 'Interactive element not keyboard accessible',
          element: element.type,
          suggestion: 'Add tabindex="0" or make element focusable',
          wcagCriteria: '2.1.1',
          severity: 'high'
        });
      }
      
      // Check for invalid tabindex values
      if (element.tabIndex && element.tabIndex > 0) {
        issues.push({
          id: `keyboard-tabindex-${index}`,
          type: 'warning',
          category: 'keyboard',
          message: 'Positive tabindex can create confusing tab order',
          element: element.type,
          suggestion: 'Use tabindex="0" or remove tabindex attribute',
          wcagCriteria: '2.4.3',
          severity: 'medium'
        });
      }
    });
    
    return issues;
  }

  // Check ARIA attributes
  checkARIAUsage(elements: {
    type: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    role?: string;
    ariaExpanded?: boolean;
    ariaHidden?: boolean;
  }[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    elements.forEach((element, index) => {
      // Check for redundant ARIA labels
      if (element.ariaLabel && element.ariaLabelledby) {
        issues.push({
          id: `aria-redundant-${index}`,
          type: 'warning',
          category: 'aria',
          message: 'Element has both aria-label and aria-labelledby',
          element: element.type,
          suggestion: 'Choose one labeling method to avoid conflicts',
          wcagCriteria: '4.1.2',
          severity: 'medium'
        });
      }
      
      // Check for missing labels on elements with roles
      if (element.role && !element.ariaLabel && !element.ariaLabelledby) {
        issues.push({
          id: `aria-no-label-${index}`,
          type: 'error',
          category: 'aria',
          message: 'Element with ARIA role missing accessible name',
          element: element.type,
          suggestion: 'Add aria-label, aria-labelledby, or visible text',
          wcagCriteria: '4.1.2',
          severity: 'high'
        });
      }
    });
    
    return issues;
  }

  // Check link accessibility
  checkLinkAccessibility(links: { 
    text: string; 
    href: string; 
    title?: string;
    isImage?: boolean;
  }[]): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    
    links.forEach((link, index) => {
      // Check for generic link text
      const genericTexts = ['click here', 'read more', 'learn more', 'more', 'link'];
      if (genericTexts.some(text => link.text.toLowerCase().includes(text))) {
        issues.push({
          id: `link-generic-${index}`,
          type: 'warning',
          category: 'links',
          message: 'Link text is generic and may not be descriptive',
          element: 'a',
          suggestion: 'Use more descriptive link text that explains the destination',
          wcagCriteria: '2.4.4',
          severity: 'medium'
        });
      }
      
      // Check for empty links
      if (!link.text.trim() && !link.isImage) {
        issues.push({
          id: `link-empty-${index}`,
          type: 'error',
          category: 'links',
          message: 'Link has no accessible text',
          element: 'a',
          suggestion: 'Add descriptive text or aria-label',
          wcagCriteria: '2.4.4',
          severity: 'high'
        });
      }
    });
    
    return issues;
  }

  // Generate comprehensive accessibility report
  generateReport(pageData: any): AccessibilityReport {
    this.issues = [];
    
    // Run all accessibility checks
    const headingIssues = this.checkHeadingStructure(pageData.headings || []);
    const imageIssues = this.checkImageAccessibility(pageData.images || []);
    const formIssues = this.checkFormAccessibility(pageData.forms || []);
    const keyboardIssues = this.checkKeyboardNavigation(pageData.elements || []);
    const ariaIssues = this.checkARIAUsage(pageData.ariaElements || []);
    const linkIssues = this.checkLinkAccessibility(pageData.links || []);
    
    this.issues = [
      ...headingIssues,
      ...imageIssues,
      ...formIssues,
      ...keyboardIssues,
      ...ariaIssues,
      ...linkIssues
    ];
    
    // Calculate score (100 - points deducted for issues)
    const errorPoints = this.issues.filter(i => i.type === 'error').length * 10;
    const warningPoints = this.issues.filter(i => i.type === 'warning').length * 5;
    const infoPoints = this.issues.filter(i => i.type === 'info').length * 2;
    
    const score = Math.max(0, 100 - errorPoints - warningPoints - infoPoints);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations();
    
    return {
      score,
      issues: this.issues,
      summary: {
        errors: this.issues.filter(i => i.type === 'error').length,
        warnings: this.issues.filter(i => i.type === 'warning').length,
        info: this.issues.filter(i => i.type === 'info').length,
        total: this.issues.length
      },
      recommendations
    };
  }

  // Generate improvement recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const errorCount = this.issues.filter(i => i.type === 'error').length;
    const warningCount = this.issues.filter(i => i.type === 'warning').length;
    
    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} critical accessibility errors first`);
    }
    
    if (warningCount > 0) {
      recommendations.push(`Address ${warningCount} accessibility warnings`);
    }
    
    // Category-specific recommendations
    const categories = this.issues.map(i => i.category);
    
    if (categories.includes('contrast')) {
      recommendations.push('Improve color contrast ratios to meet WCAG AA standards');
    }
    
    if (categories.includes('keyboard')) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
    }
    
    if (categories.includes('images')) {
      recommendations.push('Add descriptive alt text to all images');
    }
    
    if (categories.includes('forms')) {
      recommendations.push('Add proper labels and error handling to forms');
    }
    
    if (categories.includes('headings')) {
      recommendations.push('Fix heading structure to follow logical hierarchy');
    }
    
    return recommendations;
  }

  // Get issues by category
  getIssuesByCategory(category: string): AccessibilityIssue[] {
    return this.issues.filter(issue => issue.category === category);
  }

  // Get issues by severity
  getIssuesBySeverity(severity: 'high' | 'medium' | 'low'): AccessibilityIssue[] {
    return this.issues.filter(issue => issue.severity === severity);
  }

  // Clear all issues
  clearIssues(): void {
    this.issues = [];
  }
}

// Utility functions for common accessibility improvements
export const accessibilityUtils = {
  // Generate accessible ID
  generateId: (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Check if element is focusable
  isFocusable: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    const disabled = element.hasAttribute('disabled');
    const hidden = element.hasAttribute('hidden');
    
    if (disabled || hidden) return false;
    
    // Elements that are naturally focusable
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'IFRAME'];
    if (focusableTags.includes(element.tagName)) return true;
    
    // Elements with tabindex >= 0
    if (tabIndex !== null && parseInt(tabIndex) >= 0) return true;
    
    return false;
  },

  // Add keyboard event handlers
  addKeyboardHandlers: (element: HTMLElement, handlers: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onTab?: (event: KeyboardEvent) => void;
  }): void => {
    element.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'Enter':
          handlers.onEnter?.();
          break;
        case ' ':
          event.preventDefault();
          handlers.onSpace?.();
          break;
        case 'Escape':
          handlers.onEscape?.();
          break;
        case 'Tab':
          handlers.onTab?.(event);
          break;
      }
    });
  },

  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Focus management
  focusFirstFocusable: (container: HTMLElement): void => {
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }
  },

  // Trap focus within container
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }
};

// Export singleton instance
export const accessibilityChecker = new AccessibilityChecker(); 