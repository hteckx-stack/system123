# **App Name**: BlueLink Admin Portal

## Core Features:

- Admin Authentication: Secure admin login via email and password using Firebase Authentication.
- Staff Account Creation: Create new staff accounts with name, phone, email, position, and department, generating temporary credentials.
- Credential Delivery: Automatically generate a temporary password and provide the phone number and password to the admin, so they may send it via SMS.
- Staff Data Management: Store and manage staff information (id, name, phone, email, position, department, photo, auth_uid, created_at, status) in Firestore.
- Staff Table: Sortable table showing all the relevant info for each employee including action buttons: edit, deactivate, send login reset.
- Task Management: Admin can assign tasks to staff members.
- Document Upload: Admins can upload and assign documents to specific staff members using Firebase Storage.

## Style Guidelines:

- Primary color: Deep blue (#0B5ED7) for a professional and trustworthy feel, as per the user request.
- Background color: Light desaturated blue (#D2E3FC) provides a calm and clean backdrop, complementing the primary color.
- Accent color: Slightly violet blue (#4A3DDA), positioned analogously to the primary on the color wheel, provides a vivid yet harmonious contrast.
- Body and headline font: 'Inter' sans-serif, with its modern and neutral aesthetic, provides excellent legibility and a clean corporate style.
- Sidebar: Dark blue portal style for clear navigation.
- Dashboard: Professional corporate dashboard look with overview cards.
- Icons: Professional, consistent icon set for navigation and actions.