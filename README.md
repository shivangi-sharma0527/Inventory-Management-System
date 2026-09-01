# Auspify HRMS – Employee Management System

Professional frontend-only Employee Management System built with **HTML, CSS and JavaScript only**.

## Included functionality

### Authentication
- Login
- Create account / Sign Up
- Forgot password / Reset password
- Remember-me session
- Sign out

### Dashboard
- Total employees
- Active employees
- Departments
- Employees on leave
- Workforce overview
- Department headcount
- Recently joined employees
- Quick actions

### Employees
- Add employee
- Edit employee
- View employee details
- Delete employee
- Search by name/email/phone/role/department/location
- Filter by department
- Filter by status
- Pagination
- CSV export

### Departments
- Add department
- Edit department
- Rename department (employee records are automatically updated)
- Delete department
- Prevent deletion when employees are still assigned
- Search departments
- Headcount per department

### Reports
- Workforce status summary
- Employment-type distribution
- Department headcount
- Status scope filter
- CSV export
- Print-ready report

### Profile & Settings
- View profile
- Edit profile
- Change password
- General settings
- Notification settings
- Security settings
- Compact table preference
- Reset demo data

## Demo login

- Email: `admin@auspify.com`
- Password: `Admin@123`

## Run

Open `index.html` directly in a browser or use VS Code Live Server.

## Important

This project deliberately uses only HTML/CSS/JavaScript, so authentication and HR data are stored in the browser's `localStorage`/`sessionStorage`. This makes the application fully interactive for a frontend project/demo, but it is **not a production-secure backend**. For real company deployment, connect the UI to a server/API and database with proper authentication, authorization, password hashing and audit logging.
