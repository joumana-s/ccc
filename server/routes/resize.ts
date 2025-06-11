import express from 'express';
import {
  resizeHandler,
  apiResizeHandler,
} from '../controllers/resizeController';

const router = express.Router();

router.post('/resize', resizeHandler);
router.get('/api/resize-image', apiResizeHandler);

export default router;
