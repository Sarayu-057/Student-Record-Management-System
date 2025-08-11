// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'students';

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

  const addForm = document.getElementById('add-form');
  const addStatus = document.getElementById('add-status');
  const tableBody = document.getElementById('students-tbody');
  const countSpan = document.getElementById('count');
  const tableStatus = document.getElementById('table-status');
  const searchInput = document.getElementById('search-input');
  const importInput = document.getElementById('import-file');
  const exportBtn = document.getElementById('export-btn');

  function loadStudents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Failed to parse storage', e);
      return [];
    }
  }

  function saveStudents(students) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }

  function toNormalizedName(name) {
    return String(name || '').trim();
  }

  function addStudent(record) {
    const students = loadStudents();
    const id = String(record.id).trim();
    const name = toNormalizedName(record.name);
    const age = Number.parseInt(record.age, 10);

    if (!id || !name || Number.isNaN(age) || age < 1) {
      throw new Error('Invalid input.');
    }
    const exists = students.some(s => String(s.id) === id);
    if (exists) {
      throw new Error('A student with this ID already exists.');
    }
    students.push({ id, name, age });
    students.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    saveStudents(students);
    return students;
  }

  function deleteStudentById(targetId) {
    const students = loadStudents();
    const next = students.filter(s => String(s.id) !== String(targetId));
    saveStudents(next);
    return next;
  }

  function searchByName(query) {
    const students = loadStudents();
    const q = String(query || '').toLowerCase();
    if (!q) return students;
    return students.filter(s => String(s.name).toLowerCase().includes(q));
  }

  function importFromText(text) {
    const students = loadStudents();
    const indexById = new Map(students.map(s => [String(s.id), s]));
    const lines = String(text).split(/\r?\n/);
    let imported = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(',');
      if (parts.length < 3) continue;
      const [idRaw, nameRaw, ageRaw] = parts;
      const id = String(idRaw).trim();
      const name = toNormalizedName(nameRaw);
      const age = Number.parseInt(ageRaw, 10);
      if (!id || !name || Number.isNaN(age) || age < 1) continue;
      indexById.set(id, { id, name, age });
      imported += 1;
    }
    const merged = Array.from(indexById.values()).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    saveStudents(merged);
    return { merged, imported };
  }

  function exportToCsv() {
    const students = loadStudents();
    const header = 'id,name,age';
    const lines = students.map(s => `${s.id},${s.name},${s.age}`);
    return [header, ...lines].join('\n');
  }

  function renderTable(list) {
    tableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (const s of list) {
      const tr = document.createElement('tr');

      const idTd = document.createElement('td');
      idTd.textContent = s.id;
      tr.appendChild(idTd);

      const nameTd = document.createElement('td');
      nameTd.textContent = s.name;
      tr.appendChild(nameTd);

      const ageTd = document.createElement('td');
      ageTd.textContent = String(s.age);
      tr.appendChild(ageTd);

      const actionsTd = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.className = 'button small danger';
      delBtn.type = 'button';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        const next = deleteStudentById(s.id);
        updateView(next);
        tableStatus.textContent = `Deleted student ${s.id}.`;
      });
      actionsTd.appendChild(delBtn);
      actionsTd.className = 'actions-col';
      tr.appendChild(actionsTd);

      fragment.appendChild(tr);
    }

    tableBody.appendChild(fragment);
    countSpan.textContent = String(loadStudents().length);
  }

  function updateView(currentList) {
    const list = currentList ?? searchByName(searchInput?.value || '');
    renderTable(list);
  }

  // Wire up Add form
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(addForm);
      try {
        const next = addStudent({
          id: formData.get('id'),
          name: formData.get('name'),
          age: formData.get('age')
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
        const text = String(reader.result || '');
        const { merged, imported } = importFromText(text);
        updateView(merged);
        tableStatus.textContent = `Imported ${imported} records. Total ${merged.length}.`;
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

  // Initial render
  updateView();
});