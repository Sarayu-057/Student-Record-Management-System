// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  // Storage keys
  const STUDENTS_KEY = 'students_v3';
  const AUTH_USER_KEY = 'auth_user';
  const USERS_KEY = 'srms_users_v1';

  // Basic UI hooks
  const toggleButton = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  if (toggleButton && navLinks) {
    toggleButton.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggleButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Elements
  const addForm = document.getElementById('add-form');
  const addStatus = document.getElementById('add-status');
  const tableBody = document.getElementById('students-tbody');
  const countSpan = document.getElementById('count');
  const tableStatus = document.getElementById('table-status');
  const searchInput = document.getElementById('search-input');
  const importInput = document.getElementById('import-file');
  const exportBtn = document.getElementById('export-btn');

  // Auth elements
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const usersBtn = document.getElementById('users-btn');
  const accountBtn = document.getElementById('account-btn');
  const authStatus = document.getElementById('auth-status');

  const loginModal = document.getElementById('login-modal');
  const loginForm = document.getElementById('login-form');
  const loginCancel = document.getElementById('login-cancel');

  const accountModal = document.getElementById('account-modal');
  const accountForm = document.getElementById('account-form');
  const accountCancel = document.getElementById('account-cancel');
  const accountStatus = document.getElementById('account-status');

  const usersModal = document.getElementById('users-modal');
  const addUserForm = document.getElementById('add-user-form');
  const usersClose = document.getElementById('users-close');
  const usersTbody = document.getElementById('users-tbody');

  // User management
  function loadUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      try { return JSON.parse(raw) || []; } catch { return []; }
    }
    // seed defaults on first run
    const defaults = [
      { username: 'admin', role: 'admin', password: 'admin123' },
      { username: 'staff', role: 'staff', password: 'staff123' },
      { username: 'viewer', role: 'viewer', password: 'viewer123' }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY)) || null; } catch { return null; }
  }
  function setUser(user) { localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)); }
  function clearUser() { localStorage.removeItem(AUTH_USER_KEY); }
  function isLoggedIn() { return Boolean(getUser()); }
  function userRole() { return getUser()?.role || 'viewer'; }
  function isAdmin() { return userRole() === 'admin'; }
  function canMutate() { return ['admin','staff'].includes(userRole()); }

  function applyAuthUI() {
    const user = getUser();
    authStatus.textContent = user ? `${user.role.toUpperCase()}: ${user.username}` : 'Logged out';
    loginBtn.hidden = Boolean(user);
    logoutBtn.hidden = !Boolean(user);
    accountBtn.hidden = !Boolean(user);
    usersBtn.hidden = !isAdmin();

    // Enable/disable mutation controls
    document.querySelectorAll('.requires-auth').forEach(el => {
      el.disabled = !canMutate();
    });
    document.querySelectorAll('.requires-role-admin').forEach(el => {
      el.style.display = isAdmin() ? '' : 'none';
    });

    // Disable inline editors for viewers
    document.querySelectorAll('.cell-input').forEach(input => {
      input.disabled = !canMutate();
    });
  }

  function openModal(modal) { modal.hidden = false; }
  function closeModal(modal) { modal.hidden = true; }

  if (loginBtn) loginBtn.addEventListener('click', () => openModal(loginModal));
  if (loginCancel) loginCancel.addEventListener('click', () => closeModal(loginModal));
  if (logoutBtn) logoutBtn.addEventListener('click', () => { clearUser(); applyAuthUI(); updateView(); });
  if (accountBtn) accountBtn.addEventListener('click', () => openModal(accountModal));
  if (accountCancel) accountCancel.addEventListener('click', () => closeModal(accountModal));
  if (usersBtn) usersBtn.addEventListener('click', () => { if (isAdmin()) { renderUsers(); openModal(usersModal); } });
  if (usersClose) usersClose.addEventListener('click', () => closeModal(usersModal));

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(loginForm);
      const username = String(data.get('username'));
      const password = String(data.get('password'));
      const users = loadUsers();
      const found = users.find(u => u.username === username && u.password === password);
      if (found) {
        setUser({ username: found.username, role: found.role });
        closeModal(loginModal);
        applyAuthUI();
        updateView();
      } else {
        alert('Invalid credentials.');
      }
    });
  }

  if (accountForm) {
    accountForm.addEventListener('submit', (e) => {
      e.preventDefault();
      accountStatus.textContent = '';
      const me = getUser();
      if (!me) return;
      const form = new FormData(accountForm);
      const oldPassword = String(form.get('oldPassword'));
      const newPassword = String(form.get('newPassword'));
      const confirmPassword = String(form.get('confirmPassword'));
      if (newPassword !== confirmPassword) { accountStatus.textContent = 'Passwords do not match.'; return; }
      const users = loadUsers();
      const idx = users.findIndex(u => u.username === me.username);
      if (idx === -1) { accountStatus.textContent = 'User not found.'; return; }
      if (users[idx].password !== oldPassword) { accountStatus.textContent = 'Old password incorrect.'; return; }
      users[idx].password = newPassword;
      saveUsers(users);
      accountStatus.textContent = 'Password changed.';
      setTimeout(() => { accountStatus.textContent = ''; closeModal(accountModal); accountForm.reset(); }, 1000);
    });
  }

  if (addUserForm) {
    addUserForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!isAdmin()) { alert('Admin only'); return; }
      const data = new FormData(addUserForm);
      const username = String(data.get('username')).trim();
      const password = String(data.get('password'));
      const role = String(data.get('role'));
      if (!username || !password) return;
      const users = loadUsers();
      if (users.some(u => u.username === username)) { alert('Username already exists'); return; }
      users.push({ username, password, role });
      saveUsers(users);
      addUserForm.reset();
      renderUsers();
    });
  }

  function renderUsers() {
    if (!isAdmin()) return;
    const users = loadUsers();
    const me = getUser();
    usersTbody.innerHTML = '';
    for (const u of users) {
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      nameTd.textContent = u.username;
      tr.appendChild(nameTd);

      const roleTd = document.createElement('td');
      const select = document.createElement('select');
      ['viewer','staff','admin'].forEach(r => {
        const opt = document.createElement('option');
        opt.value = r; opt.textContent = r; if (r === u.role) opt.selected = true; select.appendChild(opt);
      });
      select.addEventListener('change', () => {
        const users = loadUsers();
        const idx = users.findIndex(x => x.username === u.username);
        users[idx].role = select.value;
        saveUsers(users);
        if (me && me.username === u.username) { setUser({ username: me.username, role: select.value }); applyAuthUI(); updateView(); }
      });
      if (u.username === 'admin') select.disabled = true; // protect default admin
      roleTd.appendChild(select);
      tr.appendChild(roleTd);

      const actionsTd = document.createElement('td');
      const resetBtn = document.createElement('button');
      resetBtn.className = 'button small';
      resetBtn.textContent = 'Reset Password';
      resetBtn.addEventListener('click', () => {
        const users = loadUsers();
        const idx = users.findIndex(x => x.username === u.username);
        users[idx].password = 'password123';
        saveUsers(users);
        alert(`Password for ${u.username} reset to password123`);
      });
      actionsTd.appendChild(resetBtn);
      tr.appendChild(actionsTd);

      usersTbody.appendChild(tr);
    }
  }

  // Students data and migration
  function migrateV1toV2(records) {
    return records.map(r => ({ rollNo: r.id ?? r.rollNo, name: r.name ?? '', age: r.age ?? '', course: r.course ?? '', contact: r.contact ?? '' }))
      .filter(r => r.rollNo);
  }
  function migrateV2toV3(records) {
    return records.map(r => ({
      rollNo: r.rollNo,
      name: r.name ?? '',
      age: r.age ?? '',
      course: r.course ?? '',
      contact: r.contact ?? '',
      address: r.address ?? '',
      guardian: r.guardian ?? '',
      semester: r.semester ?? ''
    }));
  }
  function loadStudents() {
    const v3 = localStorage.getItem(STUDENTS_KEY);
    if (v3) { try { return JSON.parse(v3) || []; } catch { return []; } }
    const v2raw = localStorage.getItem('students_v2');
    if (v2raw) {
      try { const v2 = JSON.parse(v2raw) || []; const migrated = migrateV2toV3(v2); saveStudents(migrated); return migrated; } catch { return []; }
    }
    const v1raw = localStorage.getItem('students');
    if (v1raw) {
      try { const v1 = JSON.parse(v1raw) || []; const v2 = migrateV1toV2(v1); const v3m = migrateV2toV3(v2); saveStudents(v3m); return v3m; } catch { return []; }
    }
    return [];
  }
  function saveStudents(students) { localStorage.setItem(STUDENTS_KEY, JSON.stringify(students)); }

  function normalize(x) { return String(x || '').trim(); }
  function parseIntOrEmpty(x) { const n = Number.parseInt(x, 10); return Number.isNaN(n) ? '' : n; }

  function addStudent(record) {
    if (!canMutate()) throw new Error('Login required.');
    const students = loadStudents();
    const rollNo = normalize(record.rollNo);
    const name = normalize(record.name);
    const age = Number.parseInt(record.age, 10);
    const course = normalize(record.course);
    const contact = normalize(record.contact);
    const address = normalize(record.address);
    const guardian = normalize(record.guardian);
    const semester = record.semester === '' ? '' : Number.parseInt(record.semester, 10);
    if (!rollNo || !name || Number.isNaN(age) || age < 1 || !course || !contact) {
      throw new Error('Invalid input.');
    }
    if (semester !== '' && (Number.isNaN(semester) || semester < 1 || semester > 12)) {
      throw new Error('Semester must be 1-12.');
    }
    if (students.some(s => String(s.rollNo) === rollNo)) throw new Error('Roll No already exists.');
    students.push({ rollNo, name, age, course, contact, address, guardian, semester });
    students.sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo)));
    saveStudents(students);
    return students;
  }

  function updateStudent(rollNo, updates) {
    if (!canMutate()) throw new Error('Login required.');
    const students = loadStudents();
    const idx = students.findIndex(s => String(s.rollNo) === String(rollNo));
    if (idx === -1) return students;
    const current = students[idx];
    const next = { ...current, ...updates };
    next.rollNo = normalize(next.rollNo) || current.rollNo;
    if (String(next.rollNo) !== String(current.rollNo)) {
      if (students.some((s, i) => i !== idx && String(s.rollNo) === String(next.rollNo))) {
        throw new Error('Roll No must be unique.');
      }
    }
    next.name = normalize(next.name);
    next.course = normalize(next.course);
    next.contact = normalize(next.contact);
    next.address = normalize(next.address);
    next.guardian = normalize(next.guardian);
    next.age = Number.parseInt(next.age, 10);
    if (!next.name || !next.course || !next.contact || Number.isNaN(next.age) || next.age < 1) {
      throw new Error('Invalid values.');
    }
    if (next.semester !== '' && next.semester != null) {
      const sem = Number.parseInt(next.semester, 10);
      if (Number.isNaN(sem) || sem < 1 || sem > 12) throw new Error('Semester must be 1-12.');
      next.semester = sem;
    } else {
      next.semester = '';
    }
    students[idx] = next;
    students.sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo)));
    saveStudents(students);
    return students;
  }

  function deleteStudentByRoll(rollNo) {
    if (!canMutate()) throw new Error('Login required.');
    const students = loadStudents();
    const next = students.filter(s => String(s.rollNo) !== String(rollNo));
    saveStudents(next);
    return next;
  }

  function searchRecords(query) {
    const students = loadStudents();
    const q = normalize(query).toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      String(s.name).toLowerCase().includes(q) ||
      String(s.rollNo).toLowerCase().includes(q) ||
      String(s.course).toLowerCase().includes(q) ||
      String(s.address).toLowerCase().includes(q) ||
      String(s.guardian).toLowerCase().includes(q)
    );
  }

  function importFromText(text) {
    if (!isAdmin()) throw new Error('Admin only.');
    const current = loadStudents();
    const byRoll = new Map(current.map(s => [String(s.rollNo), s]));
    const lines = String(text).split(/\r?\n/);
    let imported = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(',');
      if (parts.length >= 8) {
        const [rollNoRaw, nameRaw, ageRaw, courseRaw, contactRaw, addressRaw, guardianRaw, semesterRaw] = parts;
        const rollNo = normalize(rollNoRaw);
        const name = normalize(nameRaw);
        const age = Number.parseInt(ageRaw, 10);
        const course = normalize(courseRaw);
        const contact = normalize(contactRaw);
        const address = normalize(addressRaw);
        const guardian = normalize(guardianRaw);
        const semVal = normalize(semesterRaw);
        const semester = semVal === '' ? '' : Number.parseInt(semVal, 10);
        if (!rollNo || !name || Number.isNaN(age) || age < 1 || !course || !contact) continue;
        if (semester !== '' && (Number.isNaN(semester) || semester < 1 || semester > 12)) continue;
        byRoll.set(rollNo, { rollNo, name, age, course, contact, address, guardian, semester });
        imported += 1;
      } else if (parts.length >= 5) {
        // v2: rollNo,name,age,course,contact
        const [rollNoRaw, nameRaw, ageRaw, courseRaw, contactRaw] = parts;
        const rollNo = normalize(rollNoRaw);
        const name = normalize(nameRaw);
        const age = Number.parseInt(ageRaw, 10);
        const course = normalize(courseRaw);
        const contact = normalize(contactRaw);
        if (!rollNo || !name || Number.isNaN(age) || age < 1 || !course || !contact) continue;
        const prev = byRoll.get(rollNo) || { rollNo, name, age, course, contact, address: '', guardian: '', semester: '' };
        byRoll.set(rollNo, { ...prev, rollNo, name, age, course, contact });
        imported += 1;
      } else if (parts.length >= 3) {
        // v1: id,name,age
        const [idRaw, nameRaw, ageRaw] = parts;
        const rollNo = normalize(idRaw);
        const name = normalize(nameRaw);
        const age = Number.parseInt(ageRaw, 10);
        if (!rollNo || !name || Number.isNaN(age) || age < 1) continue;
        const prev = byRoll.get(rollNo) || { rollNo, name, age, course: '', contact: '', address: '', guardian: '', semester: '' };
        byRoll.set(rollNo, { ...prev, rollNo, name, age });
        imported += 1;
      }
    }
    const merged = Array.from(byRoll.values()).sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo)));
    saveStudents(merged);
    return { merged, imported };
  }

  function exportToCsv() {
    const students = loadStudents();
    const header = 'rollNo,name,age,course,contact,address,guardian,semester';
    const lines = students.map(s => `${s.rollNo},${s.name},${s.age},${s.course},${s.contact},${s.address},${s.guardian},${s.semester}`);
    return [header, ...lines].join('\n');
  }

  // Rendering
  function createEditableCell(value, key, rollNo) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.className = 'cell-input';
    input.value = String(value ?? '');
    if (key === 'age' || key === 'semester') input.type = 'number';
    input.disabled = !canMutate();
    input.addEventListener('change', () => {
      try {
        const updates = { [key]: input.value };
        const next = updateStudent(rollNo, updates);
        updateView(next);
        tableStatus.textContent = 'Saved.';
      } catch (e) {
        alert(e.message || 'Failed to save');
        updateView();
      }
    });
    td.appendChild(input);
    return td;
  }

  function renderTable(list) {
    tableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (const s of list) {
      const tr = document.createElement('tr');
      tr.appendChild(createEditableCell(s.rollNo, 'rollNo', s.rollNo));
      tr.appendChild(createEditableCell(s.name, 'name', s.rollNo));
      tr.appendChild(createEditableCell(s.age, 'age', s.rollNo));
      tr.appendChild(createEditableCell(s.course, 'course', s.rollNo));
      tr.appendChild(createEditableCell(s.contact, 'contact', s.rollNo));
      tr.appendChild(createEditableCell(s.address, 'address', s.rollNo));
      tr.appendChild(createEditableCell(s.guardian, 'guardian', s.rollNo));
      tr.appendChild(createEditableCell(s.semester, 'semester', s.rollNo));

      const actionsTd = document.createElement('td');
      actionsTd.className = 'actions-col';
      const delBtn = document.createElement('button');
      delBtn.className = 'button small danger';
      delBtn.type = 'button';
      delBtn.textContent = 'Delete';
      delBtn.disabled = !canMutate();
      delBtn.addEventListener('click', () => {
        try {
          const next = deleteStudentByRoll(s.rollNo);
          updateView(next);
          tableStatus.textContent = `Deleted ${s.rollNo}.`;
        } catch (e) { alert(e.message || 'Failed to delete'); }
      });
      actionsTd.appendChild(delBtn);
      tr.appendChild(actionsTd);

      fragment.appendChild(tr);
    }

    tableBody.appendChild(fragment);
    countSpan.textContent = String(loadStudents().length);
  }

  function updateView(currentList) {
    const list = currentList ?? searchRecords(searchInput?.value || '');
    renderTable(list);
    applyAuthUI();
  }

  // Wire up Add form
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(addForm);
      try {
        const next = addStudent({
          rollNo: formData.get('rollNo'),
          name: formData.get('name'),
          age: formData.get('age'),
          course: formData.get('course'),
          contact: formData.get('contact'),
          address: formData.get('address'),
          guardian: formData.get('guardian'),
          semester: formData.get('semester'),
        });
        addForm.reset();
        addStatus.textContent = 'Student added.';
        updateView(next);
      } catch (err) {
        addStatus.textContent = err.message || 'Failed to add student.';
      }
      setTimeout(() => { addStatus.textContent = ''; }, 2000);
    });
  }

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', () => { updateView(); });
  }

  // Import
  if (importInput) {
    importInput.addEventListener('change', () => {
      const file = importInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || '');
          const { merged, imported } = importFromText(text);
          updateView(merged);
          tableStatus.textContent = `Imported ${imported} records. Total ${merged.length}.`;
        } catch (e) { alert(e.message || 'Import failed'); }
        importInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  // Export
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const csv = exportToCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'students.csv';
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  // Init
  loadUsers();
  applyAuthUI();
  updateView();
});