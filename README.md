# UMKM AI Chat Widget

Widget chat AI untuk website UMKM. Muncul di pojok kanan bawah halaman, seperti Intercom atau Tawk.to, ditenagai Gemini dengan persona dan data produk yang bisa dikonfigurasi sendiri.

Satu server bisa handle banyak bisnis sekaligus, masing-masing punya persona AI, katalog produk, dan warna tema sendiri.

---

## Requirement

- Node.js 18+
- Gemini API Key (gratis di [Google AI Studio](https://aistudio.google.com))

---

## Setup

```bash
git clone <repo-url>
cd gemini-flash-api
npm install
```

Buat file `.env` dari contoh yang sudah ada:

```bash
cp .env.example .env
```

Isi API key di `.env`:

```
GEMINI_API_KEY=isi_api_key_di_sini
```

Jalankan:

```bash
npm start
```

Buka `http://localhost:3000/demo.html`, ada dua contoh bisnis (Kedai Kopi dan Toko Batik) yang sudah siap dicoba.

---

## Pasang di website

Taruh ini sebelum `</body>`:

```html
<script src="http://localhost:3000/widget/widget.js" data-business-id="kedai-kopi-nusantara"></script>
```

Ganti `localhost:3000` dengan domain server setelah deploy, dan `kedai-kopi-nusantara` dengan ID bisnis yang sesuai. Widget langsung muncul tanpa perlu tambah CSS atau HTML lain.

---

## Tambah bisnis baru

Edit `src/config/businesses.js`, copy salah satu blok yang sudah ada, dan sesuaikan:

```js
'nama-bisnis': {
    businessId: 'nama-bisnis',
    businessName: 'Nama Toko',
    agentName: 'Sari',
    agentAvatar: '🛍️',
    primaryColor: '#16A34A',
    welcomeMessage: 'Halo! Ada yang bisa dibantu?',
    footerText: 'Nama Toko · Powered by AI',

    persona: `Kamu adalah Sari, CS Nama Toko.
Ramah, to the point, dan paham produk toko ini luar dalam.
Pakai bahasa santai. Jangan bertele-tele.`,

    products: [
        { name: 'Nama Produk', price: 50000, unit: 'pcs', stock: 30, description: 'Deskripsi singkat' },
    ],

    businessInfo: {
        hours: 'Senin–Sabtu 08.00–17.00',
        location: 'Alamat toko',
        phone: '0812-xxxx-xxxx',
        instagram: '@namatoko',
        payment: 'Transfer, QRIS',
    },
},
```

Simpan, restart server, dan widget sudah siap dipakai.

---

## Persona AI

Field `persona` adalah instruksi bebas yang langsung dikirim ke Gemini. Semakin spesifik, semakin konsisten perilaku AI-nya.

Yang bisa diatur:
- **Identitas**: nama, latar belakang ("udah 5 tahun kerja di sini")
- **Gaya bicara**: formal, santai, pakai sapaan Kak/Bang, dll.
- **Skenario produk habis**: tawarkan alternatif, minta WA customer, dll.
- **Batasan topik**: hanya soal produk, atau boleh lebih luas
- **Closing**: arahkan ke WA, telepon, atau kunjungan langsung

---

## Struktur project

```
├── index.js
├── src/
│   ├── config/
│   │   ├── gemini.js               # inisialisasi Gemini SDK
│   │   └── businesses.js           # konfigurasi semua bisnis
│   ├── controllers/
│   │   ├── generateController.js
│   │   └── widgetController.js
│   └── routes/
│       ├── generate.js
│       └── widget.js
└── public/
    ├── index.html
    ├── demo.html
    └── widget/
        └── widget.js               # script embeddable
```

---

## API

| Method | URL | Keterangan |
|--------|-----|------------|
| `GET` | `/widget/config/:businessId` | Config publik bisnis (nama, warna, avatar) |
| `POST` | `/widget/chat` | Kirim pesan ke AI |
| `POST` | `/generate-text` | Generate teks bebas |

### Contoh request

```js
fetch('http://localhost:3000/widget/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        businessId: 'kedai-kopi-nusantara',
        messages: [
            { role: 'user', content: 'Kopi apa yang paling laris?' }
        ]
    })
})
```

```json
{
    "response": "Es Kopi Susu kami yang paling laku, hampir tiap hari habis sebelum sore hehe..."
}
```

Untuk multi-turn, kirim semua history di array `messages`. Server otomatis potong di 20 pesan terakhir.

---

## Deploy

Tidak ada config khusus. Pastikan `GEMINI_API_KEY` tersedia di environment server, lalu `npm start`.

Untuk production, pakai PM2:

```bash
npm install -g pm2
pm2 start index.js --name umkm-widget
pm2 save
```

Setelah deploy, ganti `localhost:3000` di embed code dengan domain server.
