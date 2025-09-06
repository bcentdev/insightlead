# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InsightLead** is a tech lead management application built with React, TypeScript, and a clean hexagonal architecture following Domain-Driven Design (DDD) principles. The application helps tech leads track team performance, manage objectives, and integrate with GitHub and Jira for comprehensive team insights.

### Current Status: 85% MVP Complete
- ✅ Full dashboard with GitHub/Jira KPIs and customizable widgets
- ✅ Complete team and peer management (CRUD)
- ✅ Objective tracking with progress monitoring
- ✅ Robust GitHub integration (PRs, commits, reviews)
- ✅ Comprehensive Jira integration (issues, sprints, cycle time)
- ✅ Repository management and settings configuration
- ✅ Responsive UI with advanced filtering and search
- 🚧 Missing: Authentication system (critical), test coverage (0 tests), error boundaries
- 🔮 Future: Notifications, automated sync, multi-tenancy, export/import

### Architecture Strengths
- Follows hexagonal architecture with DDD principles
- 98 TypeScript files with proper domain separation
- Functional programming patterns throughout
- IndexedDB persistence with mock data support

## 🚀 Deployment Strategy: Dual Version Approach

### Version 1: Open Source (GitHub/Vercel)
- **Repository**: Public GitHub repo
- **Hosting**: GitHub Pages or Vercel (free)
- **Database**: IndexedDB (local browser storage)
- **Target**: Developers, small teams, self-hosted solutions
- **Features**: Full core functionality without cloud features

### Version 2: Cloud Premium (Cloudflare)
- **Hosting**: Cloudflare Pages (app.insightlead.com)
- **Database**: Cloudflare D1 (serverless SQLite)
- **Auth**: Multi-user with JWT + D1
- **Target**: Companies, larger teams
- **Features**: Core + premium cloud features

## 💰 Monetization Strategy

### 🆓 Open Source Features
- Complete dashboard with GitHub/Jira integrations
- Team and peer management
- Objective tracking
- Local data storage only
- Single-user focused

### 💎 Cloud Pro ($9/month/team)
- Multi-user authentication
- Cloud sync and backup
- Team collaboration
- Email notifications
- Data export capabilities

### 🚀 Cloud Enterprise ($29/month/team)
- Advanced analytics & reports
- SSO integration
- API access
- Custom integrations
- Priority support

## 🏗️ Implementation Plan

### Next Critical Steps (Priority Order)
1. **Authentication System** (1-2 weeks)
   - Simple JWT-based auth for cloud version
   - User management and team association
   - Route protection

2. **Deployment Mode Abstraction** (3-4 days)
   ```typescript
   // Factory pattern for switching between IndexedDB and Cloudflare D1
   const repositories = createRepositories(deploymentMode);
   ```

3. **Test Coverage** (1 week)
   - Unit tests for domain entities
   - Integration tests for use cases
   - Component tests for critical UI

4. **Dual Build Configuration** (2-3 days)
   ```bash
   bun run build:local      # IndexedDB version
   bun run build:cloud      # Cloudflare D1 version
   ```

### Technical Implementation Details

#### Environment Configuration
```typescript
// .env.local (Open Source)
VITE_DEPLOYMENT_MODE=local
VITE_USE_INDEXEDDB=true
VITE_ENABLE_AUTH=false

// .env.production (Cloud)
VITE_DEPLOYMENT_MODE=cloud
VITE_USE_CLOUDFLARE_D1=true
VITE_ENABLE_AUTH=true
```

#### Repository Factory Pattern
```typescript
export const createRepositories = () => {
  const isCloudVersion = import.meta.env.VITE_DEPLOYMENT_MODE === 'cloud';
  
  if (isCloudVersion) {
    return {
      peerRepository: new CloudPeerRepository(),
      teamRepository: new CloudTeamRepository(),
      authRepository: new CloudAuthRepository(),
    };
  }
  
  return {
    peerRepository: new IndexedDBPeerRepository(),
    teamRepository: new IndexedDBTeamRepository(),
    authRepository: new LocalAuthRepository(),
  };
};
```

## 📈 Go-to-Market Strategy
- **Open Source First**: Build community and credibility
- **Freemium Conversion**: Local users upgrade to cloud for collaboration
- **Developer-to-Enterprise**: Individual devs introduce to their companies
- **SEO & Community**: GitHub stars, developer content, conference talks

## Environment Variables

The application supports the following environment variables:

- `VITE_USE_MOCK_DATA`: Set to `'true'` to use mock data instead of persistent storage
  - In development (`.env.development`): defaults to `false`
  - In production: defaults to `false`
- `VITE_SEED_INDEXEDDB`: Set to `'true'` to seed IndexedDB with sample data for development
  - In development (`.env.development`): defaults to `false`
  - In production: should always be `false`

## Development Commands

### Start development server
```bash
npm run dev
# or with bun (recommended)
bun dev
```

### Build for production
```bash
npm run build
```
Note: Build includes TypeScript compilation (`tsc`) followed by Vite build.

### Lint code
```bash
npm run lint
```
Uses oxlint for fast linting with React, TypeScript, and accessibility rules.

### Run tests
```bash
npm run test
npm run test:ui  # For test UI
```

### Preview production build
```bash
npm run preview
```

## Architecture

This project follows **Hexagonal Architecture** with **Domain-Driven Design** principles:

### File Structure
```
src/
├── domain/                      # Core business logic
│   ├── entities/                # Business entities (Peer, Objective, Metric, Team)
│   ├── value-objects/           # Value objects (GitHubUsername, ObjectiveProgress)
│   ├── repositories/            # Repository interfaces (ports)
│   └── services/                # Domain services
├── application/                 # Application layer
│   ├── use-cases/               # Business use cases
│   └── ports/                   # Application ports (GitHub, Jira)
├── infrastructure/              # External concerns
│   ├── adapters/                # External API adapters
│   └── repositories/            # Repository implementations
└── presentation/                # UI layer
    ├── components/              # React components
    ├── pages/                   # Page components
    ├── hooks/                   # Custom React hooks
    └── providers/               # Context providers
```

### Key Entities

- **Peer**: Team member with GitHub/Jira integration
- **Objective**: Trackable goals with progress monitoring
- **Metric**: Performance data from GitHub/Jira
- **Team**: Group of peers with leadership structure

### Routing
- `/` - Dashboard with team overview
- `/peers` - Team members management
- `/objectives` - Objectives tracking
- `/settings` - Configuration

### Styling System
- **Tailwind CSS** for utility-first styling
- **HeroUI v2** component library for modern UI components
- **Lucide React** for consistent iconography
- **Tailwind Variants** for component variations
- **Framer Motion** for smooth animations

### Key Dependencies

#### Core Framework
- **React 18** + **TypeScript** for type-safe development
- **Vite** for fast development and building
- **React Router DOM** for client-side routing

#### UI & Styling
- **HeroUI v2** (2.x) - Modern React component library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful & consistent icons
- **Framer Motion** - Animation library

#### External Integrations
- **@octokit/rest** - GitHub API client
- **Custom Jira client** - Jira API integration

#### State Management
- **Zustand** - Lightweight state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation

#### Utilities
- **date-fns** - Date manipulation
- **uuid** - Unique ID generation
- **clsx** - Conditional classes

## Domain Logic

### Core Concepts

1. **Team Management**: Track team members, roles, and hierarchies
2. **Objective Setting**: Create, track, and measure goals
3. **Performance Metrics**: Collect data from GitHub and Jira
4. **Progress Tracking**: Monitor completion rates and trends

### Business Rules

- Peers must belong to a team
- Objectives have progress tracking (0-100%)
- Metrics are sourced from GitHub and Jira APIs
- Team leads can view all team member data

## API Integration

### GitHub Integration
- Pull requests, commits, and code reviews
- Repository activity and contribution metrics
- User profile and avatar information

### Jira Integration
- Story completion and cycle time
- Bug fixes and task completion
- Sprint and project tracking

## Development Patterns

### Functional Programming Guidelines
**CRITICAL: Always use functional programming patterns - NO interfaces, enums, or classes**

#### Type Definitions
- Use `type` instead of `interface` for all type definitions
- Use union types (`'option1' | 'option2'`) instead of enums
- Use type aliases for complex types
- Prefer composition over inheritance

#### Function Structure
- Use pure functions wherever possible
- Prefer function declarations or arrow functions over class methods
- Use currying and higher-order functions for reusability
- Implement data transformations using map, filter, reduce

#### Examples:
```typescript
// ✅ Good - Use types and union types
type PRState = 'open' | 'closed' | 'merged';
type PRMetrics = {
  readonly totalPRs: number;
  readonly mergedPRs: number;
  readonly openPRs: number;
};

// ❌ Bad - Don't use interfaces or enums
interface PRMetrics { ... }
enum PRState { ... }

// ✅ Good - Pure functions
const calculateMergeRate = (totalPRs: number, mergedPRs: number): number =>
  totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;

// ❌ Bad - Classes with methods
class PRCalculator { ... }
```

### Component Structure
Follow the established patterns from the performance-dashboard reference:
- Metric cards with gradients and icons
- Progress bars for completion tracking
- Table components for data display
- Modal patterns for forms and details
- Use functional components with hooks only

### State Management
- Use Zustand for global state
- React hooks for local component state
- Form state with React Hook Form + Zod validation
- State updates through pure functions

### Error Handling
- Graceful fallbacks for API failures
- Loading states for async operations
- User-friendly error messages

## Testing Strategy

- **Unit tests** for domain entities and value objects
- **Integration tests** for use cases and adapters
- **Component tests** for React components
- **E2E tests** for critical user journeys

## Important Notes

- **Hexagonal Architecture**: Dependencies point inward toward the domain
- **DDD Principles**: Rich domain models with business logic
- **TypeScript**: Strict type checking enabled
- **Clean Code**: SOLID principles and clear separation of concerns
- **API Integration**: Rate limiting and error handling for external APIs
- **Security**: No secrets in repository, use environment variables
- uso bun para todo, no npm o yarn