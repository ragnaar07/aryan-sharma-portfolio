import { type ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import { encode } from 'next-auth/jwt';
import * as path from 'path';
import {
  type Browser,
  type BrowserContext,
  type Page,
  chromium,
} from 'playwright';

// Configuration
const PORT = process.env.PORT || '3000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const AUTH_SECRET =
  process.env.AUTH_SECRET || '12345678901234567890123456789012';
const ADMIN_GITHUB_ID = process.env.ADMIN_GITHUB_ID || '99999999';
const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'output');

interface VerificationResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: VerificationResult[] = [];

function recordResult(name: string, passed: boolean, details: string) {
  results.push({ name, passed, details });
  const icon = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} ${name} — ${details}`);
}

/**
 * Mint an encrypted Auth.js v5 session token for local testing.
 */
async function mintAdminSessionToken(): Promise<string> {
  return await encode({
    token: {
      githubId: ADMIN_GITHUB_ID,
      sub: ADMIN_GITHUB_ID,
      name: 'Admin Tester',
      email: 'admin@example.com',
    },
    secret: AUTH_SECRET,
    salt: 'authjs.session-token',
  });
}

/**
 * Check if the Next.js server is responding.
 */
async function isServerRunning(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

/**
 * Ensure Next.js server is available, launching dev server if necessary.
 */
async function ensureServer(): Promise<{
  proc: ChildProcess | null;
  url: string;
}> {
  if (await isServerRunning(BASE_URL)) {
    console.log(`📡 Detected running server at ${BASE_URL}`);
    return { proc: null, url: BASE_URL };
  }

  console.log(`🚀 Starting Next.js dev server on port ${PORT}...`);
  const proc = spawn('npx', ['next', 'dev', '--turbopack', '-p', PORT], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_OPTIONS: '--no-experimental-webstorage',
      PORT,
      AUTH_SECRET,
      ADMIN_GITHUB_ID,
      NODE_ENV: 'development',
    },
    stdio: 'pipe',
  });

  proc.stdout?.on('data', (d) => {
    const str = d.toString();
    if (
      str.includes('Ready in') ||
      str.includes('started server') ||
      str.includes('Local:')
    ) {
      process.stdout.write(`[next] ${str}`);
    }
  });

  proc.stderr?.on('data', (d) => {
    process.stderr.write(`[next-err] ${d.toString()}`);
  });

  // Poll server readiness
  const start = Date.now();
  const maxWaitMs = 60000;
  while (Date.now() - start < maxWaitMs) {
    if (await isServerRunning(BASE_URL)) {
      console.log(
        `✅ Server is ready at ${BASE_URL} (${Math.round((Date.now() - start) / 1000)}s)`,
      );
      return { proc, url: BASE_URL };
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  proc.kill('SIGTERM');
  throw new Error(`Timed out waiting for Next.js server at ${BASE_URL}`);
}

/**
 * Measure document horizontal overflow.
 */
async function verifyHorizontalOverflow(
  page: Page,
  label: string,
): Promise<boolean> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    innerWidth: window.innerWidth,
  }));

  // 1px tolerance for subpixel rounding
  const hasOverflow = metrics.scrollWidth > metrics.innerWidth + 1;
  const passed = !hasOverflow;
  recordResult(
    `No Horizontal Overflow (${label})`,
    passed,
    `scrollWidth: ${metrics.scrollWidth}px, innerWidth: ${metrics.innerWidth}px`,
  );
  return passed;
}

export async function runLayoutAndScrollVerification() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const { proc, url } = await ensureServer();
  const authToken = await mintAdminSessionToken();

  const browser: Browser = await chromium.launch({
    headless: true,
  });

  try {
    console.log('\n======================================================');
    console.log('  STARTING PLAYWRIGHT LAYOUT & SCROLL VERIFICATION');
    console.log('======================================================\n');

    // ----------------------------------------------------
    // TEST SUITE A: DESKTOP (1440px) - BLOG TOC & LONG POST
    // ----------------------------------------------------
    console.log('--- Testing Desktop Blog TOC (1440 x 900) ---');
    const desktopContext: BrowserContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    await desktopContext.addCookies([
      {
        name: 'authjs.session-token',
        value: authToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    const desktopPage = await desktopContext.newPage();
    const blogUrl = `${url}/blog/long-post-fixture`;
    console.log(`Navigating to ${blogUrl}...`);
    await desktopPage.goto(blogUrl, { waitUntil: 'networkidle' });

    // 1. Desktop TOC is visible
    const tocNav = desktopPage.locator(
      'aside nav[aria-label="Table of contents"]',
    );
    await tocNav.waitFor({ state: 'visible', timeout: 10000 });
    const isTocVisible = await tocNav.isVisible();
    recordResult(
      'Desktop TOC Visible',
      isTocVisible,
      'Found aside nav[aria-label="Table of contents"]',
    );

    // 2. Desktop TOC container scrollHeight > clientHeight
    const tocList = tocNav.locator('ul');
    const tocScrollMetrics = await tocList.evaluate((el: HTMLElement) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    const isTocScrollable =
      tocScrollMetrics.scrollHeight > tocScrollMetrics.clientHeight + 20;
    recordResult(
      'Desktop TOC scrollHeight > clientHeight',
      isTocScrollable,
      `scrollHeight: ${tocScrollMetrics.scrollHeight}px > clientHeight: ${tocScrollMetrics.clientHeight}px`,
    );

    // 3. Last link in TOC can be scrolled into view inside the TOC container
    const lastTocLink = tocList.locator('li a').last();
    await lastTocLink.scrollIntoViewIfNeeded();
    await desktopPage.waitForTimeout(300);

    const lastLinkBounds = await lastTocLink.evaluate((el: HTMLElement) => {
      const container = el.closest('ul');
      if (!container)
        return { visibleInContainer: false, reason: 'no container' };
      const elRect = el.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const visibleInContainer =
        elRect.top >= contRect.top - 8 && elRect.bottom <= contRect.bottom + 8;
      return {
        visibleInContainer,
        elTop: elRect.top,
        contTop: contRect.top,
        elBottom: elRect.bottom,
        contBottom: contRect.bottom,
      };
    });
    recordResult(
      'TOC Last Link Scrolled Into View',
      lastLinkBounds.visibleInContainer,
      `Last heading link bounded within TOC container (top: ${Math.round(lastLinkBounds.elTop ?? 0)}px >= ${Math.round(lastLinkBounds.contTop ?? 0)}px)`,
    );

    // 4. Desktop TOC stays within viewport bounds (bottom <= window.innerHeight)
    const tocCardBox = await tocNav.boundingBox();
    const windowInnerHeight = 900;
    const tocBottom = tocCardBox ? tocCardBox.y + tocCardBox.height : 9999;
    const isWithinViewport =
      tocCardBox !== null && tocBottom <= windowInnerHeight + 2;
    recordResult(
      'Desktop TOC Stays Within Viewport Bounds',
      isWithinViewport,
      `TOC bottom: ${Math.round(tocBottom)}px <= window height: ${windowInnerHeight}px (margin: ${Math.round(windowInnerHeight - tocBottom)}px)`,
    );

    // 5. Scrolling the article triggers active heading change and TOC auto-scrolls without changing page position
    console.log('Testing article scroll and TOC auto-scroll sync...');
    // Target Section 30
    const targetHeading = desktopPage.locator(
      '#section-30-distributed-query-planning-and-cost-based-optimizers',
    );
    await targetHeading.scrollIntoViewIfNeeded();
    await desktopPage.waitForTimeout(600); // Allow IntersectionObserver and smooth auto-scroll

    const activeItemState = await desktopPage.evaluate(() => {
      const activeLink = document.querySelector(
        'aside nav[aria-label="Table of contents"] ul li a.text-primary',
      );
      const tocUl = document.querySelector(
        'aside nav[aria-label="Table of contents"] ul',
      );
      return {
        hasActiveLink: Boolean(activeLink),
        activeText: activeLink?.textContent?.trim() || '',
        activeHref: activeLink?.getAttribute('href') || '',
        tocScrollTop: tocUl?.scrollTop || 0,
        pageScrollY: window.scrollY,
      };
    });

    const isAutoScrolled =
      activeItemState.hasActiveLink && activeItemState.tocScrollTop > 0;
    recordResult(
      'Article Scroll Updates Active Heading & TOC Auto-Scrolls',
      isAutoScrolled,
      `Active: "${activeItemState.activeText}", TOC scrollTop: ${Math.round(activeItemState.tocScrollTop)}px, pageScrollY: ${Math.round(activeItemState.pageScrollY)}px`,
    );

    // 6. Check desktop horizontal overflow
    await verifyHorizontalOverflow(desktopPage, 'Desktop Blog 1440px');

    // Screenshot Desktop TOC
    const desktopScreenshotPath = path.join(
      OUTPUT_DIR,
      'desktop-toc-1440px.png',
    );
    await desktopPage.screenshot({
      path: desktopScreenshotPath,
      fullPage: false,
    });
    console.log(`📸 Desktop Screenshot saved: ${desktopScreenshotPath}`);

    // ----------------------------------------------------
    // TEST SUITE B: MOBILE (390px) - BLOG COLLAPSIBLE TOC
    // ----------------------------------------------------
    console.log('\n--- Testing Mobile Blog TOC (390 x 844) ---');
    const mobileContext: BrowserContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(blogUrl, { waitUntil: 'networkidle' });

    // 1. Mobile collapsible TOC exists and has max-h-64 / overflow-y-auto
    const mobileCollapsibleTrigger = mobilePage.locator(
      'button:has-text("Table of Contents")',
    );
    await mobileCollapsibleTrigger.waitFor({ state: 'visible', timeout: 5000 });
    await mobileCollapsibleTrigger.click();
    await mobilePage.waitForTimeout(300);

    const mobileTocList = mobilePage.locator('ul.max-h-64.overflow-y-auto');
    const isMobileListConfigured = (await mobileTocList.count()) > 0;
    recordResult(
      'Mobile Collapsible TOC has max-h-64 & overflow-y-auto',
      isMobileListConfigured,
      'Verified presence of ul.max-h-64.overflow-y-auto in mobile view',
    );

    // 2. Mobile horizontal overflow
    await verifyHorizontalOverflow(mobilePage, 'Mobile Blog 390px');

    // Screenshot Mobile TOC
    const mobileScreenshotPath = path.join(OUTPUT_DIR, 'mobile-toc-390px.png');
    await mobilePage.screenshot({
      path: mobileScreenshotPath,
      fullPage: false,
    });
    console.log(`📸 Mobile Screenshot saved: ${mobileScreenshotPath}`);

    // ----------------------------------------------------
    // TEST SUITE C: DESKTOP (1440px) - ADMIN POST EDITOR
    // ----------------------------------------------------
    console.log('\n--- Testing Admin Post Editor (1440 x 900) ---');
    const adminUrl = `${url}/admin/posts/new`;
    await desktopPage.goto(adminUrl, { waitUntil: 'networkidle' });

    // Verify authenticated access to /admin/posts/new
    const contentTextarea = desktopPage.locator('textarea#content');
    await contentTextarea.waitFor({ state: 'visible', timeout: 10000 });
    recordResult(
      'Admin Editor Loaded (Authenticated)',
      true,
      'Successfully accessed /admin/posts/new with session token',
    );

    // Populate textarea with 120 lines
    const testContent = Array.from(
      { length: 120 },
      (_, i) =>
        `## Section ${i + 1}: Architecture Topic\n\nDetailed content for testing pane scrolling and synchronization mechanisms across editor and preview blocks. Paragraph ${i + 1}.`,
    ).join('\n\n');
    await contentTextarea.fill(testContent);
    await desktopPage.waitForTimeout(500); // Wait for preview re-render

    // Verification C1: Scrolling textarea does NOT change window.scrollY
    const initialWindowScrollY = await desktopPage.evaluate(
      () => window.scrollY,
    );
    await contentTextarea.evaluate((el: HTMLTextAreaElement) => {
      el.scrollTop = 600;
    });
    await desktopPage.waitForTimeout(200);
    const postTextareaWindowScrollY = await desktopPage.evaluate(
      () => window.scrollY,
    );
    const textareaWindowDelta = Math.abs(
      postTextareaWindowScrollY - initialWindowScrollY,
    );
    recordResult(
      'Textarea Scroll Does NOT Change window.scrollY',
      textareaWindowDelta === 0,
      `initial window.scrollY: ${initialWindowScrollY}px, after scroll: ${postTextareaWindowScrollY}px (delta: ${textareaWindowDelta}px)`,
    );

    // Find the preview scrollable container
    const previewContainer = desktopPage
      .locator('div[data-lenis-prevent].overflow-y-auto')
      .last();
    await previewContainer.waitFor({ state: 'visible', timeout: 5000 });

    // Verification C2: Scrolling preview does NOT change textarea scrollTop (Sync scroll off by default)
    const initialTextareaScrollTop = await contentTextarea.evaluate(
      (el: HTMLTextAreaElement) => el.scrollTop,
    );
    await previewContainer.evaluate((el: HTMLElement) => {
      el.scrollTop = 600;
    });
    await desktopPage.waitForTimeout(200);
    const postPreviewTextareaScrollTop = await contentTextarea.evaluate(
      (el: HTMLTextAreaElement) => el.scrollTop,
    );
    const previewTextareaDelta = Math.abs(
      postPreviewTextareaScrollTop - initialTextareaScrollTop,
    );
    recordResult(
      'Preview Scroll Does NOT Change Textarea scrollTop',
      previewTextareaDelta === 0,
      `initial textarea.scrollTop: ${initialTextareaScrollTop}px, after preview scroll: ${postPreviewTextareaScrollTop}px (delta: ${previewTextareaDelta}px)`,
    );

    // Verification C3: Toggling "Sync scroll" enables proportional scroll sync
    const syncScrollSwitch = desktopPage.locator('#sync-scroll-preview');
    await syncScrollSwitch.waitFor({ state: 'visible', timeout: 5000 });
    await syncScrollSwitch.click();
    await desktopPage.waitForTimeout(200);

    // Reset preview scroll top
    await previewContainer.evaluate((el: HTMLElement) => {
      el.scrollTop = 0;
    });

    // Now scroll textarea to 800px and verify preview syncs
    await contentTextarea.evaluate((el: HTMLTextAreaElement) => {
      el.scrollTop = 800;
      el.dispatchEvent(new Event('scroll'));
    });
    await desktopPage.waitForTimeout(400); // Allow rAF scroll sync

    const postSyncPreviewTop = await previewContainer.evaluate(
      (el: HTMLElement) => el.scrollTop,
    );
    recordResult(
      'Sync Scroll Toggle Enables Proportional Preview Sync',
      postSyncPreviewTop > 0,
      `Textarea scrolled to 800px -> Preview synchronized to ${Math.round(postSyncPreviewTop)}px`,
    );

    // Verification C4: Persistent save button remains visible in viewport
    const saveButton = desktopPage.locator(
      'button[type="submit"]:has-text("Save Article")',
    );
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });

    // Scroll main page down to verify sticky header keeps save button visible
    await desktopPage.evaluate(() => window.scrollTo(0, 450));
    await desktopPage.waitForTimeout(200);

    const saveButtonBounds = await saveButton.boundingBox();
    const isSaveButtonVisibleInViewport =
      saveButtonBounds !== null &&
      saveButtonBounds.y >= 0 &&
      saveButtonBounds.y + saveButtonBounds.height <= windowInnerHeight;
    recordResult(
      'Persistent Save Button Remains Visible In Viewport',
      isSaveButtonVisibleInViewport,
      `Save button y: ${Math.round(saveButtonBounds?.y || 0)}px, height: ${Math.round(saveButtonBounds?.height || 0)}px within [0, ${windowInnerHeight}px]`,
    );

    // Verification C5: Admin editor horizontal overflow
    await verifyHorizontalOverflow(desktopPage, 'Admin Editor 1440px');

    // Screenshot Admin Editor
    const adminScreenshotPath = path.join(
      OUTPUT_DIR,
      'admin-editor-1440px.png',
    );
    await desktopPage.screenshot({
      path: adminScreenshotPath,
      fullPage: false,
    });
    console.log(`📸 Admin Screenshot saved: ${adminScreenshotPath}`);

    // Clean up browser contexts
    await desktopContext.close();
    await mobileContext.close();

    // ----------------------------------------------------
    // SUMMARY REPORT
    // ----------------------------------------------------
    console.log('\n======================================================');
    console.log('           VERIFICATION SUMMARY REPORT');
    console.log('======================================================');
    const total = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = total - passedCount;

    console.log(
      `Total checks: ${total} | Passed: ${passedCount} | Failed: ${failedCount}\n`,
    );

    console.log('Generated Artifacts:');
    console.log(`- Desktop TOC Screenshot: ${desktopScreenshotPath}`);
    console.log(`- Mobile TOC Screenshot:  ${mobileScreenshotPath}`);
    console.log(`- Admin Editor Screenshot: ${adminScreenshotPath}\n`);

    if (failedCount > 0) {
      console.error(
        `❌ Verification suite failed with ${failedCount} failing assertion(s)!`,
      );
      process.exitCode = 1;
    } else {
      console.log('🎉 ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
    }
  } finally {
    await browser.close();
    if (proc) {
      console.log('🛑 Shutting down spawned Next.js server...');
      proc.kill('SIGTERM');
    }
  }
}

if (require.main === module || process.argv[1] === import.meta.filename) {
  runLayoutAndScrollVerification().catch((err) => {
    console.error('Fatal error in layout verification:', err);
    process.exit(1);
  });
}
