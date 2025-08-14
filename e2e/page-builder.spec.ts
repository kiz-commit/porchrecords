import { test, expect } from '@playwright/test';

test.describe('Page Builder E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin pages section
    await page.goto('/admin/pages');
    
    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test.describe('Page Creation Workflow', () => {
    test('should create a new page with hero section', async ({ page }) => {
      // Click create new page button
      await page.click('button:has-text("Create New Page")');
      
      // Fill in page details
      await page.fill('input[placeholder*="title"]', 'Test E2E Page');
      await page.fill('input[placeholder*="slug"]', 'test-e2e-page');
      await page.fill('textarea[placeholder*="description"]', 'A test page created via E2E testing');
      
      // Save the page
      await page.click('button:has-text("Save")');
      
      // Wait for save to complete
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      
      // Verify page was created
      await expect(page.locator('text=Test E2E Page')).toBeVisible();
    });

    test('should add sections to a page', async ({ page }) => {
      // Create a new page first
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Section Test Page');
      await page.fill('input[placeholder*="slug"]', 'section-test-page');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      
      // Open the page for editing
      await page.click('text=Section Test Page');
      
      // Wait for PageBuilder to load
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Open sidebar to add sections
      await page.click('button[title="Toggle Sidebar"]');
      
      // Add a hero section
      await page.click('text=Hero Section');
      await expect(page.locator('text=Hero Section')).toBeVisible();
      
      // Add a text section
      await page.click('text=Text Section');
      await expect(page.locator('text=Text Section')).toBeVisible();
      
      // Add a contact section
      await page.click('text=Contact Section');
      await expect(page.locator('text=Contact Section')).toBeVisible();
    });
  });

  test.describe('Section Editing Workflow', () => {
    test('should edit section content', async ({ page }) => {
      // Create and open a page with sections
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Edit Test Page');
      await page.fill('input[placeholder*="slug"]', 'edit-test-page');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Edit Test Page');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Add a text section
      await page.click('button[title="Toggle Sidebar"]');
      await page.click('text=Text Section');
      
      // Click on the section to edit it
      await page.click('text=Text Section');
      
      // Wait for section editor to appear
      await page.waitForSelector('[data-testid="section-editor"]', { timeout: 10000 });
      
      // Edit the section title
      await page.fill('input[value="Text Section"]', 'Updated Text Section');
      
      // Edit the section content
      await page.fill('textarea', 'This is updated content for the text section.');
      
      // Verify changes are reflected
      await expect(page.locator('text=Updated Text Section')).toBeVisible();
      await expect(page.locator('text=This is updated content for the text section.')).toBeVisible();
    });

    test('should configure hero section settings', async ({ page }) => {
      // Create and open a page
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Hero Config Test');
      await page.fill('input[placeholder*="slug"]', 'hero-config-test');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Hero Config Test');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Add a hero section
      await page.click('button[title="Toggle Sidebar"]');
      await page.click('text=Hero Section');
      await page.click('text=Hero Section');
      
      // Wait for section editor
      await page.waitForSelector('[data-testid="section-editor"]', { timeout: 10000 });
      
      // Configure hero settings
      await page.fill('input[placeholder*="button text"]', 'Get Started');
      await page.fill('input[placeholder*="button link"]', '/get-started');
      await page.selectOption('select[name="textAlignment"]', 'center');
      await page.selectOption('select[name="buttonStyle"]', 'primary');
      
      // Verify settings are applied
      await expect(page.locator('text=Get Started')).toBeVisible();
    });
  });

  test.describe('Preview and Publishing Workflow', () => {
    test('should preview page before publishing', async ({ page }) => {
      // Create a page with content
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Preview Test Page');
      await page.fill('input[placeholder*="slug"]', 'preview-test-page');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Preview Test Page');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Add some content
      await page.click('button[title="Toggle Sidebar"]');
      await page.click('text=Hero Section');
      await page.click('text=Text Section');
      
      // Enable preview mode
      await page.click('button:has-text("Preview")');
      
      // Wait for preview mode to activate
      await page.waitForSelector('text=Preview Mode', { timeout: 10000 });
      
      // Verify preview shows content
      await expect(page.locator('text=Hero Section')).toBeVisible();
      await expect(page.locator('text=Text Section')).toBeVisible();
      
      // Exit preview mode
      await page.click('button:has-text("Exit Preview")');
    });

    test('should publish a page', async ({ page }) => {
      // Create a page
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Publish Test Page');
      await page.fill('input[placeholder*="slug"]', 'publish-test-page');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Publish Test Page');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Add content
      await page.click('button[title="Toggle Sidebar"]');
      await page.click('text=Hero Section');
      
      // Publish the page
      await page.click('button:has-text("Publish")');
      
      // Wait for publish confirmation
      await page.waitForSelector('text=Page published successfully', { timeout: 10000 });
      
      // Verify page is published
      await expect(page.locator('text=Published')).toBeVisible();
    });
  });

  test.describe('Template System Workflow', () => {
    test('should apply a template to a page', async ({ page }) => {
      // Create a new page
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Template Test Page');
      await page.fill('input[placeholder*="slug"]', 'template-test-page');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Template Test Page');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Open sidebar and show templates
      await page.click('button[title="Toggle Sidebar"]');
      await page.click('text=Show Templates');
      
      // Apply a template
      await page.click('button:has-text("Apply")');
      
      // Verify template sections were added
      await expect(page.locator('text=Hero Section')).toBeVisible();
      await expect(page.locator('text=Text Section')).toBeVisible();
    });

    test('should add individual sections from template', async ({ page }) => {
      // Create a new page
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Individual Sections Test');
      await page.fill('input[placeholder*="slug"]', 'individual-sections-test');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Individual Sections Test');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Open sidebar and show templates
      await page.click('button[title="Toggle Sidebar"]');
      await page.click('text=Show Templates');
      
      // Add individual sections from template
      await page.click('button:has-text("+ Hero Section")');
      await page.click('button:has-text("+ Text Section")');
      
      // Verify sections were added
      await expect(page.locator('text=Hero Section')).toBeVisible();
      await expect(page.locator('text=Text Section')).toBeVisible();
    });
  });

  test.describe('Accessibility Features', () => {
    test('should run accessibility checker', async ({ page }) => {
      // Create a page with content
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Accessibility Test Page');
      await page.fill('input[placeholder*="slug"]', 'accessibility-test-page');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Accessibility Test Page');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Add content
      await page.click('button[title="Toggle Sidebar"]');
      await page.click('text=Hero Section');
      
      // Open accessibility checker
      await page.click('text=Accessibility Checker');
      
      // Wait for accessibility analysis to complete
      await page.waitForSelector('text=/[0-9]+/[0-9]+/', { timeout: 10000 });
      
      // Verify accessibility report is displayed
      await expect(page.locator('text=Summary')).toBeVisible();
      await expect(page.locator('text=Issues')).toBeVisible();
      await expect(page.locator('text=Recommendations')).toBeVisible();
    });

    test('should show accessibility score', async ({ page }) => {
      // Create a page
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Score Test Page');
      await page.fill('input[placeholder*="slug"]', 'score-test-page');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Score Test Page');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Open accessibility checker
      await page.click('text=Accessibility Checker');
      
      // Wait for score to appear
      await page.waitForSelector('text=/[0-9]+\\/100/', { timeout: 10000 });
      
      // Verify score is displayed
      const scoreElement = page.locator('text=/[0-9]+\\/100/');
      await expect(scoreElement).toBeVisible();
      
      // Verify score is a number between 0 and 100
      const scoreText = await scoreElement.textContent();
      const score = parseInt(scoreText!.split('/')[0]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network error by going offline
      await page.context().setOffline(true);
      
      // Try to create a page
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Error Test Page');
      await page.click('button:has-text("Save")');
      
      // Should show error message
      await expect(page.locator('text=error')).toBeVisible();
      
      // Go back online
      await page.context().setOffline(false);
    });

    test('should handle validation errors', async ({ page }) => {
      // Create a page without required fields
      await page.click('button:has-text("Create New Page")');
      await page.click('button:has-text("Save")');
      
      // Should show validation errors
      await expect(page.locator('text=required')).toBeVisible();
    });
  });

  test.describe('Performance Testing', () => {
    test('should handle many sections efficiently', async ({ page }) => {
      // Create a page
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Performance Test Page');
      await page.fill('input[placeholder*="slug"]', 'performance-test-page');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Performance Test Page');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Add many sections
      await page.click('button[title="Toggle Sidebar"]');
      
      const startTime = Date.now();
      
      // Add 10 sections
      for (let i = 0; i < 10; i++) {
        await page.click('text=Text Section');
        await page.waitForTimeout(100); // Small delay to ensure section is added
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(10000);
      
      // Verify all sections were added
      const sections = page.locator('text=Text Section');
      await expect(sections).toHaveCount(10);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Create a page
      await page.click('button:has-text("Create New Page")');
      await page.fill('input[placeholder*="title"]', 'Mobile Test Page');
      await page.fill('input[placeholder*="slug"]', 'mobile-test-page');
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Page saved successfully', { timeout: 10000 });
      await page.click('text=Mobile Test Page');
      await page.waitForSelector('[data-testid="page-header"]', { timeout: 10000 });
      
      // Test sidebar on mobile
      await page.click('button[title="Toggle Sidebar"]');
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
      
      // Add a section on mobile
      await page.click('text=Hero Section');
      await expect(page.locator('text=Hero Section')).toBeVisible();
      
      // Test section editing on mobile
      await page.click('text=Hero Section');
      await page.waitForSelector('[data-testid="section-editor"]', { timeout: 10000 });
      
      // Verify editor is accessible on mobile
      await expect(page.locator('input[value="Hero Section"]')).toBeVisible();
    });
  });
}); 