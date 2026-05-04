import { genAI, GEMINI_MODEL } from '../config/gemini.js';
import { businesses, getConfig, getPublicConfig } from '../config/businesses.js';

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
