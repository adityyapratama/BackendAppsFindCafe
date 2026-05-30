import * as authService from '../services/auth.service';
import { successResponse } from '../utils/response';

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    return successResponse(res, result, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return successResponse(res, user, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    return successResponse(res, user, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

export { register, login, refresh, getMe, logout, updateProfile };
