# Student Record Management System (Web)

A client-side SRMS with roles, inline editing, import/export, and local persistence.

## Features

- Fields per student: Roll No, Name, Age, Course, Contact, Address, Guardian, Semester
- Inline edit, delete, search (by name/roll/course/address/guardian)
- Import from .txt/.csv with flexible formats:
  - v3: RollNo,Name,Age,Course,Contact,Address,Guardian,Semester
  - v2: RollNo,Name,Age,Course,Contact
  - v1: ID,Name,Age
- Export to CSV (v3 header)
- Roles: viewer (view only), staff (add/edit/delete), admin (all + import/export + manage users)
- Login with demo users (seeded on first run):
  - admin/admin123
  - staff/staff123
  - viewer/viewer123
- Account: change your password
- Manage Users (admin): add users, change roles, reset passwords
- Data persists in localStorage

## Run locally

```bash
python3 -m http.server 8000 --directory /workspace/website
# open http://localhost:8000
```

## Notes

- Security: credentials are stored locally in plaintext for demo purposes only.
- To reset app state, clear localStorage for the site from DevTools.