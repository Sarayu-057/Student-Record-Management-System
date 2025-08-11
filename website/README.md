# Student Record Management System (Web)

A simple client-side app to manage student records. Inspired by the Java console app in `StudentManagement.java` and `students.txt`.

## Features

- Add student with `ID`, `Name`, `Age`
- List and delete students
- Search by name (case-insensitive substring)
- Import from `.txt`/`.csv` (lines like `ID,Name,Age`)
- Export to CSV (`students.csv`)
- Data persists in browser `localStorage`

## Run locally

```bash
python3 -m http.server 8000 --directory /workspace/website
# open http://localhost:8000
```

## File format

- One record per line: `ID,Name,Age`
- Example:

```
S101,Alex,20
S102,Jamie,22
```

On import, duplicate IDs overwrite previous entries.

## Notes

- This is a static front-end only. No backend is required.
- To reset data, clear site data in the browser (localStorage) via DevTools.