import * as categoryService from '../services/category.service';
import { successResponse } from '../utils/response';

const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories();
    return successResponse(res, categories, 'Categories retrieved');
  } catch (error) { next(error); }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return successResponse(res, category, 'Category created', 201);
  } catch (error) { next(error); }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    return successResponse(res, category, 'Category updated');
  } catch (error) { next(error); }
};

const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    return successResponse(res, null, 'Category deleted');
  } catch (error) { next(error); }
};

export { getCategories, createCategory, updateCategory, deleteCategory };
