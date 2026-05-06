# ChatKiBot

AI-powered chat widget for SME websites. It appears in the bottom-right corner of the page, powered by Gemini, with fully customizable persona and product data. A single server can handle multiple businesses, each with its own AI persona, product catalog, and theme.

---

## Demo

**Main page** – select a business before starting the chat:

![ChatKiBot Main](docs/img/ChatKiBot-main.png)

**Chat interface:**

<table>
  <tr>
    <td><img src="docs/img/ChatKiBot-umkm-01.png" alt="Chat Coffee Shop" width="240"/></td>
    <td><img src="docs/img/ChatKiBot-umkm-02.png" alt="Chat Batik Store" width="240"/></td>
  </tr>
  <tr>
    <td align="center">Coffee Shop · Rina</td>
    <td align="center">Batik Store · Dewi</td>
  </tr>
</table>

**Embedded widget:**

<table>
  <tr>
    <td><img src="docs/img/ChatKiBot-chatlive-01.png" alt="Widget Coffee Shop" width="240"/></td>
    <td><img src="docs/img/ChatKiBot-chatlive-02.png" alt="Widget Batik Store" width="240"/></td>
  </tr>
  <tr>
    <td align="center">Coffee Shop</td>
    <td align="center">Batik Store</td>
  </tr>
</table>

---

## Requirements

- Node.js 18+
- Gemini API Key (free via Google AI Studio)

---

## Setup

```bash
git clone <repo-url>
cd chatkibot
npm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Add your API key:

```
GEMINI_API_KEY=your_api_key_here
```

Run the app:

```bash
npm start
```

Open `http://localhost:3000`.

- Main page includes a business selector (Coffee Shop & Batik Store ready to try)
- Or open `http://localhost:3000/demo.html` to preview the widget directly

---

## Embed on Your Website

Place this before `</body>`:

```html
<script
  src="http://localhost:3000/widget/widget.js"
  data-business-id="coffee-shop"
  data-api-url="http://localhost:3000">
</script>
```

Notes:
- Replace `localhost:3000` with your production domain
- Replace `coffee-shop` with your business ID
- `data-api-url` is required if the widget runs on a different domain

The widget loads automatically—no additional HTML or CSS needed.

---

## Add a New Business

Edit `src/config/businesses.js` and duplicate an existing block:

```js
'business-id': {
    businessId: 'business-id',
    businessName: 'Store Name',
    agentName: 'Sari',
    agentAvatar: '🛍️',
    primaryColor: '#16A34A',
    welcomeMessage: 'Hi! How can I help you?',
    footerText: 'Store Name · Powered by AI',
    sessionTtlMinutes: 60,

    persona: `You are Sari, a customer support agent for Store Name.
Friendly, concise, and deeply knowledgeable about the products.
Use a casual tone. Avoid long-winded responses.`,

    products: [
        { name: 'Product Name', price: 50000, unit: 'pcs', stock: 30, description: 'Short description' },
    ],

    businessInfo: {
        hours: 'Mon–Sat 08:00–17:00',
        location: 'Store address',
        phone: '0812-xxxx-xxxx',
        instagram: '@storehandle',
        payment: 'Bank transfer, QRIS',
    },
},
```

Restart the server and the widget is ready.

---

## AI Persona

The `persona` field is a free-form instruction sent directly to Gemini. The more specific it is, the more consistent the AI behavior.

You can define:
- **Identity**: name, background ("5 years of experience")
- **Tone**: formal, casual, friendly, etc.
- **Out-of-stock handling**: suggest alternatives, redirect to WhatsApp, etc.
- **Scope**: product-only vs general conversation
- **Closing strategy**: lead to WhatsApp, phone, or store visit

---

## Project Structure

```
├── index.js
├── src/
│   ├── config/
│   │   ├── gemini.js
│   │   └── businesses.js
│   ├── controllers/
│   │   ├── generateController.js
│   │   └── widgetController.js
│   └── routes/
│       ├── generate.js
│       └── widget.js
└── public/
    ├── index.html
    ├── demo.html
    ├── css/
    │   └── style.css
    ├── js/
    │   └── script.js
    └── widget/
        └── widget.js
```

---

## API

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/widget/businesses` | List all businesses |
| GET | `/widget/config/:businessId` | Public business config |
| POST | `/widget/chat` | Send text message |
| POST | `/widget/chat/file` | Send message with file |
| POST | `/generate-text` | Generate free-form text |

### Example: Text Chat

```js
fetch('http://localhost:3000/widget/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        businessId: 'coffee-shop',
        messages: [
            { role: 'user', content: 'What is your best-selling coffee?' }
        ]
    })
})
```

Response:

```json
{
    "response": "Our iced milk coffee is the best seller, usually sold out before evening..."
}
```

Multi-turn: send full message history (auto-trimmed to last 20 messages).

---

### Example: Chat with File

```js
const form = new FormData();
form.append('businessId', 'coffee-shop');
form.append('messages', JSON.stringify([
    { role: 'user', content: 'Here is our product image, can you write a description?' }
]));
form.append('file', fileInput.files[0]);

fetch('http://localhost:3000/widget/chat/file', {
    method: 'POST',
    body: form,
})
```

Supported file types:
- Images: JPEG, PNG, GIF, WEBP
- PDF
- Audio: MP3, WAV, OGG, AAC, FLAC, WEBM

Max size: 10 MB

---

## Deployment

No special configuration required.

Ensure `GEMINI_API_KEY` is set, then:

```bash
npm start
```

For production (PM2):

```bash
npm install -g pm2
pm2 start index.js --name chatkibot
pm2 save
```

Update the embed script with your production domain.

---

## License

Karsa Wave — MIT + Commons Clause

Free to use, modify, and distribute. However, selling this code as a primary product (original or minimally modified) is a license violation. Sale is only permitted when this code is a minor part of a larger product with real added value.

This code is provided "as is" without any warranty. Karsa Wave is not liable for any damages arising from its use.
