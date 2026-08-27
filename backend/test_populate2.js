require('ts-node/register');
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb://bootskills:bootskills@169.58.74.138:27017/bootskills?authSource=admin&directConnection=true', { serverSelectionTimeoutMS: 8000 });
  require('./src/models/Course');
  const User = require('./src/models/User').User;
  const u = await User.findById('6a55588c6f73b805729c1b75').populate('enrolledCourses', 'title level category thumbnail modules').lean();
  const refs = u.enrolledCourses || [];
  console.log('populated refs:', refs.length);
  refs.forEach((c, i) => console.log(' ', i, '->', c ? (c.title || '<NO TITLE>') : '<NULL>'));
  await mongoose.disconnect();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
