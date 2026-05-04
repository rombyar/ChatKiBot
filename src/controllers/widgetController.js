import multer from 'multer';
import { genAI, GEMINI_MODEL } from '../config/gemini.js';
import { businesses, getConfig, getPublicConfig } from '../config/businesses.js';

// ── File upload validation ──
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'audio/mp4', 'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/webm',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(null, true);
        } else {
            const err = new Error('Tipe file tidak didukung. Hanya gambar (JPEG/PNG/GIF/WEBP), PDF, dan audio yang diizinkan.');
            err.status = 415;
            cb(err, false);
        }
    },
});

// ── Controllers ──
export function getBusinessList(_req, res) {
    const list = Object.values(businesses).map(({ businessId, businessName, agentName, agentAvatar, primaryColor, welcomeMessage, footerText }) => ({
        businessId, businessName, agentName, agentAvatar, primaryColor, welcomeMessage, footerText,
    }));
    res.json(list);
}

export function getWidgetConfig(req, res) {
    const config = getPublicConfig(req.params.businessId);
    if (!config) return res.status(404).json({ message: 'Business not found' });
    res.json(config);
}

export async function widgetChat(req, res) {
    const { businessId, messages } = req.body || {};

    if (!businessId || typeof businessId !== 'string') {
        return res.status(400).json({ message: "Missing 'businessId'" });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "Missing or empty 'messages' array" });
    }

    const config = getConfig(businessId);
    if (!config) return res.status(404).json({ message: 'Business not found' });

    const last = messages[messages.length - 1];
    if (last?.role !== 'user' || !last?.content?.trim()) {
        return res.status(400).json({ message: "Last message must be a non-empty 'user' message" });
    }

    const history = messages.slice(-20);

    // Gemini menolak kalau pesan pertama bukan dari user
    while (history.length > 0 && history[0].role !== 'user') {
        history.shift();
    }
    if (history.length === 0) {
        return res.status(400).json({ message: 'No user message found in history' });
    }

    const contents = history.map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
    }));

    try {
        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            config: { systemInstruction: config.systemPrompt },
            contents,
        });

        res.json({ response: result.text });
    } catch (error) {
        const status = error?.status ?? error?.code ?? error?.response?.status;
        const isQuotaError = status === 429
            || error?.message?.includes('RESOURCE_EXHAUSTED')
            || error?.message?.includes('quota');

        if (isQuotaError) {
            console.warn('[widgetChat] Quota exceeded');
            return res.status(429).json({
                message: 'Maaf, asisten sedang tidak bisa dihubungi karena terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.',
            });
        }

        console.error('[widgetChat]', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server. Silakan coba lagi.' });
    }
}

export async function widgetChatWithFile(req, res) {
    const businessId = req.body?.businessId;
    let messages;

    try {
        messages = JSON.parse(req.body?.messages || '[]');
    } catch {
        return res.status(400).json({ message: "Field 'messages' harus berupa JSON array yang valid." });
    }

    if (!businessId || typeof businessId !== 'string') {
        return res.status(400).json({ message: "Missing 'businessId'" });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "Missing or empty 'messages' array" });
    }

    const config = getConfig(businessId);
    if (!config) return res.status(404).json({ message: 'Business not found' });

    const file = req.file;
    const lastMsg = messages[messages.length - 1];

    if (lastMsg?.role !== 'user') {
        return res.status(400).json({ message: "Last message must be from 'user'" });
    }

    const userText = lastMsg.content?.trim() || '';
    if (!userText && !file) {
        return res.status(400).json({ message: 'Pesan atau berkas diperlukan.' });
    }

    // Build parts for current user message (file first, then text)
    const lastParts = [];
    if (file) {
        lastParts.push({
            inlineData: {
                mimeType: file.mimetype,
                data: file.buffer.toString('base64'),
            },
        });
    }
    lastParts.push({ text: userText || 'Tolong analisa berkas yang saya kirimkan.' });

    // Build history from previous messages (exclude last/current)
    const history = messages.slice(0, -1).slice(-19);
    while (history.length > 0 && history[0].role !== 'user') history.shift();

    const contents = [
        ...history.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: 'user', parts: lastParts },
    ];

    try {
        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            config: { systemInstruction: config.systemPrompt },
            contents,
        });

        res.json({ response: result.text });
    } catch (error) {
        const status = error?.status ?? error?.code ?? error?.response?.status;
        const isQuotaError = status === 429
            || error?.message?.includes('RESOURCE_EXHAUSTED')
            || error?.message?.includes('quota');

        if (isQuotaError) {
            console.warn('[widgetChatWithFile] Quota exceeded');
            return res.status(429).json({
                message: 'Maaf, asisten sedang tidak bisa dihubungi karena terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.',
            });
        }

        console.error('[widgetChatWithFile]', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server. Silakan coba lagi.' });
    }
}
