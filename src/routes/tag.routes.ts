import express from 'express';
const router = express.Router();
import * as tagController from '../controllers/tag.controller';

router.get('/', tagController.getTags);

export default router;
