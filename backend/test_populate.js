require('ts-node/register');
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true', { serverSelectionTimeoutMS: 8000 });
  const u = await mongoose.connection.collection('users').findOne({ username: 'alain_student' }, { enrolledCourses: 1 });
  const ids = (u.enrolledCourses || []).map(x => x.toString());
  const docs = await mongoose.connection.collection('courses').find({ _id: { $in: ids.map(i => new mongoose.Types.ObjectId(i)) } }, { title: 1 }).toArray();
  console.log('raw lookup: found', docs.length, 'of', ids.length);
  const found = new Set(docs.map(d => d._id.toString()));
  ids.forEach(i => { if (!found.has(i)) console.log('  MISSING:', i); });
  await mongoose.disconnect();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
