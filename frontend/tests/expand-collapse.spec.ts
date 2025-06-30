import { test, expect } from '@playwright/test';

test.describe('Expand/Collapse Functionality', () => {
  const testUrl = '/projects/-second-git-claude-code-historian/conversations/19d4d480-bb3a-46b7-80ae-495cb4600a74';

  test.beforeEach(async ({ page }) => {
    // Navigate to the specific conversation
    await page.goto(testUrl);
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="conversation-view"]', { timeout: 10000 });
  });

  test('individual ToolsBubble expand buttons should only affect their own tools', async ({ page }) => {
    // Wait for ToolsBubbles to be present
    await page.waitForSelector('div:has-text("Tools Used")', { timeout: 5000 });
    
    // Click global "Expand All" button first
    await page.locator('button:has-text("Expand All")').first().click();
    
    // Wait for expansion to complete
    await page.waitForTimeout(500);
    
    // Find all ToolsBubbles
    const toolsBubbles = await page.locator('div:has-text("Tools Used")').all();
    
    // Verify we have at least 2 ToolsBubbles for the test
    expect(toolsBubbles.length).toBeGreaterThanOrEqual(2);
    
    // Get the first ToolsBubble's expand button
    const firstBubbleExpandButton = toolsBubbles[0].locator('button:has-text("Expand All")');
    
    // Get tool items in the first bubble before clicking
    const firstBubbleTools = await toolsBubbles[0].locator('[data-testid="tool-toggle-button"]').all();
    const firstBubbleToolsInitiallyExpanded = [];
    
    for (const tool of firstBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      firstBubbleToolsInitiallyExpanded.push(isExpanded);
    }
    
    // Get tool items in the second bubble before clicking
    const secondBubbleTools = await toolsBubbles[1].locator('[data-testid="tool-toggle-button"]').all();
    const secondBubbleToolsInitiallyExpanded = [];
    
    for (const tool of secondBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      secondBubbleToolsInitiallyExpanded.push(isExpanded);
    }
    
    // Click the first ToolsBubble's individual expand button
    await firstBubbleExpandButton.click();
    
    // Wait for state change
    await page.waitForTimeout(300);
    
    // Check that only the first bubble's tools changed state
    const firstBubbleToolsAfterClick = [];
    for (const tool of firstBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      firstBubbleToolsAfterClick.push(isExpanded);
    }
    
    // Check that the second bubble's tools remained unchanged
    const secondBubbleToolsAfterClick = [];
    for (const tool of secondBubbleTools) {
      const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
      secondBubbleToolsAfterClick.push(isExpanded);
    }
    
    // Verify that second bubble tools are unchanged
    expect(secondBubbleToolsAfterClick).toEqual(secondBubbleToolsInitiallyExpanded);
    
    // Verify that first bubble tools changed (this verifies the button worked)
    expect(firstBubbleToolsAfterClick).not.toEqual(firstBubbleToolsInitiallyExpanded);
  });

  test('global expand all should expand all ToolsBubbles', async ({ page }) => {
    // Wait for ToolsBubbles to be present
    await page.waitForSelector('div:has-text("Tools Used")', { timeout: 5000 });
    
    // Click global "Collapse All" first to ensure consistent state
    await page.locator('button:has-text("Collapse All")').first().click();
    await page.waitForTimeout(500);
    
    // Click global "Expand All" button
    await page.locator('button:has-text("Expand All")').first().click();
    await page.waitForTimeout(500);
    
    // Find all ToolsBubbles
    const toolsBubbles = await page.locator('div:has-text("Tools Used")').all();
    
    // Verify all tools in all bubbles are expanded
    for (const bubble of toolsBubbles) {
      const tools = await bubble.locator('[data-testid="tool-toggle-button"]').all();
      for (const tool of tools) {
        const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
        expect(isExpanded).toBe(true);
      }
    }
  });

  test('global collapse all should collapse all ToolsBubbles', async ({ page }) => {
    // Wait for ToolsBubbles to be present
    await page.waitForSelector('div:has-text("Tools Used")', { timeout: 5000 });
    
    // Click global "Expand All" first to ensure consistent state
    await page.locator('button:has-text("Expand All")').first().click();
    await page.waitForTimeout(500);
    
    // Click global "Collapse All" button
    await page.locator('button:has-text("Collapse All")').first().click();
    await page.waitForTimeout(500);
    
    // Find all ToolsBubbles
    const toolsBubbles = await page.locator('div:has-text("Tools Used")').all();
    
    // Verify all tools in all bubbles are collapsed
    for (const bubble of toolsBubbles) {
      const tools = await bubble.locator('[data-testid="tool-toggle-button"]').all();
      for (const tool of tools) {
        const isExpanded = await tool.locator('svg[data-testid="chevron-down"]').isVisible().catch(() => false);
        expect(isExpanded).toBe(false);
      }
    }
  });
});