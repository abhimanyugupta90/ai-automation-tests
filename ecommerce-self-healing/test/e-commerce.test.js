const puppeteer = require('puppeteer');

let browser;
let page;

// Utility function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to get element by selector
async function getElement(page, selector) {
  console.log(`Attempting to find element with selector: ${selector}`);
  try {
    if (selector.startsWith('//')) {
      const [element] = await page.$x(selector);
      if (element) {
        console.log(`Element found with XPath: ${selector}`);
        return element;
      }
    } else {
      const element = await page.$(selector);
      if (element) {
        console.log(`Element found with selector: ${selector}`);
        return element;
      }
    }
  } catch (error) {
    console.log(`Element not found with selector: ${selector}`);
  }
  throw new Error(`Element not found: ${selector}`);
}

const withTimeout = (timeoutMs, promise) => {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });
  return Promise.race([
    promise,
    timeoutPromise,
  ]).then((result) => {
    clearTimeout(timeoutHandle);
    return result;
  });
}

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: false,  // Set to true for production
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
});

afterAll(async () => {
  await browser.close();
});

describe('E-commerce Tests', () => {
  beforeEach(async () => {
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);
    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    console.log('Navigation complete');
  });

  afterEach(async () => {
    await page.close();
  });

  test('1. Adding a product to the cart', async () => {
    console.log('Starting test: Adding a product to the cart');
    await withTimeout(60000, async () => {
      console.log('Selecting size');
      await (await getElement(page, 'select[name="size"]')).select('M');
      console.log('Selecting color');
      await (await getElement(page, 'select[name="color"]')).select('Blue');
      
      console.log('Clicking Add to Cart button');
      const dialogPromise = new Promise(resolve => page.once('dialog', resolve));
      await (await getElement(page, 'button[type="submit"]')).click();
      console.log('Waiting for dialog');
      const dialog = await dialogPromise;
      expect(dialog.message()).toBe('Product added to cart!');
      await dialog.dismiss();
      
      console.log('Navigating to cart page');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        (await getElement(page, 'a[href="/cart"]')).click(),
      ]);
      
      console.log('Waiting for cart item to be visible');
      await page.waitForSelector('.cart-item', { timeout: 5000 });
      
      console.log('Checking cart contents');
      const cartItemText = await page.$eval('.cart-item', el => el.textContent);
      expect(cartItemText).toContain('T-Shirt');
      expect(cartItemText).toContain('Size: M');
      expect(cartItemText).toContain('Color: Blue');
    });
    console.log('Test completed: Adding a product to the cart');
  }, 70000);

  test('2. Viewing the cart', async () => {
    console.log('Starting test: Viewing the cart');
    await withTimeout(60000, async () => {
      console.log('Navigating to cart page');
      await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle0' });
      
      console.log('Waiting for cart items to load');
      await page.waitForSelector('.cart-item', { timeout: 10000 });
      
      console.log('Counting cart items');
      const cartItems = await page.$$('.cart-item');
      expect(cartItems.length).toBeGreaterThan(0);
      
      console.log('Checking for checkout button');
      const checkoutButton = await getElement(page, '#checkout-button');
      expect(checkoutButton).not.toBeNull();
    });
    console.log('Test completed: Viewing the cart');
  }, 70000);

  test('3. Completing the checkout process', async () => {
    console.log('Starting test: Completing the checkout process');
    await withTimeout(60000, async () => {
      console.log('Navigating to cart page');
      await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle0' });
      
      console.log('Waiting for checkout button');
      await page.waitForSelector('#checkout-button', { timeout: 10000 });
      
      console.log('Clicking checkout button');
      const dialogPromise = new Promise(resolve => page.once('dialog', resolve));
      await (await getElement(page, '#checkout-button')).click();
      console.log('Waiting for checkout confirmation dialog');
      const dialog = await dialogPromise;
      expect(dialog.message()).toBe('Checkout successful!');
      await dialog.dismiss();
      
      console.log('Waiting for navigation to home page');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      expect(page.url()).toBe('http://localhost:3000/');
      
      console.log('Navigating back to cart page');
      await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle0' });
      console.log('Waiting for cart items');
      await page.waitForSelector('#cart-items', { timeout: 10000 });
      console.log('Checking if cart is empty');
      const emptyCartMessage = await page.$eval('#cart-items', el => el.textContent);
      expect(emptyCartMessage).toContain('Your cart is empty');
    });
    console.log('Test completed: Completing the checkout process');
  }, 70000);

  test('4. Add to cart and checkout using XPath selectors', async () => {
    console.log('Starting test: Add to cart and checkout using XPath selectors');
    await withTimeout(60000, async () => {
      console.log('Selecting size using XPath');
      await (await getElement(page, "//select[@name='size']")).select('M');
      console.log('Selecting color using XPath');
      await (await getElement(page, "//select[@name='color']")).select('Blue');
      
      console.log('Clicking Add to Cart button using XPath');
      const dialogPromise = new Promise(resolve => page.once('dialog', resolve));
      await (await getElement(page, "//button[@type='submit']")).click();
      console.log('Waiting for dialog');
      const dialog = await dialogPromise;
      expect(dialog.message()).toBe('Product added to cart!');
      await dialog.dismiss();
      
      console.log('Navigating to cart page using XPath');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        (await getElement(page, "//a[@href='/cart']")).click(),
      ]);
      
      console.log('Waiting for cart item to be visible');
      await page.waitForXPath("//div[contains(@class, 'cart-item')]", { timeout: 10000 });
      
      console.log('Checking cart contents using XPath');
      const cartItem = await getElement(page, "//div[contains(@class, 'cart-item')]");
      const cartItemText = await page.evaluate(el => el.textContent, cartItem);
      expect(cartItemText).toContain('T-Shirt');
      expect(cartItemText).toContain('Size: M');
      expect(cartItemText).toContain('Color: Blue');
      
      console.log('Clicking checkout button using XPath');
      const checkoutDialogPromise = new Promise(resolve => page.once('dialog', resolve));
      await (await getElement(page, "//button[@id='checkout-button']")).click();
      console.log('Waiting for checkout confirmation dialog');
      const checkoutDialog = await checkoutDialogPromise;
      expect(checkoutDialog.message()).toBe('Checkout successful!');
      await checkoutDialog.dismiss();
      
      console.log('Waiting for navigation to home page');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      expect(page.url()).toBe('http://localhost:3000/');
      
      console.log('Navigating back to cart page');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.goto('http://localhost:3000/cart'),
      ]);
      
      console.log('Waiting for cart items to be visible');
      await page.waitForXPath("//div[@id='cart-items']", { timeout: 10000 });
      
      console.log('Checking if cart is empty using XPath');
      const cartItems = await getElement(page, "//div[@id='cart-items']");
      const emptyCartMessage = await page.evaluate(el => el.textContent, cartItems);
      expect(emptyCartMessage).toContain('Your cart is empty');
    });
    console.log('Test completed: Add to cart and checkout using XPath selectors');
  }, 70000);
});