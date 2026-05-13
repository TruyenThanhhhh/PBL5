const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const Community = require("../models/Community");
const Post = require("../models/Post");
const { normalizeCommunityKey } = require("../utils/communityName");

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/DB_PBL5fix";

async function main() {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected:", mongoUri);

  const all = await Community.find().sort({ createdAt: 1 }).lean();
  const groups = new Map();

  for (const c of all) {
    const key = normalizeCommunityKey(c.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }

  let removed = 0;
  for (const [, list] of groups) {
    if (list.length <= 1) continue;
    const keep = list[0];
    const duplicates = list.slice(1);
    console.log(
      `Trùng tên "${keep.name}": giữ _id=${keep._id}, xóa ${duplicates.length} bản ghi`
    );
    for (const doc of duplicates) {
      const delPosts = await Post.deleteMany({ community: doc._id });
      if (delPosts.deletedCount > 0) {
        console.log(`  — Đã xóa ${delPosts.deletedCount} bài viết của community ${doc._id}`);
      }
      await Community.deleteOne({ _id: doc._id });
      removed += 1;
    }
  }

  console.log(`Hoàn tất. Đã xóa ${removed} cộng đồng trùng.`);

  const cursor = Community.find();
  for await (const c of cursor) {
    const nk = normalizeCommunityKey(c.name);
    if (c.nameKey !== nk) {
      await Community.updateOne({ _id: c._id }, { $set: { nameKey: nk } });
    }
  }
  console.log("Đã đồng bộ nameKey cho mọi cộng đồng.");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});