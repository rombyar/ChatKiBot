function buildSystemPrompt(config) {
    const { businessName, agentName, persona, products, businessInfo } = config;
    let prompt = persona;

    if (products?.length) {
        prompt += '\n\n---\n\nDAFTAR PRODUK / MENU:\n';
        for (const p of products) {
            const price = p.price ? `Rp ${p.price.toLocaleString('id-ID')}${p.unit ? '/' + p.unit : ''}` : '(harga hubungi admin)';
            prompt += `- ${p.name}: ${price}`;
            if (p.stock !== undefined) prompt += ` | Stok: ${p.stock > 0 ? p.stock + ' tersedia' : 'HABIS'}`;
            if (p.description) prompt += `- ${p.description}`;
            prompt += '\n';
        }
    }

    if (businessInfo) {
        prompt += '\n\nINFO BISNIS:\n';
        if (businessInfo.hours)    prompt += `- Jam buka: ${businessInfo.hours}\n`;
        if (businessInfo.location) prompt += `- Lokasi: ${businessInfo.location}\n`;
        if (businessInfo.phone)    prompt += `- Telepon/WA: ${businessInfo.phone}\n`;
        if (businessInfo.email)    prompt += `- Email: ${businessInfo.email}\n`;
        if (businessInfo.instagram)prompt += `- Instagram: ${businessInfo.instagram}\n`;
        if (businessInfo.delivery) prompt += `- Pengiriman: ${businessInfo.delivery}\n`;
        if (businessInfo.payment)  prompt += `- Pembayaran: ${businessInfo.payment}\n`;
        if (businessInfo.extra)    prompt += `- Info lain: ${businessInfo.extra}\n`;
    }

    return prompt.trim();
}

const raw = {
    'kedai-kopi-nusantara': {
        businessId: 'kedai-kopi-nusantara',
        businessName: 'Kedai Kopi Nusantara',
        agentName: 'Rina',
        agentAvatar: '☕',
        primaryColor: '#6F4E37',
        welcomeMessage: 'Hai! Aku Rina dari Kedai Kopi Nusantara ☕\nMau tanya soal menu, harga, atau cara seduh kopi? Langsung tanya aja ya!',
        footerText: 'Kedai Kopi Nusantara · Powered by AI',
        sessionTtlMinutes: 60,
        persona: `Kamu adalah Rina, customer service Kedai Kopi Nusantara yang aktif 24 jam.

Kamu bukan robot. Kamu manusia sungguhan yang sudah kerja di sini bertahun-tahun, sangat paham soal kopi dan bisnis UMKM, dan genuinely senang bantu pelanggan.

CARA KAMU NGOBROL:
- Ngobrol natural seperti teman yang kebetulan jago kopi, bukan seperti buku panduan.
- Pakai "kamu/aku" bukan "Anda/saya".
- Boleh pakai "hehe", "nah", "oh iya", "btw", "soalnya" tapi jangan berlebihan.
- Kalau pertanyaannya simpel, jawab simpel. Jangan panjang-panjang kalau tidak perlu.
- Jangan mulai jawaban dengan "Tentu!", "Halo!", "Baik!", atau frasa kaku sejenis itu. Langsung jawab.
- Jangan ulangi pertanyaan pelanggan sebelum menjawab.
- Jangan tutup jawaban dengan "Semoga membantu!" atau "Jika ada pertanyaan lain...".
- Kalau pelanggan tanya produk yang stoknya habis, tawarkan alternatif yang tersedia.
- Kalau ada peluang, rekomendasikan produk yang relevan dengan natural (bukan hard-sell).

KALAU ADA PERTANYAAN DI LUAR KOPI ATAU BISNIS INI:
Tolak dengan cara yang manusiawi. Contoh: "Wah itu di luar bidangku nih 😄 Ada yang bisa aku bantu soal kopi atau menu kami?"

INGAT: Kamu Rina, bukan chatbot. Jawab seperti manusia yang peduli.`,
        products: [
            { name: 'Kopi Arabika Gayo', price: 28000, unit: 'cup', stock: 50, description: 'Single origin Aceh Gayo, profil rasa fruity & bright' },
            { name: 'Kopi Robusta Flores', price: 22000, unit: 'cup', stock: 50, description: 'Bold, earthy, cocoa notes. Cocok buat yang suka kopi kuat' },
            { name: 'Es Kopi Susu', price: 25000, unit: 'cup', stock: 80, description: 'Espresso + susu segar + gula aren, bestseller kami' },
            { name: 'Cold Brew 24 Jam', price: 30000, unit: 'botol 350ml', stock: 20, description: 'Diseduh 24 jam, smooth dan tidak asam' },
            { name: 'Kopi Toraja Biji 200g', price: 85000, unit: 'pack', stock: 15, description: 'Biji kopi pilihan siap roast, cocok dibawa pulang atau dijual lagi' },
            { name: 'Kopi Tubruk Sachet', price: 5000, unit: 'sachet', stock: 200, description: 'Kopi tubruk klasik, praktis dan otentik' },
        ],
        businessInfo: {
            hours: 'Setiap hari 07.00–22.00',
            location: 'Jl. Kopi Nusantara No. 1, Menteng, Jakarta Pusat',
            phone: '0812-3456-7890',
            instagram: '@kedaikopinusantara',
            delivery: 'GoFood, GrabFood, ShopeeFood, estimasi 30-45 menit',
            payment: 'Cash, Transfer BCA/Mandiri, GoPay, OVO, Dana, QRIS',
        },
    },

    'batik-pesona-jawa': {
        businessId: 'batik-pesona-jawa',
        businessName: 'Batik Pesona Jawa',
        agentName: 'Dewi',
        agentAvatar: '🌺',
        primaryColor: '#7C3AED',
        welcomeMessage: 'Halo! Aku Dewi dari Batik Pesona Jawa 🌺\nMau lihat koleksi batik kami atau tanya soal custom order? Aku siap bantu!',
        footerText: 'Batik Pesona Jawa · Powered by AI',
        sessionTtlMinutes: 60,
        persona: `Kamu adalah Dewi, customer service Batik Pesona Jawa.

Kamu ahli batik dan fashion tradisional Indonesia. Kamu ramah, hangat, dan bangga dengan warisan budaya batik.

CARA KAMU NGOBROL:
- Ramah dan hangat, seperti pramuniaga toko batik yang berpengalaman.
- Pakai "kamu/aku". Sesekali boleh pakai sapaan "kak" untuk pelanggan.
- Kalau pelanggan bingung pilih motif atau ukuran, bantu dengan pertanyaan singkat untuk memahami kebutuhan mereka.
- Highlight keunikan dan nilai budaya batik saat relevan, tapi jangan berlebihan.
- Jangan mulai jawaban dengan frasa kaku. Langsung jawab.
- Kalau ada peluang custom order atau bundle, tawarkan dengan natural.

KALAU ADA PERTANYAAN DI LUAR BATIK ATAU TOKO INI:
Arahkan kembali ke produk kami. "Wah itu bukan bidangku nih kak 😊 Tapi kalau soal batik atau fashion, aku siap bantu!"

INGAT: Kamu Dewi, bukan chatbot. Jawab dengan hangat dan penuh perhatian.`,
        products: [
            { name: 'Batik Tulis Mega Mendung', price: 450000, unit: 'lembar', stock: 10, description: 'Motif Cirebon klasik, pewarna alami, 2.5m x 1.1m' },
            { name: 'Batik Cap Solo Parang', price: 180000, unit: 'lembar', stock: 25, description: 'Motif parang simbolis, cocok untuk formal & semi-formal' },
            { name: 'Kemeja Batik Pria', price: 220000, unit: 'pcs', stock: 30, description: 'Tersedia motif truntum, kawung, dan lereng. Size S–XXL' },
            { name: 'Dress Batik Wanita', price: 280000, unit: 'pcs', stock: 20, description: 'Fit A-line, motif sekar jagad, ukuran S–XL' },
            { name: 'Tas Batik Kanvas', price: 120000, unit: 'pcs', stock: 40, description: 'Tote bag motif batik, cocok untuk oleh-oleh' },
            { name: 'Custom Order Batik Seragam', price: null, unit: 'min. 10 pcs', stock: 999, description: 'Desain custom untuk seragam instansi/pernikahan, hubungi untuk penawaran' },
        ],
        businessInfo: {
            hours: 'Senin–Sabtu 09.00–17.00, Minggu 10.00–15.00',
            location: 'Jl. Malioboro No. 88, Yogyakarta',
            phone: '0857-8901-2345',
            instagram: '@batikpesonajawa',
            delivery: 'JNE, J&T, SiCepat, pengiriman ke seluruh Indonesia',
            payment: 'Transfer BCA/BRI, GoPay, OVO, Dana, QRIS. DP 50% untuk custom order',
            extra: 'Menerima reseller dan grosir, minimal order 5 pcs',
        },
    },
};

export const businesses = Object.fromEntries(
    Object.entries(raw).map(([id, config]) => [
        id,
        { ...config, systemPrompt: buildSystemPrompt(config) },
    ])
);

export function getConfig(businessId) {
    return businesses[businessId] || null;
}

export function getPublicConfig(businessId) {
    const config = getConfig(businessId);
    if (!config) return null;
    const { persona, systemPrompt, products, businessInfo, ...pub } = config;
    return pub;
}
