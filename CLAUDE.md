# Menopause UK Consultation Platform

## Project Overview
A React-based web application for menopause consultations and assessments, built with TypeScript, Vite, and Supabase. The platform provides a multi-module consultation flow with payment integration via Stripe.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (database, auth, edge functions)
- **Payment**: Stripe
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query

## Key Features
- Multi-step consultation modules (Module1-6, SymptomsModule, HistoryModule, FinalizingModule)
- User authentication and protected routes
- Payment processing with Stripe
- PDF document generation
- Email notifications
- Progress tracking and breadcrumbs

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure
- `src/pages/` - Main application pages and modules
- `src/components/` - Reusable React components
- `src/components/ui/` - shadcn/ui component library
- `src/hooks/` - Custom React hooks
- `src/integrations/supabase/` - Supabase client and types
- `supabase/functions/` - Edge functions for backend logic
- `supabase/migrations/` - Database schema migrations

## Authentication & Payment Flow
The app uses Supabase auth with a complete payment flow including session verification, document generation, and email delivery upon successful payment.