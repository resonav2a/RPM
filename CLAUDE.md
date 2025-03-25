# RPM Project Guidelines

## Build & Test Commands
- Setup project: `./start-dev.sh`
- Install dependencies: `cd frontend && npm install`
- Start development server: `cd frontend && npm run dev`
- Build production: `cd frontend && npm run build`
- Run linter: `cd frontend && npm run lint`
- Run type check: `cd frontend && npm run tsc`
- Run tests (when implemented): `cd frontend && npm test`

## Project Structure
- frontend/: React application with TypeScript
  - components/: Reusable UI components
  - pages/: Main page components
  - contexts/: React Context for state management
  - services/: API and external service integration
  - types/: TypeScript type definitions
  - utils/: Utility functions

## Dependencies
- React + TypeScript (Vite)
- react-router-dom: Routing
- @supabase/supabase-js: Database and authentication
- styled-components: Component styling
- react-icons: Icon library
- react-calendar: Calendar component

## Code Style Guidelines
- Use TypeScript for type safety with explicit type definitions
- Follow React functional component pattern with hooks
- Import order: React > external libraries > internal modules > types
- Naming: PascalCase for components, camelCase for variables/functions
- Error handling: use try/catch with appropriate error logging
- API calls: use async/await with proper error handling
- State management: React Context + hooks for global state
- Mobile-first responsive design approach

## Supabase Structure
- Authentication: Email magic link (passwordless)
- Tables:
  - tasks: Task management
  - documents: Wiki/documentation storage
  - campaigns: Marketing calendar events
  - templates: Workflow templates
  - user_profiles: User information

## Features
- Dashboard: Overview of tasks, priorities, and upcoming events
- Task Management: Kanban board with priorities and filters
- Documentation: Wiki-like system with public/private notes
- Marketing Planner: Calendar-based campaign scheduling
- Profile Management: User settings and preferences