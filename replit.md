# Habit Heroes

## Overview

Habit Heroes is a gamified habit tracking application designed for children and parents. The app helps children build good daily habits through character-based games, missions, and rewards while providing parents with comprehensive monitoring and management capabilities. Children can create customizable hero avatars (robots, princesses, ninjas, animals), complete daily habit missions to earn XP and rewards, and track their progress through visual dashboards. Parents can manage habits, set up reward systems, monitor progress, and configure parental controls through a dedicated dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Single-page application using React 18 with TypeScript for type safety
- **Wouter for Routing**: Lightweight client-side routing library for navigation between pages
- **TanStack Query**: Server state management and caching for API interactions
- **Shadcn/ui Components**: Pre-built, accessible UI component library with Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens and theme variables
- **Responsive Design**: Mobile-first approach with custom breakpoints and device-specific layouts

### Backend Architecture
- **Express.js Server**: Node.js web framework handling API routes and middleware
- **TypeScript**: Full-stack type safety with shared schema definitions
- **RESTful API Design**: Structured endpoints following REST conventions for resource management
- **Session-based Authentication**: Express sessions with PostgreSQL storage for user authentication
- **Middleware Architecture**: Request logging, error handling, and authentication middleware

### Data Storage Solutions
- **PostgreSQL Database**: Primary data store using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database operations with automatic schema generation
- **Connection Pooling**: Efficient database connections using @neondatabase/serverless
- **Schema-first Design**: Centralized schema definitions in shared directory for consistency

### Authentication and Authorization
- **Replit Authentication**: OAuth integration using OpenID Connect with Replit's identity provider
- **Passport.js Integration**: Session management and authentication strategy handling
- **Parent-Child Relationships**: Hierarchical access control where parents manage children's data
- **Session Storage**: PostgreSQL-backed session storage with configurable TTL

### External Dependencies
- **Neon Database**: Serverless PostgreSQL hosting for data persistence
- **Replit Auth Services**: OAuth provider for user authentication and identity management
- **Unsplash API**: Avatar images and visual content for hero customization
- **Google Fonts**: Custom font loading (Fredoka One, Nunito) for child-friendly UI
- **Radix UI Primitives**: Accessible component foundations for complex UI elements

### Key Features
- **Gamification System**: XP, levels, streaks, and achievement tracking
- **Avatar Customization**: Multiple character types with unlockable gear and customizations
- **Habit Management**: CRUD operations for creating and managing daily habits
- **Reward System**: Parent-configured rewards with approval workflows
- **Progress Tracking**: Visual progress reports and analytics for both children and parents
- **Parental Controls**: Screen time limits, bedtime modes, and game access restrictions
- **Mini-Games Integration**: Planned educational game components for enhanced engagement