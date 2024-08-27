const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const axios = require('axios');

let dom;
let document;
let window;
let idCache = {};
let pendingIdRequests = {};

beforeEach(() => {
  const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
  dom = new JSDOM(html, { runScripts: 'dangerously' });
  document = dom.window.document;
  window = dom.window;
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCorrectId(currentId, html) {
  if (idCache[currentId]) {
    return idCache[currentId];
  }

  if (pendingIdRequests[currentId]) {
    return pendingIdRequests[currentId];
  }

  pendingIdRequests[currentId] = new Promise(async (resolve) => {
    const systemTemplate = `You are an AI assistant tasked with analyzing HTML code and identifying the correct ID for a specific element. The current ID being used is no longer valid, and you need to find the updated ID in the provided HTML.`;

    const Prompt = `The current ID "${currentId}" is not found in the HTML. Please analyze the following HTML and identify the correct ID for the element that most closely matches the purpose of "${currentId}". Only return the new ID, nothing else.

    HTML:
    ${html}`;

    const openaiAPIKey = process.env.OPENAI_API_KEY;
    if (!openaiAPIKey) {
      console.error("Error: OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.");
      process.exit(1);
    }
    const requestOptions = {
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiAPIKey}`,
      },
      data: {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemTemplate,
          },
          { role: "user", content: Prompt },
          { role: "assistant", content: "" },
        ],
        temperature: 0.1,
        max_tokens: 500,
      },
    };  

    try {
      await delay(1000); // Add a 1-second delay before making the API call
      const response = await axios(requestOptions);
      const newId = response.data.choices[0].message.content.trim();
      idCache[currentId] = newId;
      console.log(`Updated ID: ${currentId} -> ${newId}`);
      resolve(newId);
    } catch (error) {
      console.error("Error calling LLM API:", error);
      throw error;
    } finally {
      delete pendingIdRequests[currentId];
    }
  });

  return pendingIdRequests[currentId];
}

async function getElement(id) {
  let element = document.getElementById(id);
  if (!element) {
    const html = dom.serialize();
    const newId = await getCorrectId(id, html);
    element = document.getElementById(newId);
    if (!element) {
      throw new Error(`Element with ID ${newId} not found`);
    }
  }
  return element;
}

async function addToCart(product, options = {}) {
  try {
    if (product === 'T-Shirt') {
      const sizeElement = await getElement('tshirt-size-new');
      const colorElement = await getElement('tshirt-color-xyz');
      sizeElement.value = options.size || 'm';
      colorElement.value = options.color || 'red';
    } else if (product === 'Jeans') {
      const sizeElement = await getElement('jeans-size');
      const styleElement = await getElement('jeans-style');
      sizeElement.value = options.size || '30';
      styleElement.value = options.style || 'slim';
    }
    window.addToCart(product);
  } catch (error) {
    console.error(`Error adding ${product} to cart:`, error);
    throw error;
  }
}

function updateTestFile() {
  if (Object.keys(idCache).length === 0) return;

  const testFilePath = path.resolve(__dirname, './adaptiveAddToCart.test.js');
  let content = fs.readFileSync(testFilePath, 'utf8');

  for (const [oldId, newId] of Object.entries(idCache)) {
    const regex = new RegExp(`'${oldId}'`, 'g');
    content = content.replace(regex, `'${newId}'`);
  }

  fs.writeFileSync(testFilePath, content, 'utf8');
  console.log('Test file updated with new IDs');
}

describe('Adaptive Add to Cart Functionality', () => {
  test('TC001: Add T-Shirt with valid size and color', async () => {
    await addToCart('T-Shirt');
    const cartItems = document.getElementById('cart-items');
    expect(cartItems.children.length).toBe(1);
    expect(cartItems.children[0].textContent).toBe('T-Shirt - Size: M, Color: red');
  });

  test('TC002: Add T-Shirt with custom size and color', async () => {
    await addToCart('T-Shirt', { size: 'l', color: 'blue' });
    const cartItems = document.getElementById('cart-items');
    expect(cartItems.children.length).toBe(1);
    expect(cartItems.children[0].textContent).toBe('T-Shirt - Size: L, Color: blue');
  });

  test('TC003: Add multiple T-Shirts with different options', async () => {
    await addToCart('T-Shirt', { size: 's', color: 'green' });
    await addToCart('T-Shirt', { size: 'xl', color: 'black' });
    const cartItems = document.getElementById('cart-items');
    expect(cartItems.children.length).toBe(2);
    expect(cartItems.children[0].textContent).toBe('T-Shirt - Size: S, Color: green');
    expect(cartItems.children[1].textContent).toBe('T-Shirt - Size: XL, Color: black');
  });

  test('TC004: Add Jeans with valid size and style', async () => {
    await addToCart('Jeans');
    const cartItems = document.getElementById('cart-items');
    expect(cartItems.children.length).toBe(1);
    expect(cartItems.children[0].textContent).toBe('Jeans - Size: 30, Style: slim');
  });

  test('TC005: Add Jeans with custom size and style', async () => {
    await addToCart('Jeans', { size: '34', style: 'regular' });
    const cartItems = document.getElementById('cart-items');
    expect(cartItems.children.length).toBe(1);
    expect(cartItems.children[0].textContent).toBe('Jeans - Size: 34, Style: regular');
  });

  test('TC006: Add multiple items to cart', async () => {
    await addToCart('T-Shirt', { size: 'm', color: 'red' });
    await addToCart('Jeans', { size: '32', style: 'relaxed' });
    const cartItems = document.getElementById('cart-items');
    expect(cartItems.children.length).toBe(2);
    expect(cartItems.children[0].textContent).toBe('T-Shirt - Size: M, Color: red');
    expect(cartItems.children[1].textContent).toBe('Jeans - Size: 32, Style: relaxed');
  });

  afterAll(() => {
    updateTestFile();
  });
});