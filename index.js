import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-2.5-flash";

// pastikan kita bisa menerima JSON (body parser)
app.use(express.json());

const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

app.post('/generate-text', async (req, res) => {
    try {
        // amankan beda format dan fallback ke empty object jika tidak ada body
        const { prompt } = req.body || {};

        console.log(prompt);

        if (typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ message: "Missing or invalid 'prompt' in request body" });
        }

        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
        });
        const textResponse = result.text;

        res.status(200).json({ response: textResponse });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message || "Internal Server Error" });
    }
});

app.post('/generate-image', upload.single('image'), async (req, res) => {
    try {
        const { prompt } = req.body || {};

        if (!req.file) {
            return res.status(400).json({ message: "Missing image file" });
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
                        { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
                    ]
                }
            ],
        });
        const textResponse = result.text;

        res.status(200).json({ response: textResponse });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message || "Internal Server Error" });
    }
});

app.post('/generate-document', upload.single('document'), async (req, res) => {
    try {
        const { prompt } = req.body || {};

        if (!req.file) {
            return res.status(400).json({ message: "Missing document file" });
        }

        if (typeof prompt !== 'string' || !prompt.trim()) {
            return res.status(400).json({ message: "Missing or invalid 'prompt' in request body" });
        }

        const base64Document = req.file.buffer.toString('base64');

        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    parts: [
                        {
                            text: prompt ?? "Tolong buat ringkasan dari dokumen ini",
                            type: "text"
                        },
                        { 
                            inlineData: { 
                                data: base64Document, 
                                mimeType: req.file.mimetype
                            }
                        }
                    ]
                }
            ],
        });
        const textResponse = result.text;

        res.status(200).json({ response: textResponse });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message || "Internal Server Error" });
    }
});


app.post('/generate-audio', upload.single('audio'), async (req, res) => {
    try {
        const { prompt } = req.body || {};

        if (!req.file) {
            return res.status(400).json({ message: "Missing audio file" });
        }

        // if (typeof prompt !== 'string' || !prompt.trim()) {
        //     return res.status(400).json({ message: "Missing or invalid 'prompt' in request body" });
        // }

        const base64Audio = req.file.buffer.toString('base64');

        const result = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    parts: [
                        {
                            text: prompt ?? "Tolong buat audio dari dokumen ini",
                            type: "text"
                        },
                        { 
                            inlineData: { 
                                data: base64Audio, 
                                mimeType: req.file.mimetype
                            }
                        }
                    ]
                }
            ],
        });
        const textResponse = result.text;

        res.status(200).json({ response: textResponse });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error?.message || "Internal Server Error" });
    }
});