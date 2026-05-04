import { Router } from 'express';
import { getWidgetConfig, widgetChat } from '../controllers/widgetController.js';

const router = Router();

router.get('/widget/config/:businessId', getWidgetConfig);
router.post('/widget/chat', widgetChat);

export default router;
