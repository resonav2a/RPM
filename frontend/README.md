# RPM - Rapid Project Management

A comprehensive project management tool built with React, TypeScript, and Supabase. Designed to streamline task management, documentation, and marketing planning.

## Features

- **Task Management**: Kanban board with priority filtering
- **Documentation**: Wiki-like system with public/private notes
- **Marketing Planner**: Calendar-based campaign scheduling
- **Authentication**: Secure user authentication via Supabase
- **Profile Management**: User settings and preferences

## Technology Stack

- **Frontend**: React + TypeScript with Vite
- **Backend/Database**: Supabase
- **Styling**: styled-components
- **State Management**: React Context
- **Routing**: react-router-dom
- **Icons**: react-icons
- **Calendar**: react-calendar

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/rpm.git
cd rpm/frontend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials

4. Start the development server
```bash
npm run dev
```

## Supabase Setup

This application requires a Supabase backend for authentication and data storage. Follow these steps to set up your Supabase project:

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Get your project URL and anon key from Project Settings > API
3. Add these credentials to your `.env` file
4. Run the SQL from `supabase_setup.sql` in the Supabase SQL Editor to create the necessary tables and policies

### Database Tables

The application uses the following tables:

- `tasks`: Task management with status, priority, and tags
- `documents`: Wiki/documentation storage with visibility controls
- `campaigns`: Marketing calendar events and campaign details
- `templates`: Workflow templates for recurring tasks
- `user_profiles`: Extended user information and preferences

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run tsc` - Run TypeScript type checking
- `npm run serve` - Start development server accessible on local network
- `npm run preview` - Preview production build locally

## Deployment

### Option 1: Docker Deployment

This project includes Docker configuration for easy deployment:

1. Build and run the Docker container:
```bash
docker-compose up -d
```

2. Access the application at http://localhost:8080

3. For production deployment:
   - Update the `VITE_PUBLIC_URL` in `.env` file
   - Push the Docker image to your container registry
   - Deploy to your chosen cloud platform

### Option 2: Static Hosting (Netlify, Vercel, etc.)

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` directory to your chosen static hosting service:

#### Netlify CLI Deployment
```bash
npm install -g netlify-cli
netlify deploy
```

#### Vercel Deployment
```bash
npm install -g vercel
vercel
```

### Option 3: VPS or Cloud Provider

1. Set up a server with Nginx
2. Copy the `nginx.conf` to your server
3. Build the project and upload the `dist` directory to your server
4. Configure your domain and SSL certificates

## Accessing on Your Network

During development, you can make the app available to other devices on your network:

```bash
npm run serve
```

This will start the dev server accessible at your local IP address (eg. http://192.168.1.x:3000)
