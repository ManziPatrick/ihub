// Probe: register a throwaway account on production, verify the JWT session
// works for authenticated queries, then clean up the account from the DB.
const fs = require('fs');
const mongoose = require('mongoose');

const API = 'https://api.bootskills.com/graphql';
const EMAIL = 'sessionprobe_' + Date.now() + '@test.io';

const gql = async (query, token) => {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify({ query }),
  });
  return res.json();
};

(async () => {
  // 1. Register
  const reg = await gql(`mutation { register(username: "sessionprobe", fullName: "Session Probe", email: "${EMAIL}", password: "Probe@12345") { token user { id role } } }`);
  const token = reg?.data?.register?.token;
  const uid = reg?.data?.register?.user?.id;
  console.log('register:', reg.errors ? 'ERROR ' + JSON.stringify(reg.errors).slice(0, 200) : 'OK token=' + (token ? token.slice(0, 25) + '…' : 'none') + ' uid=' + uid);

  if (!token) process.exit(1);

  // 2. me with token
  const me = await gql(`query { me { id email role } }`, token);
  console.log('me:', me.errors ? 'ERROR ' + JSON.stringify(me.errors).slice(0, 200) : 'OK ' + JSON.stringify(me.data.me));

  // 3. an authed resolver that throws Not authenticated when user missing
  const notif = await gql(`query { unreadNotificationCount }`, token);
  console.log('unreadNotificationCount:', notif.errors ? 'ERROR ' + JSON.stringify(notif.errors).slice(0, 200) : 'OK ' + JSON.stringify(notif.data));

  // 4. myPayments (auth-only)
  const pays = await gql(`query { myPayments { id } }`, token);
  console.log('myPayments:', pays.errors ? 'ERROR ' + JSON.stringify(pays.errors).slice(0, 200) : 'OK []');

  // 5. clean up: hard-delete the probe account from the DB
  if (uid) {
    const envRaw = fs.readFileSync(__dirname + '/.env', 'utf8');
    const env = Object.fromEntries(envRaw.split(/\r?\n/).filter(Boolean).filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    const oid = new mongoose.Types.ObjectId(uid);
    await db.collection('users').deleteOne({ _id: oid });
    await db.collection('studentprofiles').deleteMany({ userId: oid });
    await db.collection('notifications').deleteMany({ userId: oid });
    const left = await db.collection('users').countDocuments({ email: EMAIL });
    console.log('cleanup: probe account removed (remaining=' + left + ')');
    await mongoose.disconnect();
  }
  console.log('PROBE_DONE');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
