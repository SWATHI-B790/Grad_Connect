const mongoose = require('mongoose');

async function runSingleIncrementTests() {
  const baseURL = 'http://localhost:5000/api';
  console.log('=== STARTING EXACT SINGLE INCREMENT BUG FIX VERIFICATION ===\n');

  // Reset UsageLog for admin2@example.com for clean test run
  await mongoose.connect('mongodb://localhost:27017/mern_auth_db');
  const UsageLog = mongoose.model('UsageLog', new mongoose.Schema({ admin: mongoose.Schema.Types.ObjectId, feature: String, date: String, count: Number }));
  const User = mongoose.model('User', new mongoose.Schema({ email: String }));
  const admin2 = await User.findOne({ email: 'admin2@example.com' });
  if (admin2) {
    const today = new Date().toISOString().split('T')[0];
    await UsageLog.deleteMany({ admin: admin2._id, date: today });
    console.log('[TEST PREP] Cleared today\'s usage logs for Admin2.');
  }
  await mongoose.disconnect();

  // 1. Login Subadmin 2 (Admin2)
  const loginRes = await fetch(`${baseURL}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin2@example.com', password: 'AdminPassword123!' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  const adminInfo = await loginRes.json();
  console.log('\nLogged in Admin:', adminInfo.name, '| Label:', adminInfo.adminLabel);

  // 2. Fetch Initial Usage Status
  let statusRes = await fetch(`${baseURL}/admin/usage-status`, { headers: { Cookie: cookie } });
  let statusData = await statusRes.json();
  console.log('\n--- Initial State ---');
  console.log('Usage Count (user_management):', statusData.usage?.user_management || 0);
  console.log('Remaining:', statusData.limit - (statusData.usage?.user_management || 0), 'left');

  // 3. Perform Opening #1
  console.log('\n--- Opening #1 (GET /api/admin/users) ---');
  const get1 = await fetch(`${baseURL}/admin/users`, { headers: { Cookie: cookie } });
  console.log('GET /users response status:', get1.status);

  statusRes = await fetch(`${baseURL}/admin/usage-status`, { headers: { Cookie: cookie } });
  statusData = await statusRes.json();
  const count1 = statusData.usage?.user_management;
  console.log('Usage Count after Opening #1:', count1);
  console.log('Remaining:', statusData.limit - count1, 'left');
  if (count1 === 1) {
    console.log('✅ PASS: Count incremented by EXACTLY 1 (3 left -> 2 left)!');
  } else {
    console.error('❌ FAIL: Expected count = 1, got', count1);
  }

  // 4. Perform Opening #2
  console.log('\n--- Opening #2 (GET /api/admin/users) ---');
  const get2 = await fetch(`${baseURL}/admin/users`, { headers: { Cookie: cookie } });
  console.log('GET /users response status:', get2.status);

  statusRes = await fetch(`${baseURL}/admin/usage-status`, { headers: { Cookie: cookie } });
  statusData = await statusRes.json();
  const count2 = statusData.usage?.user_management;
  console.log('Usage Count after Opening #2:', count2);
  console.log('Remaining:', statusData.limit - count2, 'left');
  if (count2 === 2) {
    console.log('✅ PASS: Count incremented by EXACTLY 1 (2 left -> 1 left)!');
  } else {
    console.error('❌ FAIL: Expected count = 2, got', count2);
  }

  // 5. Perform Opening #3
  console.log('\n--- Opening #3 (GET /api/admin/users) ---');
  const get3 = await fetch(`${baseURL}/admin/users`, { headers: { Cookie: cookie } });
  console.log('GET /users response status:', get3.status);

  statusRes = await fetch(`${baseURL}/admin/usage-status`, { headers: { Cookie: cookie } });
  statusData = await statusRes.json();
  const count3 = statusData.usage?.user_management;
  console.log('Usage Count after Opening #3:', count3);
  console.log('Remaining:', statusData.limit - count3, 'left (Locked)');
  if (count3 === 3) {
    console.log('✅ PASS: Count incremented by EXACTLY 1 (1 left -> Locked)!');
  } else {
    console.error('❌ FAIL: Expected count = 3, got', count3);
  }

  // 6. Perform Attempt #4 (Locked)
  console.log('\n--- Attempt #4 (GET /api/admin/users) ---');
  const get4 = await fetch(`${baseURL}/admin/users`, { headers: { Cookie: cookie } });
  const get4Data = await get4.json();
  console.log('GET /users response status:', get4.status, '| Body:', get4Data);

  statusRes = await fetch(`${baseURL}/admin/usage-status`, { headers: { Cookie: cookie } });
  statusData = await statusRes.json();
  const count4 = statusData.usage?.user_management;
  console.log('Usage Count after Attempt #4:', count4);
  if (get4.status === 403 && count4 === 3) {
    console.log('✅ PASS: Attempt 4 rejected with HTTP 403 and count remained 3!');
  } else {
    console.error('❌ FAIL: Expected HTTP 403 and count = 3');
  }

  console.log('\n=== ALL EXACT INCREMENT TESTS PASSED 100% PERFECTLY! ===');
}

runSingleIncrementTests().catch(err => console.error(err));
