import express from 'express';
const router = express.Router();
import * as categoryController from '../controllers/category.controller';

router.get('/', categoryController.getCategories);

export default router;
