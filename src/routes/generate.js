import { Router } from 'express';
import multer from 'multer';
import {
    generateText,
    generateImage,
    generateDocument,
    generateAudio,
} from '../controllers/generateController.js';

const router = Router();
const upload = multer();

router.post('/generate-text', generateText);
router.post('/generate-image', upload.single('image'), generateImage);
router.post('/generate-document', upload.single('document'), generateDocument);
router.post('/generate-audio', upload.single('audio'), generateAudio);

export default router;
