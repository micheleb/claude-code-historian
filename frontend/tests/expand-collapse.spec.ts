import { test, expect } from '@playwright/test';

test.describe('Expand/Collapse Functionality', () => {
  const testUrl = '/projects/-test-project/conversations/12345678-1234-1234-1234-123456789abc';

  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/projects', async route => {
      await route.fulfill({
        json: [
          {
            id: 'test-project-id',
            path: '-test-project',
            name: 'Test Project',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            conversation_count: 1
          }
        ]
      });
    });

    await page.route('**/api/projects/by-path*', async route => {
      await route.fulfill({
        json: {
          id: 'test-project-id',
          path: '-test-project',
          name: 'Test Project',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          conversation_count: 1
        }
      });
    });

    await page.route('**/api/projects/test-project-id/conversations', async route => {
      await route.fulfill({
        json: [
          {
            id: '12345678-1234-1234-1234-123456789abc',
            session_id: '12345678-1234-1234-1234-123456789abc',
            project_id: 'test-project-id',
            started_at: '2024-01-01T00:00:00Z',
            ended_at: '2024-01-01T01:00:00Z',
            summary: 'Test conversation summary',
            message_count: 4
          }
        ]
      });
    });

    await page.route('**/api/conversations/by-session/12345678-1234-1234-1234-123456789abc', async route => {
      await route.fulfill({
        json: {
          id: '12345678-1234-1234-1234-123456789abc',
          session_id: '12345678-1234-1234-1234-123456789abc',
          project_id: 'test-project-id',
          project_name: 'Test Project',
          project_path: '-test-project',
          started_at: '2024-01-01T00:00:00Z',
          ended_at: '2024-01-01T01:00:00Z',
          summary: 'Test conversation summary',
          messages: [
            {
              id: 'msg1',
              uuid: 'msg1-uuid',
              conversation_id: '12345678-1234-1234-1234-123456789abc',
              parent_uuid: null,
              type: 'user',
              role: 'user',
              content: 'Test user message',
              model: null,
              timestamp: '2024-01-01T00:00:00Z',
              is_sidechain: false,
              is_meta: false,
              tool_uses: []
            },
            {
              id: 'msg2',
              uuid: 'msg2-uuid',
              conversation_id: '12345678-1234-1234-1234-123456789abc',
              parent_uuid: null,
              type: 'assistant',
              role: 'assistant',
              content: 'I\'ll help you with that.',
              model: 'claude-3',
              timestamp: '2024-01-01T00:01:00Z',
              is_sidechain: false,
              is_meta: false,
              tool_uses: [
                {
                  id: 'tool1',
                  tool_id: 'tool1',
                  tool_name: 'TestTarget1Tool1',
                  input: '{"file_path": "/test/file1.txt"}',
                  result: 'File content 1'
                },
                {
                  id: 'tool2',
                  tool_id: 'tool2',
                  tool_name: 'TestTarget1Tool2',
                  input: '{"file_path": "/test/file2.txt", "content": "New content"}',
                  result: 'File written successfully'
                },
                {
                  id: 'tool3',
                  tool_id: 'tool3',
                  tool_name: 'TestTarget1Tool3',
                  input: '{"command": "ls -la"}',
                  result: 'total 16\ndrwxr-xr-x 2 user user 4096 Jan  1 00:00 .\ndrwxr-xr-x 3 user user 4096 Jan  1 00:00 ..'
                }
              ]
            },
            {
              id: 'msg3',
              uuid: 'msg3-uuid',
              conversation_id: '12345678-1234-1234-1234-123456789abc',
              parent_uuid: null,
              type: 'user',
              role: 'user',
              content: 'Great, can you also check the logs?',
              model: null,
              timestamp: '2024-01-01T00:02:00Z',
              is_sidechain: false,
              is_meta: false,
              tool_uses: []
            },
            {
              id: 'msg4',
              uuid: 'msg4-uuid',
              conversation_id: '12345678-1234-1234-1234-123456789abc',
              parent_uuid: null,
              type: 'assistant',
              role: 'assistant',
              content: 'I\'ll check the logs for you.',
              model: 'claude-3',
              timestamp: '2024-01-01T00:03:00Z',
              is_sidechain: false,
              is_meta: false,
              tool_uses: [
                {
                  id: 'tool4',
                  tool_id: 'tool4',
                  tool_name: 'TestTarget2Tool1',
                  input: '{"file_path": "/var/log/app.log"}',
                  result: '2024-01-01 00:00:00 INFO Application started\n2024-01-01 00:01:00 INFO Processing request'
                },
                {
                  id: 'tool5',
                  tool_id: 'tool5',
                  tool_name: 'TestTarget2Tool2',
                  input: '{"pattern": "ERROR", "path": "/var/log/"}',
                  result: 'No errors found'
                }
              ]
            }
          ]
        }
      });
    });

    // Navigate to the test conversation
    await page.goto(testUrl, { waitUntil: 'networkidle' });
    
    // Wait for React app to load
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Debug: log the page HTML to see what's rendering
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    
    // Wait for the page to load
    try {
      await page.waitForSelector('[data-testid="conversation-view"]', { timeout: 10000 });
    } catch (error) {
      // Debug: take a screenshot if element not found
      await page.screenshot({ path: 'debug-screenshot.png' });
      console.log('Page HTML:', await page.locator('body').innerHTML());
      throw error;
    }
  });

  test('individual ToolsBubble expand buttons should only affect their own tools', async ({ page }) => {
    await page.waitForSelector('div:has-text("Tools Used")', { timeout: 5000 });
    await expect(page.getByText('Conversations', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test conversation summary', { exact: true })).toHaveCount(2)
    
    // Fragile, but works
    const firstBubble = page.getByText("TestTarget1Tool1").locator('..').locator('..').locator('..').locator('..');
    const secondBubble = page.getByText("TestTarget2Tool1").locator('..').locator('..').locator('..').locator('..');

    await expect(firstBubble.locator('div:has-text("Tools Used")').first()).toBeVisible();
    await expect(secondBubble.locator('div:has-text("Tools Used")').first()).toBeVisible();
    
    // Get the first ToolsBubble's expand button (specific to TestTarget1 bubble)
    const firstBubbleExpandButton = firstBubble.locator('button:has-text("Expand All")').last();
    
    // Get tool items in the first bubble before clicking (TestTarget1 bubble)
    const firstBubbleTools = await firstBubble.locator('[data-testid="tool-toggle-button"]').all();
    const firstBubbleToolsInitiallyExpanded = [];
    
    for (const tool of firstBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      firstBubbleToolsInitiallyExpanded.push(isExpanded);
    }
    
    // Get tool items in the second bubble before clicking (TestTarget2 bubble)
    const secondBubbleTools = await secondBubble.locator('[data-testid="tool-toggle-button"]').all();
    const secondBubbleToolsInitiallyExpanded = [];
    
    for (const tool of secondBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      secondBubbleToolsInitiallyExpanded.push(isExpanded);
    }
    
    // Click the first ToolsBubble's individual expand button
    await firstBubbleExpandButton.click();
    
    await page.waitForTimeout(1000);
    
    // Re-fetch tools to ensure we have current state after the action
    const firstBubbleToolsAfter = await firstBubble.locator('[data-testid="tool-toggle-button"]').all();
    const secondBubbleToolsAfter = await secondBubble.locator('[data-testid="tool-toggle-button"]').all();
    
    // Check that only the first bubble's tools changed state
    const firstBubbleToolsAfterClick = [];
    for (const tool of firstBubbleToolsAfter) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      firstBubbleToolsAfterClick.push(isExpanded);
    }
    
    // Check that the second bubble's tools remained unchanged
    const secondBubbleToolsAfterClick = [];
    for (const tool of secondBubbleToolsAfter) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      secondBubbleToolsAfterClick.push(isExpanded);
    }
    
    // Verify that TestTarget2 bubble tools are unchanged
    expect(secondBubbleToolsAfterClick).toEqual(secondBubbleToolsInitiallyExpanded);
    
    // Verify that TestTarget1 bubble tools changed (this verifies the button worked)
    expect(firstBubbleToolsAfterClick).not.toEqual(firstBubbleToolsInitiallyExpanded);
  });

  test('global expand all should expand all ToolsBubbles', async ({ page }) => {
    await page.waitForSelector('div:has-text("Tools Used")', { timeout: 5000 });
    
    const firstBubble = page.getByText("TestTarget1Tool1").locator('..').locator('..').locator('..').locator('..');
    const secondBubble = page.getByText("TestTarget2Tool1").locator('..').locator('..').locator('..').locator('..');
    
    // Click global "Collapse All" first to ensure consistent state
    await page.locator('button:has-text("Collapse All")').first().click();
    await page.waitForTimeout(500);
    
    // Click global "Expand All" button
    await page.locator('button:has-text("Expand All")').first().click();
    await page.waitForTimeout(500);
    
    // Verify all tools in first bubble (TestTarget1) are expanded
    const firstBubbleTools = await firstBubble.locator('[data-testid="tool-toggle-button"]').all();
    for (const tool of firstBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      expect(isExpanded).toBe(true);
    }
    
    // Verify all tools in second bubble (TestTarget2) are expanded
    const secondBubbleTools = await secondBubble.locator('[data-testid="tool-toggle-button"]').all();
    for (const tool of secondBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      expect(isExpanded).toBe(true);
    }
  });

  test('global collapse all should collapse all ToolsBubbles', async ({ page }) => {
    await page.waitForSelector('div:has-text("Tools Used")', { timeout: 5000 });
    
    const firstBubble = page.getByText("TestTarget1Tool1").locator('..').locator('..').locator('..').locator('..');
    const secondBubble = page.getByText("TestTarget2Tool1").locator('..').locator('..').locator('..').locator('..');
    
    // Click global "Expand All" first to ensure consistent state
    await page.locator('button:has-text("Expand All")').first().click();
    await page.waitForTimeout(500);
    
    // Click global "Collapse All" button
    await page.locator('button:has-text("Collapse All")').first().click();
    await page.waitForTimeout(500);
    
    // Verify all tools in first bubble (TestTarget1) are collapsed
    const firstBubbleTools = await firstBubble.locator('[data-testid="tool-toggle-button"]').all();
    for (const tool of firstBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      expect(isExpanded).toBe(false);
    }
    
    // Verify all tools in second bubble (TestTarget2) are collapsed
    const secondBubbleTools = await secondBubble.locator('[data-testid="tool-toggle-button"]').all();
    for (const tool of secondBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      expect(isExpanded).toBe(false);
    }
  });
});