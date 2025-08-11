// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'students_v2';
  const AUTH_KEY = 'auth_user';

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

  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const authStatus = document.getElementById('auth-status');
  const loginModal = document.getElementById('login-modal');
  const loginForm = document.getElementById('login-form');
  const loginCancel = document.getElementById('login-cancel');

  // Auth
  function getUser() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch { return null; }
  }
  function setUser(user) { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); }
  function clearUser() { localStorage.removeItem(AUTH_KEY); }
  function isLoggedIn() { return Boolean(getUser()); }
  function hasAdminRole() { return getUser()?.role === 'admin'; }

  function applyAuthUI() {
    const user = getUser();
    authStatus.textContent = user ? `${user.role.toUpperCase()}: ${user.username}` : 'Logged out';
    loginBtn.hidden = Boolean(user);
    logoutBtn.hidden = !Boolean(user);

    const requiresAuth = document.querySelectorAll('.requires-auth');
    requiresAuth.forEach(el => el.disabled = !user);

    const adminOnly = document.querySelectorAll('.requires-role-admin');
    adminOnly.forEach(el => el.style.display = hasAdminRole() ? '' : 'none');
  }

  function showLogin() { loginModal.hidden = false; }
  function hideLogin() { loginModal.hidden = true; loginForm.reset(); }

  if (loginBtn) loginBtn.addEventListener('click', showLogin);
  if (loginCancel) loginCancel.addEventListener('click', hideLogin);
  if (logoutBtn) logoutBtn.addEventListener('click', () => { clearUser(); applyAuthUI(); });

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(loginForm);
      const username = String(data.get('username'));
      const password = String(data.get('password'));
      // Demo credentials
      if (username === 'admin' && password === 'admin123') {
        setUser({ username, role: 'admin' });
        hideLogin();
        applyAuthUI();
      } else if (username === 'staff' && password === 'staff123') {
        setUser({ username, role: 'staff' });
        hideLogin();
        applyAuthUI();
      } else {
        alert('Invalid credentials. Try admin/admin123 or staff/staff123');
      }
    });
  }

  // Data
  function migrateV1toV2(records) {
    // v1: { id, name, age } -> v2: { rollNo, name, age, course, contact }
    return records.map(r => ({
      rollNo: r.id ?? r.rollNo,
      name: r.name ?? '',
      age: r.age ?? '',
      course: r.course ?? '',
      contact: r.contact ?? ''
    })).filter(r => r.rollNo);
  }

  function loadStudents() {
    const v2 = localStorage.getItem(STORAGE_KEY);
    if (v2) {
      try { return JSON.parse(v2) || []; } catch { return []; }
    }
    // fallback migrate from v1 key 'students'
    const v1 = localStorage.getItem('students');
    if (v1) {
      try {
        const migrated = migrateV1toV2(JSON.parse(v1));
        saveStudents(migrated);
        return migrated;
      } catch { return []; }
    }
    return [];
  }

  function saveStudents(students) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }

  function normalize(text) { return String(text || '').trim(); }

  function addStudent(record) {
    if (!isLoggedIn()) throw new Error('Login required.');
    const students = loadStudents();
    const rollNo = normalize(record.rollNo);
    const name = normalize(record.name);
    const age = Number.parseInt(record.age, 10);
    const course = normalize(record.course);
    const contact = normalize(record.contact);
    if (!rollNo || !name || Number.isNaN(age) || age < 1 || !course || !contact) {
      throw new Error('Invalid input.');
    }
    const exists = students.some(s => String(s.rollNo) === rollNo);
    if (exists) throw new Error('Roll No already exists.');

    students.push({ rollNo, name, age, course, contact });
    students.sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo)));
    saveStudents(students);
    return students;
  }

  function updateStudent(rollNo, updates) {
    if (!isLoggedIn()) throw new Error('Login required.');
    const students = loadStudents();
    const idx = students.findIndex(s => String(s.rollNo) === String(rollNo));
    if (idx === -1) return students;
    const current = students[idx];
    const next = { ...current, ...updates };
    if (!next.rollNo) next.rollNo = current.rollNo; // prevent empty key
    if (String(next.rollNo) !== String(current.rollNo)) {
      // ensure new roll unique
      if (students.some((s, i) => i !== idx && String(s.rollNo) === String(next.rollNo))) {
        throw new Error('Roll No must be unique.');
      }
    }
    // basic validation
    next.name = normalize(next.name);
    next.course = normalize(next.course);
    next.contact = normalize(next.contact);
    next.age = Number.parseInt(next.age, 10);
    if (!next.name || !next.course || !next.contact || Number.isNaN(next.age) || next.age < 1) {
      throw new Error('Invalid values.');
    }

    students[idx] = next;
    students.sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo)));
    saveStudents(students);
    return students;
  }

  function deleteStudentByRoll(rollNo) {
    if (!isLoggedIn()) throw new Error('Login required.');
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
      String(s.course).toLowerCase().includes(q)
    );
  }

  function importFromText(text) {
    if (!hasAdminRole()) throw new Error('Admin only.');
    const current = loadStudents();
    const byRoll = new Map(current.map(s => [String(s.rollNo), s]));
    const lines = String(text).split(/\r?\n/);
    let imported = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(',');
      if (parts.length >= 5) {
        const [rollNoRaw, nameRaw, ageRaw, courseRaw, contactRaw] = parts;
        const rollNo = normalize(rollNoRaw);
        const name = normalize(nameRaw);
        const age = Number.parseInt(ageRaw, 10);
        const course = normalize(courseRaw);
        const contact = normalize(contactRaw);
        if (!rollNo || !name || Number.isNaN(age) || age < 1 || !course || !contact) continue;
        byRoll.set(rollNo, { rollNo, name, age, course, contact });
        imported += 1;
      } else if (parts.length >= 3) {
        // backward compat (id,name,age)
        const [idRaw, nameRaw, ageRaw] = parts;
        const rollNo = normalize(idRaw);
        const name = normalize(nameRaw);
        const age = Number.parseInt(ageRaw, 10);
        if (!rollNo || !name || Number.isNaN(age) || age < 1) continue;
        const prev = byRoll.get(rollNo) || { rollNo, name, age, course: '', contact: '' };
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
    const header = 'rollNo,name,age,course,contact';
    const lines = students.map(s => `${s.rollNo},${s.name},${s.age},${s.course},${s.contact}`);
    return [header, ...lines].join('\n');
  }

  // Rendering
  function createCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
  }

  function createEditableCell(value, key, rollNo) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.className = 'cell-input';
    input.value = String(value ?? '');
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
    // Allow only numbers for age
    if (key === 'age') input.type = 'number';
    td.appendChild(input);
    return td;
  }

  function renderTable(list) {
    tableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    const user = getUser();

    for (const s of list) {
      const tr = document.createElement('tr');

      tr.appendChild(createEditableCell(s.rollNo, 'rollNo', s.rollNo));
      tr.appendChild(createEditableCell(s.name, 'name', s.rollNo));
      tr.appendChild(createEditableCell(s.age, 'age', s.rollNo));
      tr.appendChild(createEditableCell(s.course, 'course', s.rollNo));
      tr.appendChild(createEditableCell(s.contact, 'contact', s.rollNo));

      const actionsTd = document.createElement('td');
      actionsTd.className = 'actions-col';

      const delBtn = document.createElement('button');
      delBtn.className = 'button small danger';
      delBtn.type = 'button';
      delBtn.textContent = 'Delete';
      delBtn.disabled = !user; // require login
      delBtn.addEventListener('click', () => {
        try {
          const next = deleteStudentByRoll(s.rollNo);
          updateView(next);
          tableStatus.textContent = `Deleted ${s.rollNo}.`;
        } catch (e) {
          alert(e.message || 'Failed to delete');
        }
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
    searchInput.addEventListener('input', () => {
      updateView();
    });
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
        } catch (e) {
          alert(e.message || 'Import failed');
        }
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
  applyAuthUI();
  updateView();
});