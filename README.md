# Employee HR Admin Dashboard

A Next.js application for managing employee HR operations with Firebase backend.

## Features

- Employee management
- Leave request management
- Attendance tracking
- Document management
- Chat and messaging
- Task assignment
- Activity logging

## Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components:** Radix UI, Lucide Icons
- **Backend:** Firebase (Firestore, Realtime Database, Storage, Auth)
- **AI:** Google GenAI (Genkit)

## Getting Started

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:9002`

### Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Deployment

This application is ready to deploy on Node.js hosting platforms:

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will automatically detect Next.js and deploy
4. The `vercel.json` configuration is already included

### Other Platforms

The app is compatible with:
- **Railway**
- **Render**
- **Netlify** (with Netlify Functions)
- **Heroku**
- **DigitalOcean App Platform**

### Environment Variables

Currently, Firebase configuration is hardcoded. For production deployments, consider using environment variables by updating `src/firebase/config.ts` to use `process.env` variables.

## Firebase Setup

Make sure your Firebase project has:
- Firestore Database
- Realtime Database
- Storage
- Authentication

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
