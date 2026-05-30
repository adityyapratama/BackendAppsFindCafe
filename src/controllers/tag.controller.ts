import * as tagService from '../services/tag.service';
import { successResponse } from '../utils/response';

const getTags = async (req, res, next) => {
  try {
    const tags = await tagService.getTags(req.query.type);
    return successResponse(res, tags, 'Tags retrieved');
  } catch (error) { next(error); }
};

const createTag = async (req, res, next) => {
  try {
    const tag = await tagService.createTag(req.body);
    return successResponse(res, tag, 'Tag created', 201);
  } catch (error) { next(error); }
};

const updateTag = async (req, res, next) => {
  try {
    const tag = await tagService.updateTag(req.params.id, req.body);
    return successResponse(res, tag, 'Tag updated');
  } catch (error) { next(error); }
};

const deleteTag = async (req, res, next) => {
  try {
    await tagService.deleteTag(req.params.id);
    return successResponse(res, null, 'Tag deleted');
  } catch (error) { next(error); }
};

export { getTags, createTag, updateTag, deleteTag };
