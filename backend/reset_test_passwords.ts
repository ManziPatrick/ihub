import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Reset passwords for the standard test accounts so the role test suite can log in.
(async () => {
  await mongoose.connect('mongodb://localhost:27017/bootskills', { serverSelectionTimeoutMS: 8000 });
  const hash = await bcrypt.hash('Password@123', 12);
  const col = mongoose.connection.collection('users');
  const targets = [
    'superadmin@bootskills.com',
    'admin@bootskills.com',
    'jonakarisa@gmail.com',
    'trainer@bootskills.com',
    'second_admin',
  ];
  const r = await col.updateMany({ email: { $in: targets } }, { $set: { password: hash } });
  console.log('reset OK — matched:', r.matchedCount, 'modified:', r.modifiedCount);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
