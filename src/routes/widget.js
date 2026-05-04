import { Router } from 'express';
import { getBusinessList, getWidgetConfig, widgetChat } from '../controllers/widgetController.js';

const router = Router();

router.get('/widget/businesses', getBusinessList);
router.get('/widget/config/:businessId', getWidgetConfig);
router.post('/widget/chat', widgetChat);

export default router;
