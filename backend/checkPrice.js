const mongoose = require('mongoose');
const Post = require('./models/Post');
(async () => {
  await mongoose.connect('mongodb://localhost:27017/DB_PBL5fix');
  const p = await Post.findOne();
  console.log('sample', p && {id: p._id, price: p.price, priceRange: p.priceRange});
  await mongoose.disconnect();
})();