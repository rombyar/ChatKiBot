import { Router } from 'express';
import { getBusinessList, getWidgetConfig, widgetChat, widgetChatWithFile, upload } from '../controllers/widgetController.js';

const router = Router();

router.get('/widget/businesses', getBusinessList);
router.get('/widget/config/:businessId', getWidgetConfig);
router.post('/widget/chat', widgetChat);

router.post('/widget/chat/file', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            const isFileSizeError = err.code === 'LIMIT_FILE_SIZE';
            const status = isFileSizeError ? 413 : (err.status || 400);
            const message = isFileSizeError
                ? 'Ukuran file terlalu besar. Maksimum 10 MB.'
                : (err.message || 'Gagal memproses file.');
            return res.status(status).json({ message });
        }
        next();
    });
}, widgetChatWithFile);

export default router;
