const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyCollections, createCollection, togglePost, deleteCollection, checkSaved } = require('../controllers/collectionController');

router.get('/', protect, getMyCollections);
router.post('/', protect, createCollection);
router.get('/check/:postId', protect, checkSaved);
router.put('/:id/toggle', protect, togglePost);
router.delete('/:id', protect, deleteCollection);

module.exports = router;
