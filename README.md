# RPM - Rapid Product Management

A lightweight product management application built for Carl and Jerhon to manage tasks, documentation, and marketing activities.

## Features

- **Dashboard**: Get a quick overview of tasks, priorities, and upcoming events
- **Task Management**: Organize work with a Kanban-style board, priorities, and assignees
- **Documentation**: Store and manage product notes, research, and documentation
- **Marketing Planner**: Schedule and manage marketing campaigns on a calendar
- **Mobile First**: Optimized for Jerhon's on-the-go usage with responsive design

## Tech Stack

- **Frontend**: React with TypeScript, styled-components, and Vite
- **Backend**: Supabase for database, authentication, and storage
- **Hosting**: Vercel or AWS (future deployment)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/rpm.git
   cd rpm
   ```

2. Install frontend dependencies
   ```
   cd frontend
   npm install
   ```

3. Create environment variables
   ```
   cp .env.example .env
   ```
   
4. Update the `.env` file with your Supabase credentials

5. Start the development server
   ```
   npm run dev
   ```

## Project Structure

- `frontend/`: React application
  - `src/components/`: Reusable UI components
  - `src/pages/`: Page components
  - `src/contexts/`: React contexts for state management
  - `src/services/`: API and service integrations
  - `src/utils/`: Utility functions
  - `src/types/`: TypeScript type definitions

## Development Roadmap

1. **MVP Core Features**
   - Dashboard overview
   - Basic task management
   - Documentation storage
   - User authentication

2. **Phase 2**
   - Dynamic workflows
   - Marketing planner
   - Mobile optimizations

3. **Phase 3**
   - AI-powered features
   - Integrations with external services
   - Advanced analytics

## License

This project is private and not licensed for public use.