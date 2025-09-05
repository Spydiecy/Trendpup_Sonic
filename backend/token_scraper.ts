const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const net = require('net');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');
import { Page } from 'playwright';

dotenv.config({ path: path.resolve(__dirname, '/home/trendpup/trendpup/.env') });

chromium.use(StealthPlugin());

const TOR_CONTROL_PORT = 9051;
const TOR_CONTROL_PASSWORD = process.env.TOR_PASSWORD;

declare global {
  interface Window {
    chrome: any;
  }
  interface Navigator {
    webdriver: any;
    __webdriver_script_fn: any;
    __webdriver_script_func: any;
    __webdriver_script_function: any;
    __fxdriver_evaluate: any;
    __fxdriver_unwrapped: any;
    __driver_unwrapped: any;
    __webdriver_unwrapped: any;
    __driver_evaluate: any;
    __webdriver_evaluate: any;
    __selenium_evaluate: any;
  }
}

async function sendTorNewnym(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('Tor control connection timeout'));
    }, 5000);
    
    const socket = net.connect(TOR_CONTROL_PORT, '127.0.0.1', () => {
      clearTimeout(timeout);
      socket.write(`AUTHENTICATE \"${TOR_CONTROL_PASSWORD}\"\r\n`);
    });
    
    let authenticated = false;
    
    socket.on('data', (data: Buffer) => {
      const msg = data.toString();
      
      if (!authenticated && msg.indexOf('250 OK') !== -1) {
        authenticated = true;
        socket.write('SIGNAL NEWNYM\r\n');
      } else if (authenticated && msg.indexOf('250 OK') !== -1) {
        socket.end();
        clearTimeout(timeout);
        resolve();
      } else if (msg.indexOf('515') !== -1) {
        socket.end();
        clearTimeout(timeout);
        reject(new Error('Tor authentication failed - invalid password'));
      } else if (msg.indexOf('551') !== -1) {
        socket.end();
        clearTimeout(timeout);
        reject(new Error('Tor NEWNYM command failed - too soon (will retry later)'));
      }
    });
    
    socket.on('end', () => {
      clearTimeout(timeout);
      resolve();
    });
    
    socket.on('error', (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

const userAgentStrings = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
];

let consecutiveFailures = 0;
let lastUserAgentIndex = -1;
let totalAttempts = 0;
let lastSuccessfulScrape = Date.now();

interface BlockingStatus {
  isBlocked: boolean;
  title: string;
  hasTable: boolean;
  bodyText: string;
}

async function detectBlocking(page: Page): Promise<BlockingStatus> {
  const blockingSignals = await page.evaluate(() => {
    const indicators = [
      document.querySelector('[data-ray]'),
      document.querySelector('.cf-browser-verification'),
      document.querySelector('#cf-challenge-stage'),
      document.title.includes('Just a moment'),
      document.title.includes('Access denied'),
      document.body.innerText.includes('Cloudflare'),
      document.body.innerText.includes('DDoS protection'),
      document.querySelector('.challenge-form'),
      document.body.innerText.includes('Checking your browser'),
      document.querySelector('.cf-checking-browser'),
      document.body.innerText.includes('Ray ID'),
      document.querySelector('#challenge-form')
    ];
    
    return {
      isBlocked: indicators.some(indicator => indicator !== null && indicator !== false),
      title: document.title,
      hasTable: !!document.querySelector('.ds-dex-table-row-base-token-name'),
      bodyText: document.body.innerText.substring(0, 200)
    };
  });
  
  return blockingSignals;
}

async function injectAdvancedStealthScripts(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      delete (window.navigator as any).webdriver;
    } catch (e) {}
    try {
      delete (window.navigator as any).__webdriver_script_fn;
    } catch (e) {}
    try {
      delete (window.navigator as any).__webdriver_script_func;
    } catch (e) {}
    try {
      delete (window.navigator as any).__webdriver_script_function;
    } catch (e) {}
    try {
      delete (window.navigator as any).__fxdriver_evaluate;
    } catch (e) {}
    try {
      delete (window.navigator as any).__fxdriver_unwrapped;
    } catch (e) {}
    try {
      delete (window.navigator as any).__driver_unwrapped;
    } catch (e) {}
    try {
      delete (window.navigator as any).__webdriver_unwrapped;
    } catch (e) {}
    try {
      delete (window.navigator as any).__driver_evaluate;
    } catch (e) {}
    try {
      delete (window.navigator as any).__webdriver_evaluate;
    } catch (e) {}
    try {
      delete (window.navigator as any).__selenium_evaluate;
    } catch (e) {}
    
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
      configurable: true
    });
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
      configurable: true
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en', 'fr'],
      configurable: true
    });
    
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter: number) {
      if (parameter === 37445) {
        const vendors = ['Intel Inc.', 'Intel Corporation', 'NVIDIA Corporation'];
        return vendors[Math.floor(Math.random() * vendors.length)];
      }
      if (parameter === 37446) {
        const renderers = ['Intel(R) Iris(TM) Graphics 6100', 'Intel(R) UHD Graphics 620', 'NVIDIA GeForce GTX 1050'];
        return renderers[Math.floor(Math.random() * renderers.length)];
      }
      return getParameter.call(this, parameter);
    };
    
    const originalHeight = screen.availHeight;
    const originalWidth = screen.availWidth;
    Object.defineProperty(screen, 'availHeight', {
      get: () => originalHeight + Math.floor(Math.random() * 20 - 10),
      configurable: true
    });
    Object.defineProperty(screen, 'availWidth', {
      get: () => originalWidth + Math.floor(Math.random() * 20 - 10),
      configurable: true
    });
    
    const originalConsoleDebug = console.debug;
    console.debug = function(...args: any[]) {
      return;
    };
    if (!(window as any).chrome) {
      (window as any).chrome = {};
    }
    if (!(window as any).chrome.runtime) {
      (window as any).chrome.runtime = {
        onConnect: {
          addListener: () => {},
          removeListener: () => {}
        },
        onMessage: {
          addListener: () => {},
          removeListener: () => {}
        }
      };
    }
    
    if (navigator.permissions && navigator.permissions.query) {
      const originalQuery = navigator.permissions.query;
      navigator.permissions.query = function(parameters: any) {
        return originalQuery.call(this, parameters).then((result: any) => {
          if (parameters.name === 'notifications') {
            return {
              ...result,
              state: 'denied'
            };
          }
          return result;
        });
      };
    }
    
    const getImageData = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function(...args: [number, number, number, number, ImageDataSettings?]) {
        const imageData = getImageData.apply(this, args);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] += Math.floor(Math.random() * 10) - 5;
        imageData.data[i + 1] += Math.floor(Math.random() * 10) - 5;
        imageData.data[i + 2] += Math.floor(Math.random() * 10) - 5;
      }
      return imageData;
    };
  });
}

async function simulateAdvancedHumanBehavior(page: Page): Promise<void> {
  try {
    await page.waitForTimeout(1000 + Math.random() * 3000);
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
      const startX = Math.random() * 1280;
      const startY = Math.random() * 720;
      const endX = Math.random() * 1280;
      const endY = Math.random() * 720;
      
      const steps = 10 + Math.floor(Math.random() * 20);
      for (let step = 0; step < steps; step++) {
        const progress = step / steps;
        const x = startX + (endX - startX) * progress + (Math.random() - 0.5) * 50;
        const y = startY + (endY - startY) * progress + (Math.random() - 0.5) * 50;
        await page.mouse.move(x, y);
        await page.waitForTimeout(20 + Math.random() * 50);
      }
    }
    
    const scrollSteps = 5 + Math.floor(Math.random() * 10);
    for (let i = 0; i < scrollSteps; i++) {
      await page.evaluate((offset) => {
        window.scrollBy(0, offset);
      }, 100 + Math.random() * 200);
      await page.waitForTimeout(300 + Math.random() * 700);
    }
    
    if (Math.random() > 0.7) {
      try {
        await page.click('body', { 
          position: { 
            x: Math.random() * 1280, 
            y: Math.random() * 720 
          },
          timeout: 1000
        });
      } catch (clickErr) {
      }
      await page.waitForTimeout(500 + Math.random() * 1000);
    }
    
    if (Math.random() > 0.8) {
      try {
        const elements = await page.$$('div, span, p');
        if (elements.length > 0) {
          const randomElement = elements[Math.floor(Math.random() * elements.length)];
          await randomElement.hover();
          await page.waitForTimeout(500 + Math.random() * 1000);
        }
      } catch (hoverErr) {
      }
    }
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000 + Math.random() * 2000);
    
  } catch (err: unknown) {
  }
}

interface TokenData {
  name: string;
  symbol: string;
  symbol1: string;
  price: string;
  volume: string;
  liquidity: string;
  mcap: string;
  transactions: string;
  age: string;
  'change-5m': string;
  'change-1h': string;
  'change-6h': string;
  'change-24h': string;
  href: string | null;
  imageUrl?: string | null;
  chain: string;
}

async function scrapePage(pageNum: number, userAgent: string, chain: string, attempt?: number): Promise<TokenData[]> {
  let browser, context, page;
  try {
    browser = await chromium.launch({
      headless: true,
      proxy: { server: 'socks5://127.0.0.1:9050' },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        `--window-size=${1280 + Math.floor(Math.random() * 200)},${720 + Math.floor(Math.random() * 200)}`,
        '--disable-blink-features=AutomationControlled',
        '--exclude-switches=enable-automation',
        '--disable-extensions-file-access-check',
        '--disable-plugins-discovery',
        '--disable-default-apps',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-ipc-flooding-protection',
        '--enable-features=NetworkService,NetworkServiceLogging',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--use-mock-keychain',
        '--disable-web-security',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-client-side-phishing-detection'
      ]
    });

    context = await browser.newContext({
      viewport: { 
        width: 1280 + Math.floor(Math.random() * 200), 
        height: 720 + Math.floor(Math.random() * 200) 
      },
      userAgent,
      ignoreHTTPSErrors: true,
      deviceScaleFactor: 1 + (Math.random() - 0.5) * 0.2,
      permissions: ['geolocation'],
      geolocation: { 
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1, 
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1 
      },
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'X-Forwarded-For': `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      }
    });
    
    page = await context.newPage();
    await injectAdvancedStealthScripts(page);

    const url = `https://dexscreener.com/${chain}/page-${pageNum}?order=asc&rankBy=pairAge`;
    console.log(`Navigating to ${chain.toUpperCase()} page ${pageNum}...`);
    
    try {
      await page.goto(url, { timeout: 30000, waitUntil: 'networkidle' });
    } catch (err: unknown) {
      try {
        await page.goto(url, { timeout: 45000, waitUntil: 'domcontentloaded' });
      } catch (secondErr: unknown) {
        await page.goto(url, { timeout: 60000, waitUntil: 'load' });
      }
    }

    await page.waitForTimeout(8000);
    const pageLoadState = await page.evaluate(() => document.readyState);
    if (pageLoadState !== 'complete') {
      await page.waitForTimeout(5000);
    }

    const blockingStatus = await detectBlocking(page);

    if (blockingStatus.isBlocked) {
      try {
        const debugDir = path.join(__dirname, 'debug_screenshots');
        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
        const screenshotPath = path.join(debugDir, `blocked_${chain}_page${pageNum}_attempt${attempt || 1}_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      } catch (ssErr) { }
      throw new Error('Access denied or Cloudflare challenge detected');
    }

    await simulateAdvancedHumanBehavior(page);
    try {
      await page.waitForSelector('.ds-dex-table-row-base-token-name', { timeout: 15000 });
    } catch (selectorErr) {
      try {
        await page.waitForSelector('[class*="table-row"]', { timeout: 10000 });
      } catch (altSelectorErr) {
        await page.waitForTimeout(5000);
      }
    }
    
    
    const names = await page.locator('.ds-dex-table-row-base-token-name').allTextContents();
    const symbol = await page.locator('.ds-dex-table-row-base-token-symbol').allTextContents();
    const symbol1 = await page.locator('.ds-dex-table-row-quote-token-symbol').allTextContents();
    const priceHandles = await page.locator('.ds-dex-table-row-col-price').elementHandles();
    const prices: string[] = [];
    for (const handle of priceHandles) {
      const text = await handle.evaluate((el: Element) => el.textContent || '');
      prices.push(text.replace(/\s+/g, '').trim());
    }
    const volume = await page.locator('.ds-dex-table-row-col-volume').allTextContents();
    const mcap = await page.locator('.ds-dex-table-row-col-market-cap').allTextContents();
    const liquidity = await page.locator('.ds-dex-table-row-col-liquidity').allTextContents();
    const txns = await page.locator('.ds-dex-table-row-col-txns').allTextContents();
    const age = await page.locator('.ds-dex-table-row-col-pair-age').allTextContents();
    const fivem = await page.locator('.ds-dex-table-row-col-price-change-m5').allTextContents();
    const oneh = await page.locator('.ds-dex-table-row-col-price-change-h1').allTextContents();
    const sixh = await page.locator('.ds-dex-table-row-col-price-change-h6').allTextContents();
    const oned = await page.locator('.ds-dex-table-row-col-price-change-h24').allTextContents();
    const hrefs = await page.$$eval('a.ds-dex-table-row.ds-dex-table-row-new', (rows: Element[]) => rows.map((row: Element) => (row as HTMLAnchorElement).getAttribute('href')));
    const imageUrls = await page.$$eval('.ds-dex-table-row-token-icon-img', (imgs: Element[]) => 
      imgs.map((img: Element) => (img as HTMLImageElement).src || null)
    );

    const tokens: TokenData[] = names.map((name: string, i: number) => ({
      name: name,
      symbol: symbol[i],
      symbol1: symbol1[i],
      price: prices[i],
      volume: volume[i],
      liquidity: liquidity[i],
      mcap: mcap[i],
      transactions: txns[i],
      age: age[i],
      'change-5m': fivem[i],
      'change-1h': oneh[i],
      'change-6h': sixh[i],
      'change-24h': oned[i],
      href: hrefs[i] ? `https://dexscreener.com${hrefs[i]}` : null,
      imageUrl: imageUrls[i] || null,
      chain: chain
    }));

    return tokens;
    
  } catch (err: unknown) {
    const error = err as Error;
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('net::ERR_PROXY_CONNECTION_FAILED')) {
      console.error('Tor proxy connection failed');
    } else if (errorMessage.includes('TimeoutError')) {
      console.error('Page load timeout');
    } else if (errorMessage.includes('Access denied') || errorMessage.includes('Cloudflare')) {
      console.error('Cloudflare blocking detected');
    } else if (errorMessage.includes('waiting for selector')) {
      console.error('Page structure changed or content not loaded');
    } else {
      console.error('Unexpected error:', errorMessage);
    }
    
    console.error(`Error scraping ${chain.toUpperCase()} page ${pageNum}:`, error);
    return [];
  } finally {
        try {
          if (page && !page.isClosed()) await page.close();
        } catch (e) { /* ignore */ }

        try {
          if (context) await context.close();
        } catch (e) { /* ignore */ }

        try {
          if (browser && browser.isConnected()) await browser.close();
        } catch (e) { /* ignore */ }
  }
}

async function scrapePageWithRetry(pageNum: number, userAgent: string, chain: string, maxRetries: number = 3): Promise<TokenData[]> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    
    const tokens = await scrapePage(pageNum, userAgent, chain, attempt);
    
    if (tokens.length > 0) {
      return tokens;
    }
    
    
    const waitTime = Math.pow(2, attempt) * 1000;
    await new Promise(res => setTimeout(res, waitTime));
    
    try {
      await sendTorNewnym();
      await new Promise(res => setTimeout(res, 5000));
    } catch (torErr: unknown) {
      const error = torErr as Error;
      console.error('Failed to rotate Tor IP:', error.message);
    }
  }
  
  console.error(`${chain.toUpperCase()} page ${pageNum} failed after ${maxRetries} attempts`);
  return [];
}

async function scraper() {
  if (isBrowserActive) {
    return false;
  }
  isBrowserActive = true;
  totalAttempts++;
  const attemptStartTime = Date.now();
  
  try {
    if (Date.now() - lastSuccessfulScrape > 30 * 60 * 1000) {
      await new Promise(res => setTimeout(res, 10 * 60 * 1000));
      consecutiveFailures = 0;
      lastSuccessfulScrape = Date.now();
      return false;
    }
    
    let uaIndex;
    do {
      uaIndex = Math.floor(Math.random() * userAgentStrings.length);
    } while (uaIndex === lastUserAgentIndex && userAgentStrings.length > 1);
    lastUserAgentIndex = uaIndex;
    const userAgent = userAgentStrings[uaIndex];
    const chains = ['sonic']; // Only scrape Sonic chain
    let allTokens: TokenData[] = [];
    
    for (const chain of chains) {
      for (let pageNum = 1; pageNum <= 10; pageNum++) {
        const tokens = await scrapePageWithRetry(pageNum, userAgent, chain);
        allTokens = allTokens.concat(tokens);
        if (pageNum < 10) {
          const delayTime = 3000 + Math.random() * 5000;
          await new Promise(res => setTimeout(res, delayTime));
        }
      }
      
      if (chain !== chains[chains.length - 1]) {
        const chainDelayTime = 5000 + Math.random() * 10000;
        await new Promise(res => setTimeout(res, chainDelayTime));
        try {
          await sendTorNewnym();
          await new Promise(res => setTimeout(res, 5000));
        } catch (torErr: unknown) {
          const error = torErr as Error;
          console.error('Failed to rotate Tor IP between chains:', error.message);
        }
      }
    }

    const sonicTokens = allTokens.filter(token => token.chain === 'sonic');

    const sonicData = {
      timestamp: new Date().toISOString(),
      totalTokens: sonicTokens.length,
      chain: 'sonic',
      sortedBy: 'pairAge (ascending)',
      tokens: sonicTokens
    };
    
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'sonic_tokens.json'), JSON.stringify(sonicData, null, 2));
    
    consecutiveFailures = 0;
    lastSuccessfulScrape = Date.now();
    const scrapeDuration = Date.now() - attemptStartTime;
    return true;
    
  } catch (err: unknown) {
    consecutiveFailures++;
    const scrapeDuration = Date.now() - attemptStartTime;
    const error = err as Error;
    console.error(`Scrape failed after ${scrapeDuration}ms (Attempt #${totalAttempts}, Failure #${consecutiveFailures}):`, error);
    const errorMessage = error.message || error.toString();
    if (errorMessage.includes('TimeoutError')) {
      console.warn('Timeout error detected, rotating Tor IP...');
      try {
        await sendTorNewnym();
        await new Promise(res => setTimeout(res, 8000));
      } catch (torErr: unknown) {
        const torError = torErr as Error;
        console.error('Failed to rotate Tor IP:', torError.message);
      }
    } else if (errorMessage.includes('Access denied') || errorMessage.includes('Cloudflare')) {
      console.error('Cloudflare blocking - taking extended break');
      await new Promise(res => setTimeout(res, 120000));
    } else {
      console.error('Non-timeout error occurred');
    }
    return false;
  } finally {
    isBrowserActive = false;
  }
}

let isScrapingInProgress = false;
let isBrowserActive = false;
let scraperInterval: NodeJS.Timeout | null = null;

async function runSingleScrape(): Promise<boolean> {
  if (isScrapingInProgress) {
    return false;
  }
  isScrapingInProgress = true;
  try {
    const success = await scraper();
    return success;
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Unexpected error in scraper:`, err);
    return false;
  } finally {
    isScrapingInProgress = false;
  }
}

async function scraperWithRetry(): Promise<void> {
  const MAX_CONSECUTIVE_FAILURES = 10;
  let attemptCount = 0;
  while (consecutiveFailures < MAX_CONSECUTIVE_FAILURES && attemptCount < 5) {
    attemptCount++;
    const success = await runSingleScrape();
    if (success) {
      consecutiveFailures = 0;
      return;
    }
    let waitTime;
    if (consecutiveFailures >= 6) {
      const cooldownMinutes = Math.min(consecutiveFailures - 5, 8);
      waitTime = cooldownMinutes * 60 * 1000;
    } else {
      waitTime = Math.pow(2, consecutiveFailures) * 1500;
    }
    await new Promise(res => setTimeout(res, waitTime));
  }
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    consecutiveFailures = 0;
    await new Promise(res => setTimeout(res, 900000));
  }
}

async function healthCheck(): Promise<boolean> {
  try {
    const socket = net.connect(TOR_CONTROL_PORT, '127.0.0.1');
    socket.end();
    return true;
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Tor control port not accessible:', error.message);
    return false;
  }
}

async function startScraper(): Promise<void> {
  if (scraperInterval) {
    clearInterval(scraperInterval);
    scraperInterval = null;
  }
  if (await healthCheck()) {
  } else {
  }
  await scraperWithRetry();
  process.exit(0);
}
startScraper().catch(console.error);