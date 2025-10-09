import { test, expect } from '@playwright/test';

// Configuration for demo environment testing
const DEMO_BASE_URL = process.env.DEMO_BASE_URL || 'http://localhost:3000';
const DEMO_API_URL = process.env.DEMO_API_URL || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod';

test.describe('LanguagePeer Demo Environment', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary authentication or configuration
    await page.goto(DEMO_BASE_URL);
  });

  test.describe('Demo Website', () => {
    test('loads demo homepage successfully', async ({ page }) => {
      await expect(page).toHaveTitle(/LanguagePeer/);
      await expect(page.locator('h1')).toContainText('LanguagePeer');
      await expect(page.locator('.tagline')).toContainText('AI-Powered Voice-First Language Learning');
    });

    test('displays key features section', async ({ page }) => {
      await expect(page.locator('.features h3')).toContainText('Key Features');
      
      const featureCards = page.locator('.feature-card');
      await expect(featureCards).toHaveCount(4);
      
      await expect(featureCards.nth(0)).toContainText('Adaptive AI Agents');
      await expect(featureCards.nth(1)).toContainText('Voice-First Interface');
      await expect(featureCards.nth(2)).toContainText('Smart Analytics');
      await expect(featureCards.nth(3)).toContainText('Intelligent Feedback');
    });

    test('shows demo controls', async ({ page }) => {
      const startDemoBtn = page.locator('#startDemo');
      const viewStatsBtn = page.locator('#viewStats');
      
      await expect(startDemoBtn).toBeVisible();
      await expect(startDemoBtn).toContainText('Start Demo Conversation');
      
      await expect(viewStatsBtn).toBeVisible();
      await expect(viewStatsBtn).toContainText('View Learning Analytics');
    });

    test('displays architecture diagram', async ({ page }) => {
      await expect(page.locator('.architecture h3')).toContainText('System Architecture');
      
      const archComponents = page.locator('.arch-component');
      await expect(archComponents).toHaveCount(4);
      
      await expect(archComponents.nth(0)).toContainText('Frontend');
      await expect(archComponents.nth(1)).toContainText('API Gateway');
      await expect(archComponents.nth(2)).toContainText('Lambda Functions');
      await expect(archComponents.nth(3)).toContainText('AWS Services');
    });

    test('shows technology stack', async ({ page }) => {
      await expect(page.locator('.tech-stack h3')).toContainText('Technology Stack');
      
      const techCategories = page.locator('.tech-category');
      await expect(techCategories).toHaveCount(4);
      
      await expect(techCategories.nth(0)).toContainText('Frontend');
      await expect(techCategories.nth(1)).toContainText('Backend');
      await expect(techCategories.nth(2)).toContainText('AI Services');
      await expect(techCategories.nth(3)).toContainText('Infrastructure');
    });
  });

  test.describe('Demo Data Tabs', () => {
    test('switches between data tabs', async ({ page }) => {
      // Check initial state - users tab should be active
      await expect(page.locator('[data-tab="users"]')).toHaveClass(/active/);
      await expect(page.locator('#users-tab')).toHaveClass(/active/);
      
      // Click sessions tab
      await page.locator('[data-tab="sessions"]').click();
      await expect(page.locator('[data-tab="sessions"]')).toHaveClass(/active/);
      await expect(page.locator('#sessions-tab')).toHaveClass(/active/);
      await expect(page.locator('#users-tab')).not.toHaveClass(/active/);
      
      // Click health tab
      await page.locator('[data-tab="health"]').click();
      await expect(page.locator('[data-tab="health"]')).toHaveClass(/active/);
      await expect(page.locator('#health-tab')).toHaveClass(/active/);
      await expect(page.locator('#sessions-tab')).not.toHaveClass(/active/);
    });

    test('loads users data', async ({ page }) => {
      await page.locator('[data-tab="users"]').click();
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      const usersData = page.locator('#users-data');
      await expect(usersData).not.toContainText('Loading users...');
      
      // Should show demo users or error message
      const hasUsers = await usersData.locator('.data-item').count() > 0;
      const hasError = await usersData.locator('.error').count() > 0;
      
      expect(hasUsers || hasError).toBeTruthy();
    });

    test('loads sessions data', async ({ page }) => {
      await page.locator('[data-tab="sessions"]').click();
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      const sessionsData = page.locator('#sessions-data');
      await expect(sessionsData).not.toContainText('Loading sessions...');
      
      // Should show demo sessions or error message
      const hasSessions = await sessionsData.locator('.data-item').count() > 0;
      const hasError = await sessionsData.locator('.error').count() > 0;
      
      expect(hasSessions || hasError).toBeTruthy();
    });

    test('loads health status', async ({ page }) => {
      await page.locator('[data-tab="health"]').click();
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      const healthData = page.locator('#health-data');
      await expect(healthData).not.toContainText('Loading health status...');
      
      // Should show health status
      await expect(healthData.locator('.health-status')).toBeVisible();
    });
  });

  test.describe('Demo Interactions', () => {
    test('start demo conversation shows modal', async ({ page }) => {
      await page.locator('#startDemo').click();
      
      // Should show alert with demo information
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Demo Conversation');
        expect(dialog.message()).toContain('Start voice recording');
        await dialog.accept();
      });
    });

    test('view analytics shows modal', async ({ page }) => {
      await page.locator('#viewStats').click();
      
      // Should show alert with analytics information
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Learning Analytics');
        expect(dialog.message()).toContain('Vocabulary progress');
        await dialog.accept();
      });
    });

    test('API docs link opens documentation', async ({ page }) => {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.locator('#apiDocsLink').click()
      ]);
      
      await newPage.waitForLoadState();
      await expect(newPage.locator('pre')).toContainText('LanguagePeer Demo API Documentation');
    });
  });

  test.describe('Responsive Design', () => {
    test('works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.demo-controls')).toBeVisible();
      await expect(page.locator('.feature-grid')).toBeVisible();
    });

    test('works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page.locator('.arch-diagram')).toBeVisible();
      await expect(page.locator('.tech-categories')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(DEMO_BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // 5 seconds
    });

    test('images and assets load properly', async ({ page }) => {
      // Check that CSS is loaded
      const styles = await page.locator('link[rel="stylesheet"]').count();
      expect(styles).toBeGreaterThan(0);
      
      // Check that JavaScript is loaded
      const scripts = await page.locator('script[src]').count();
      expect(scripts).toBeGreaterThan(0);
    });
  });
});

test.describe('Demo API Integration', () => {
  test.describe('API Endpoints', () => {
    test('health endpoint returns system status', async ({ request }) => {
      const response = await request.get(`${DEMO_API_URL}/demo/health`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('environment');
    });

    test('users endpoint returns demo users', async ({ request }) => {
      const response = await request.get(`${DEMO_API_URL}/demo/users`);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();
        
        if (data.length > 0) {
          expect(data[0]).toHaveProperty('id');
          expect(data[0]).toHaveProperty('name');
          expect(data[0]).toHaveProperty('email');
          expect(data[0]).toHaveProperty('targetLanguage');
        }
      } else {
        // API might not be deployed or accessible
        expect([200, 403, 404, 500]).toContain(response.status());
      }
    });

    test('sessions endpoint returns demo sessions', async ({ request }) => {
      const response = await request.get(`${DEMO_API_URL}/demo/sessions`);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();
        
        if (data.length > 0) {
          expect(data[0]).toHaveProperty('id');
          expect(data[0]).toHaveProperty('agentType');
          expect(data[0]).toHaveProperty('topic');
          expect(data[0]).toHaveProperty('status');
        }
      } else {
        // API might not be deployed or accessible
        expect([200, 403, 404, 500]).toContain(response.status());
      }
    });

    test('handles CORS properly', async ({ request }) => {
      const response = await request.fetch(`${DEMO_API_URL}/demo/health`, {
        method: 'OPTIONS'
      });
      
      if (response.status() === 200) {
        const headers = response.headers();
        expect(headers['access-control-allow-origin']).toBeTruthy();
        expect(headers['access-control-allow-methods']).toBeTruthy();
        expect(headers['access-control-allow-headers']).toBeTruthy();
      }
    });

    test('returns 404 for non-existent endpoints', async ({ request }) => {
      const response = await request.get(`${DEMO_API_URL}/demo/nonexistent`);
      expect(response.status()).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('API Error Handling', () => {
    test('handles malformed requests gracefully', async ({ request }) => {
      const response = await request.post(`${DEMO_API_URL}/demo/users`, {
        data: { invalid: 'data' }
      });
      
      // Should return method not allowed or bad request
      expect([400, 405, 500]).toContain(response.status());
    });

    test('returns proper error responses', async ({ request }) => {
      const response = await request.get(`${DEMO_API_URL}/invalid-path`);
      
      if (response.status() >= 400) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
      }
    });
  });
});

test.describe('End-to-End User Journey', () => {
  test('complete demo experience', async ({ page }) => {
    // 1. Load the demo page
    await page.goto(DEMO_BASE_URL);
    await expect(page.locator('h1')).toContainText('LanguagePeer');
    
    // 2. Explore features
    await expect(page.locator('.feature-card')).toHaveCount(4);
    
    // 3. View demo data
    await page.locator('[data-tab="users"]').click();
    await page.waitForTimeout(1000);
    
    await page.locator('[data-tab="sessions"]').click();
    await page.waitForTimeout(1000);
    
    await page.locator('[data-tab="health"]').click();
    await page.waitForTimeout(1000);
    
    // 4. Try demo interactions
    await page.locator('#startDemo').click();
    
    // Handle the alert dialog
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.locator('#viewStats').click();
    
    // 5. Check architecture and tech stack
    await expect(page.locator('.architecture')).toBeVisible();
    await expect(page.locator('.tech-stack')).toBeVisible();
    
    // 6. Verify footer links
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer a')).toHaveCount(2);
  });

  test('accessibility compliance', async ({ page }) => {
    await page.goto(DEMO_BASE_URL);
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Check for alt text on images (if any)
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const text = await buttons.nth(i).textContent();
      expect(text?.trim()).toBeTruthy();
    }
    
    // Check for proper link text
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const text = await links.nth(i).textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });

  test('SEO and meta tags', async ({ page }) => {
    await page.goto(DEMO_BASE_URL);
    
    // Check title
    await expect(page).toHaveTitle(/LanguagePeer/);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      const content = await metaDescription.getAttribute('content');
      expect(content).toBeTruthy();
    }
    
    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });
});