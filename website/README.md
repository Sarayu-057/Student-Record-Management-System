# Student Record Management System (Web)

A simple client-side app to manage student records. Inspired by the Java console app in `StudentManagement.java` and `students.txt`.

## Features

- Add student with fields: `Roll No`, `Name`, `Age`, `Course`, `Contact`
- Inline edit existing records (all fields)
- Delete student record
- Search by name, roll number, or course
- Import from `.txt`/`.csv` (lines like `RollNo,Name,Age,Course,Contact`; falls back to `ID,Name,Age`)
- Export to CSV (`students.csv`)
- Login: demo users
  - admin/admin123 (can import/export)
  - staff/staff123
- Data persists in browser `localStorage`

## Run locally

```bash
python3 -m http.server 8000 --directory /workspace/website
# open http://localhost:8000
```

## File format

- Preferred: `RollNo,Name,Age,Course,Contact`
- Backward compatible: `ID,Name,Age`
- Example:

```
R1001,Alex Johnson,20,BSc CS,alex@example.com
R1002,Jamie Lee,22,BCom,555-123-9876
```

On import, duplicate roll numbers overwrite previous entries.

## Notes

- Mutations (add/edit/delete) require login. Import/Export require admin role.
- To reset data, clear site data in the browser (localStorage) via DevTools.