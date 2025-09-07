# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InsightLead** is a tech lead management application built with React, TypeScript, and a clean hexagonal architecture following Domain-Driven Design (DDD) principles. The application helps tech leads track team performance, manage objectives, and integrate with GitHub and Jira for comprehensive team insights.

### Current Status: 100% MVP Complete ✅
- ✅ Full dashboard with GitHub/Jira KPIs and customizable widgets
- ✅ Complete team and peer management (CRUD)
- ✅ Objective tracking with progress monitoring
- ✅ Robust GitHub integration (PRs, commits, reviews)
- ✅ Comprehensive Jira integration (issues, sprints, cycle time)
- ✅ Repository management and settings configuration
- ✅ Responsive UI with advanced filtering and search
- ✅ **COMPLETE Authentication System** with JWT + LocalStorage
- ✅ **User Management** with roles and subscription tiers
- ✅ **Protected Routes** with automatic redirects
- ✅ **Login/Register UI** with password strength validation
- ✅ **User Profile** in navbar with logout functionality
- 🔮 Future: Test coverage, error boundaries, notifications, automated sync

### Architecture Strengths
- **Complete modular hexagonal architecture** with DDD principles
- **Authentication system** fully integrated with JWT + password hashing
- **98+ TypeScript files** organized in proper module structure
- **Functional programming patterns** throughout (no classes/interfaces)
- **IndexedDB + LocalStorage** persistence with mock data support
- **Absolute imports** with TypeScript path mapping (@/*)

### Module Structure
```
src/modules/
├── auth/          # JWT authentication, User/Session entities, LocalStorage repo
├── dashboard/     # Main KPI dashboard with customizable widgets  
├── teams/         # Team management with lead assignment
├── peers/         # Peer management with GitHub/Jira integration
├── objectives/    # Goal tracking with progress monitoring
├── github/        # GitHub API integration and analytics
├── jira/          # Jira API integration and metrics
└── shared/        # Common components, services, infrastructure
```

Each module follows hexagonal layers: **domain** → **application** → **infrastructure** → **ui**

## 🚀 Deployment Strategy: Cloudflare Pages Ready ✅

### Current Setup: Production Ready
- **Repository**: GitHub repository with absolute imports
- **Hosting**: Cloudflare Pages configured
- **Build Command**: `bun run build:prod` (TypeScript-free build)
- **Database**: IndexedDB (client-side storage)
- **Features**: Complete MVP with authentication, teams, objectives, GitHub/Jira integration
- **Status**: Ready for immediate deployment

### Deployment Files Configured
- ✅ `wrangler.toml` - Cloudflare Pages configuration
- ✅ `public/_redirects` - SPA routing support
- ✅ `.env.production` - Production environment variables
- ✅ `DEPLOYMENT.md` - Complete deployment guide
- ✅ `package.json` - Production build script added

### Quick Deploy Steps
1. Connect repository to Cloudflare Pages
2. Set build command: `bun run build:prod`
3. Set build output: `dist`
4. Deploy automatically on git push

### Future Cloud Enhancements
- Cloudflare D1 for cloud database
- Multi-user authentication
- Real-time team collaboration
- Advanced analytics & reporting

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

## 📐 Architecture Rules

### Module Organization
**MANDATORY**: Each module MUST contain all 4 layers of hexagonal architecture:

```
src/modules/[module-name]/
├── domain/          # Entities, Value Objects, Domain Logic
├── application/     # Use Cases, Application Services, Ports
├── infrastructure/  # Repositories, External Services, Adapters
└── ui/             # Components, Hooks, Pages (Presentation Layer)
```

### Import Rules
**MANDATORY**: ALL imports must use absolute paths with TypeScript path mapping:
- ✅ `import { User } from '@/modules/auth/domain/user.entity'`
- ❌ `import { User } from '../../domain/user.entity'`

**Path Aliases Available**:
- `@/*` → `./src/*` (all imports use this single alias)

### Dependencies Flow
- **Domain**: No external dependencies (pure business logic)
- **Application**: Depends only on Domain
- **Infrastructure**: Depends on Domain and Application
- **UI**: Can depend on all layers but prefers Application

## 🏗️ Implementation Plan

### ✅ Completed Phase 1: Authentication & Core MVP
- ✅ **Complete Authentication System** (JWT + LocalStorage)
  - User/Session domain entities with validation
  - AuthRepository with LocalStorage implementation  
  - JWT service with token management
  - Password service with strength validation
  - Login/Register UI components with HeroUI
  - AuthProvider with React Context
  - Protected routes with automatic redirects
  - User profile dropdown in navbar with logout

- ✅ **Modular Architecture Migration**
  - All files moved to proper module structure
  - Each module follows hexagonal layers (domain/application/infrastructure/ui)
  - Absolute imports with @/* path mapping
  - Clean separation of concerns

### Next Steps (Priority Order)
1. **Test Coverage** (1 week)
   - Unit tests for domain entities (User, Session, Team, Peer)
   - Integration tests for authentication use cases
   - Component tests for critical UI (Login/Register forms)

2. **Deployment Mode Abstraction** (3-4 days)
   ```typescript
   // Factory pattern for switching between IndexedDB and Cloudflare D1
   const repositories = createRepositories(deploymentMode);
   ```

3. **Dual Build Configuration** (2-3 days)
   ```bash
   bun run build:local      # IndexedDB version
   bun run build:cloud      # Cloudflare D1 version
   ```

4. **Production Enhancements** (1 week)
   - Error boundaries for better UX
   - Performance optimizations (React.memo, lazy loading)
   - Offline capability
   - Loading states and error handling improvements

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

## 🤖 Development Workflow

**MANDATORY**: Always create commits AND update CLAUDE.md after completing tasks or features. Each significant change should be documented with a descriptive commit message following conventional commits pattern:

```bash
git add .
git commit -m "$(cat <<'EOF'
[type]: [description]

[detailed explanation of changes]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Conventional Commit Types**:
- **feat**: New features or functionality
- **fix**: Bug fixes
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, missing semi-colons, etc.)
- **refactor**: Code refactoring without adding features or fixing bugs
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (build process, dependencies, etc.)
- **perf**: Performance improvements
- **ci**: CI/CD pipeline changes

**Examples**:
- `feat: add authentication system with JWT tokens`
- `fix: resolve dashboard loading state issue`
- `docs: update README with deployment instructions`
- `refactor: extract repository factory pattern`
- `test: add unit tests for domain entities`

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