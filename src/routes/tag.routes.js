const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');

router.get('/', tagController.getTags);

module.exports = router;
