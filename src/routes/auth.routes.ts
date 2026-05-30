import express from 'express';
const router = express.Router();
import * as authController from '../controllers/auth.controller';
import { auth } from '../middleware/auth';
import validate from '../middleware/validate';
import * as authValidation from '../validations/auth.validation';

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh', validate(authValidation.refreshToken), authController.refresh);
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, validate(authValidation.updateProfile), authController.updateProfile);
router.post('/logout', auth, authController.logout);

export default router;
