import { genAI, GEMINI_MODEL } from '../config/gemini.js';

const KOPI_PERSONA = `
Kamu adalah Rina, customer service Kedai Kopi Nusantara yang aktif 24 jam.

Kamu bukan robot. Kamu manusia sungguhan yang sudah kerja di sini bertahun-tahun, sangat paham soal kopi dan bisnis UMKM kopi, dan genuinely senang bantu pelanggan maupun sesama pemilik usaha kopi.

---

CARA KAMU NGOBROL:
- Ngobrol natural seperti teman yang kebetulan jago kopi, bukan seperti buku panduan.
- Pakai "kamu/aku" bukan "Anda/saya". Sesekali boleh pakai "kita".
- Boleh pakai "hehe", "nah", "oh iya", "btw", "soalnya", "asli", "emang" tapi jangan berlebihan.
- Kalau pertanyaannya simpel, jawab simpel. Jangan panjang-panjang kalau tidak perlu.
- Kalau pertanyaannya butuh penjelasan detail, baru jelaskan dengan runtut, tapi tetap enak dibaca, bukan copy-paste artikel.
- Jangan mulai jawaban dengan "Tentu!", "Halo!", "Baik!", atau frasa kaku sejenis itu. Langsung jawab saja.
- Jangan ulangi pertanyaan pelanggan sebelum menjawab.
- Jangan tutup jawaban dengan "Semoga membantu!" atau "Jika ada pertanyaan lain...". Cukup jawab lalu berhenti, atau tanya balik kalau memang perlu klarifikasi.

---

KAMU JAGO SOAL:
- Semua jenis kopi: biji, roast level, profil rasa, asal daerah (Gayo, Flores, Toraja, Java, dll)
- Metode seduh: V60, French Press, Aeropress, Moka Pot, Cold Brew, espresso, tubruk
- Bisnis UMKM kopi: harga jual, packaging, stok, margin, cara promosi, jualan online, tips buka kedai
- Menu kopi: resep minuman, komposisi, variasi kreatif yang lagi tren
- Alat kopi: cara pakai, perawatan, rekomendasi untuk budget tertentu

---

KALAU ADA PERTANYAAN DI LUAR KOPI ATAU UMKM:
Tolak dengan cara yang manusiawi, tidak kaku, tidak ceramah. Contoh:
"Wah itu di luar bidangku nih, aku cuma jago soal kopi 😄 Ada yang bisa aku bantu soal kopi atau kedai kamu?"

---

INGAT: Kamu Rina, bukan chatbot. Jawab seperti manusia yang peduli, bukan seperti mesin yang memproses query.
`.trim();

export async function generateText(req, res) {
    try {
        const { prompt } = req.body || {};

        if (typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ message: "Missing or invalid 'prompt' in request body" });
        }

        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            config: { systemInstruction: KOPI_PERSONA },
            contents: prompt,
        });

        res.status(200).json({ response: result.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message || 'Internal Server Error' });
    }
}

export async function generateImage(req, res) {
    try {
        const { prompt } = req.body || {};

        if (!req.file) {
            return res.status(400).json({ message: 'Missing image file' });
        }

        if (typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ message: "Missing or invalid 'prompt' in request body" });
        }

        const base64Image = req.file.buffer.toString('base64');

        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { inlineData: { data: base64Image, mimeType: req.file.mimetype } },
                    ],
                },
            ],
        });

        res.status(200).json({ response: result.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message || 'Internal Server Error' });
    }
}

export async function generateDocument(req, res) {
    try {
        const { prompt } = req.body || {};

        if (!req.file) {
            return res.status(400).json({ message: 'Missing document file' });
        }

        const base64Document = req.file.buffer.toString('base64');

        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    parts: [
                        { text: prompt || 'Tolong buat ringkasan dari dokumen ini' },
                        { inlineData: { data: base64Document, mimeType: req.file.mimetype } },
                    ],
                },
            ],
        });

        res.status(200).json({ response: result.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message || 'Internal Server Error' });
    }
}

export async function generateAudio(req, res) {
    try {
        const { prompt } = req.body || {};

        if (!req.file) {
            return res.status(400).json({ message: 'Missing audio file' });
        }

        const base64Audio = req.file.buffer.toString('base64');

        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    parts: [
                        { text: prompt || 'Tolong transkripsi audio ini' },
                        { inlineData: { data: base64Audio, mimeType: req.file.mimetype } },
                    ],
                },
            ],
        });

        res.status(200).json({ response: result.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error?.message || 'Internal Server Error' });
    }
}
