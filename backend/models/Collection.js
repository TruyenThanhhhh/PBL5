const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  coverImage: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Collection', collectionSchema);
