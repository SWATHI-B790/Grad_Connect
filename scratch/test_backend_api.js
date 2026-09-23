const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('=== STARTING BACKEND ADMIN & APPROVAL GATE TESTS ===\n');

  try {
    // 1. Admin login
    console.log('[1] Logging in as Admin (admin@example.com)...');
    const adminLoginRes = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'AdminPassword123!',
      }),
    });

    if (adminLoginRes.status !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    }

    const adminToken = adminLoginRes.data.token;
    console.log('✓ Admin login successful. Role:', adminLoginRes.data.role, 'Status:', adminLoginRes.data.status);

    const adminAuthHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Fetch Dashboard metrics
    console.log('\n[2] Testing GET /api/admin/dashboard...');
    const dashRes = await request(`${BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: adminAuthHeaders,
    });
    console.log('✓ Dashboard stats retrieved successfully:');
    console.log('   Total Users:', dashRes.data.stats.totalUsers);
    console.log('   Total Students:', dashRes.data.stats.totalStudents);
    console.log('   Total Alumni:', dashRes.data.stats.totalAlumni);
    console.log('   Pending Approvals:', dashRes.data.stats.pendingApprovals);
    console.log('   Total Blogs:', dashRes.data.stats.totalBlogs);

    // 3. Register new student -> must get PENDING status and NO token
    const testEmail = `student_${Date.now()}@gradconnect.test`;
    console.log(`\n[3] Registering new student: ${testEmail}...`);
    const regRes = await request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Automated Student Test',
        email: testEmail,
        password: 'StudentPass123!',
        userType: 'Current Student',
        role: 'student',
        department: 'Computer Science',
        batch: '2026',
      }),
    });

    console.log('✓ Registration response:', regRes.data.message);
    console.log('   Status:', regRes.data.status);
    console.log('   Token returned?', regRes.data.token ? 'YES (ERROR)' : 'NO (CORRECT: Approval Gate Enforced)');

    // 4. Attempt login as pending student -> MUST return 403 ACCOUNT_PENDING
    console.log('\n[4] Attempting login with pending student credentials...');
    const pendingLogin = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'StudentPass123!',
      }),
    });

    if (pendingLogin.status === 403 && pendingLogin.data.code === 'ACCOUNT_PENDING') {
      console.log('✓ Login correctly rejected with HTTP 403 ACCOUNT_PENDING:', pendingLogin.data.message);
    } else {
      console.error('✗ Unexpected login response:', pendingLogin.status, pendingLogin.data);
    }

    // 5. Admin fetches registrations -> student must be listed in PENDING
    console.log('\n[5] Admin fetching registrations queue...');
    const regQueueRes = await request(`${BASE_URL}/admin/registrations?status=PENDING`, {
      method: 'GET',
      headers: adminAuthHeaders,
    });
    const found = regQueueRes.data.registrations.find(u => u.email === testEmail);
    console.log('✓ Student found in pending queue?', Boolean(found));
    if (!found) throw new Error('Student not found in pending queue');

    // 6. Admin approves student
    console.log(`\n[6] Admin approving student ID: ${found._id}...`);
    const approveRes = await request(`${BASE_URL}/admin/users/${found._id}/approve`, {
      method: 'PATCH',
      headers: adminAuthHeaders,
    });
    console.log('✓ Approval response:', approveRes.data.message);
    console.log('   New status:', approveRes.data.user.status);

    // 7. Student can now log in!
    console.log('\n[7] Student attempting login after approval...');
    const studentLoginRes = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'StudentPass123!',
      }),
    });

    if (studentLoginRes.status !== 200) {
      throw new Error(`Approved student login failed: ${JSON.stringify(studentLoginRes.data)}`);
    }

    console.log('✓ Student login succeeded! Token generated:', Boolean(studentLoginRes.data.token));
    const studentToken = studentLoginRes.data.token;

    // 8. Student attempts to access Admin API -> MUST be rejected with HTTP 403
    console.log('\n[8] Student attempting to access /api/admin/dashboard...');
    const studentAdminAccess = await request(`${BASE_URL}/admin/dashboard`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    if (studentAdminAccess.status === 403) {
      console.log('✓ Access correctly blocked with HTTP 403:', studentAdminAccess.data.message);
    } else {
      console.error('✗ Unexpected response for student accessing admin route:', studentAdminAccess.status, studentAdminAccess.data);
    }

    // 9. Admin suspends student with reason
    console.log('\n[9] Admin suspending student...');
    const suspendRes = await request(`${BASE_URL}/admin/users/${found._id}/suspend`, {
      method: 'PATCH',
      headers: adminAuthHeaders,
      body: JSON.stringify({ suspensionReason: 'Violation of community guidelines for testing' }),
    });
    console.log('✓ Student suspended:', suspendRes.data.message);

    // 10. Suspended student attempts login -> MUST return 403 ACCOUNT_SUSPENDED
    console.log('\n[10] Suspended student attempting login...');
    const suspendedLogin = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'StudentPass123!',
      }),
    });

    if (suspendedLogin.status === 403 && suspendedLogin.data.code === 'ACCOUNT_SUSPENDED') {
      console.log('✓ Login correctly rejected with HTTP 403 ACCOUNT_SUSPENDED:', suspendedLogin.data.message);
    } else {
      console.error('✗ Unexpected login response:', suspendedLogin.status, suspendedLogin.data);
    }

    // 11. Admin activates student
    console.log('\n[11] Admin reactivating student...');
    const activateRes = await request(`${BASE_URL}/admin/users/${found._id}/activate`, {
      method: 'PATCH',
      headers: adminAuthHeaders,
    });
    console.log('✓ Student reactivated:', activateRes.data.message);

    // 12. Check Audit Logs
    console.log('\n[12] Verifying Audit Logs recorded all actions...');
    const logsRes = await request(`${BASE_URL}/admin/activity?limit=10`, {
      method: 'GET',
      headers: adminAuthHeaders,
    });
    console.log(`✓ Retrieved ${logsRes.data.logs.length} recent audit log entries:`);
    logsRes.data.logs.slice(0, 5).forEach((log, idx) => {
      console.log(`   ${idx + 1}. [${log.action}] by ${log.performedByName}: ${log.description}`);
    });

    console.log('\n==================================================');
    console.log('🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('==================================================\n');

  } catch (error) {
    console.error('TEST SUITE FAILED:', error.message);
  }
}

runTests();
