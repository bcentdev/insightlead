# InsightLead 🎯

> A modern tech lead management application built with React, TypeScript, and clean hexagonal architecture following Domain-Driven Design (DDD) principles.

## 🚀 Overview

InsightLead helps tech leads track team performance, manage objectives, and integrate with GitHub and Jira for comprehensive team insights. The application provides real-time analytics, customizable dashboards, and automated metrics collection to streamline team management.

## ✨ Features

### 📊 **Analytics Dashboard**
- **Real-time KPIs** from GitHub (PRs, commits, reviews) and Jira (issues, cycle time)
- **Customizable widgets** with drag & drop functionality
- **Advanced filtering** by team members, time periods, and repositories
- **Intelligent search** with global keyboard shortcuts (⌘K)

### 👥 **Team Management**
- **Complete CRUD** for teams and team members
- **Role-based assignments** (Frontend, Backend, QA, DevOps, etc.)
- **Seniority levels** (Junior, Mid, Senior, Lead, Principal)
- **Team lead assignment** and hierarchy management

### 🎯 **Objective Tracking**
- **Goal setting** with progress tracking (0-100%)
- **Completion rate metrics** across teams
- **Timeline visualization** for objectives

### 🔗 **Robust Integrations**
- **GitHub**: Pull requests, commits, code reviews, activity graphs
- **Jira**: Issues, stories, sprints, cycle time analysis
- **Multi-repository support** with easy management
- **Connection testing** and configuration validation

## 🏗️ Architecture

Built with **Hexagonal Architecture** and **Domain-Driven Design**:

```
src/
├── domain/              # Core business logic
│   ├── entities/        # Business entities (Peer, Team, Objective)
│   ├── value-objects/   # Value objects (GitHubUsername, Progress)
│   └── repositories/    # Repository interfaces (ports)
├── application/         # Application layer
│   ├── use-cases/       # Business use cases
│   └── ports/           # Application ports (GitHub, Jira)
├── infrastructure/      # External concerns
│   ├── adapters/        # API adapters (GitHub, Jira)
│   └── repositories/    # Repository implementations
└── presentation/        # UI layer
    ├── components/      # React components
    ├── pages/          # Page components
    └── hooks/          # Custom React hooks
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: HeroUI v2 + Tailwind CSS
- **State Management**: Zustand + React Hook Form
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Database**: IndexedDB (browser storage)
- **APIs**: GitHub REST API + Jira REST/GraphQL API
- **Testing**: Vitest + React Testing Library

## 🌟 Deployment Versions

InsightLead is designed with a **dual deployment strategy** to maximize reach and revenue:

### 🆓 **Open Source Version**
- **Repository**: Public on GitHub
- **Hosting**: GitHub Pages / Vercel (free)
- **Database**: IndexedDB (local browser storage)
- **Target**: Developers, small teams, self-hosted solutions
- **License**: MIT

### ☁️ **Cloud Premium Version**
- **Hosting**: Cloudflare Pages (app.insightlead.com)
- **Database**: Cloudflare D1 (serverless SQLite)  
- **Auth**: Multi-user with JWT authentication
- **Target**: Companies and larger teams
- **Pricing**: $9/month per team (Pro) | $29/month per team (Enterprise)

## 📋 Current Status (85% MVP Complete)

### ✅ **Implemented Features**
- [x] Complete dashboard with GitHub/Jira KPIs
- [x] Team and peer management (CRUD)
- [x] Objective tracking system
- [x] GitHub integration (PRs, commits, reviews)
- [x] Jira integration (issues, sprints)
- [x] Repository management
- [x] Settings and configuration
- [x] Responsive UI with dark/light themes
- [x] Advanced filtering and search

### 🚧 **Missing for MVP**
- [ ] **Authentication system** (Critical)
- [ ] **Test coverage** (0 tests currently)
- [ ] **Error boundaries** and robust error handling
- [ ] **Performance optimizations**
- [ ] **Offline capability**

### 🔮 **Future Features**
- [ ] Notifications system (UI ready, backend pending)
- [ ] Automated data sync
- [ ] Multi-tenancy support
- [ ] Data export/import
- [ ] Slack integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- GitHub Personal Access Token (optional)
- Jira API Token (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd insightlead

# Install dependencies
npm install
# or with bun (recommended)
bun install

# Set up environment variables
cp .env.example .env.development
```

### Environment Configuration

```bash
# .env.development
VITE_USE_MOCK_DATA=false        # Use real IndexedDB storage
VITE_SEED_INDEXEDDB=false       # Seed with sample data
```

### Development

```bash
# Start development server (local version)
bun dev

# Start development server (cloud version)
bun dev --mode cloud

# Build for local deployment (IndexedDB)
bun run build:local

# Build for cloud deployment (Cloudflare D1)
bun run build:cloud

# Run linting
bun run lint

# Run tests
bun run test
```

## ⚙️ Configuration

### GitHub Integration
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create token with `repo` and `user` scopes
3. Add token in Settings → Integrations tab
4. Test connection and add repositories

### Jira Integration
1. Go to Atlassian Account Settings → Security → API tokens
2. Create API token
3. Configure in Settings with:
   - Base URL: `https://yourcompany.atlassian.net`
   - Username: Your Atlassian email
   - API Token: Generated token

## 📊 Available Commands

```bash
# Development
bun dev              # Start local development server
bun dev --mode cloud # Start cloud development server

# Building
bun run build:local  # Build for IndexedDB (open source)
bun run build:cloud  # Build for Cloudflare D1 (cloud version)

# Deployment
bun run deploy:github    # Deploy open source to GitHub Pages
bun run deploy:cloudflare # Deploy cloud version to Cloudflare Pages

# Quality
bun run typecheck    # TypeScript type checking
bun run lint         # Code linting with oxlint
bun run test         # Run tests
bun run test:ui      # Test UI with Vitest UI

# Preview
bun run preview      # Preview production build
```

## 🎯 MVP Launch Roadmap

### Phase 1 - Authentication & Dual Deployment (1-2 weeks)
- [ ] **Authentication System**: JWT-based auth for cloud version
- [ ] **Deployment Mode Abstraction**: Factory pattern for IndexedDB/D1 switching
- [ ] **Cloudflare D1 Setup**: Database schema and repository implementations
- [ ] **Dual Build Configuration**: Separate builds for local/cloud versions

### Phase 2 - Production Readiness (1 week)
- [ ] **Test Coverage**: Unit tests for entities, integration tests for use cases
- [ ] **Error Boundaries**: Robust error handling and user feedback
- [ ] **Performance Optimization**: React.memo, lazy loading, IndexedDB optimization
- [ ] **Monitoring Setup**: Error tracking and analytics

### Phase 3 - Go-to-Market (1 week)
- [ ] **Open Source Launch**: GitHub repository with documentation
- [ ] **Cloud Version Deployment**: Cloudflare Pages setup with custom domain
- [ ] **Payment Integration**: Stripe integration for Pro/Enterprise tiers
- [ ] **Marketing Site**: Landing page explaining both versions

## 💰 Monetization Strategy

### 🆓 **Open Source Features**
- Complete dashboard with GitHub/Jira integrations
- Team and peer management
- Objective tracking
- Local data storage (IndexedDB)
- Single-user focused

### 💎 **Cloud Pro ($9/month/team)**
- Multi-user authentication
- Cloud sync and backup
- Real-time team collaboration
- Email notifications
- Data export capabilities
- Team activity feeds

### 🚀 **Cloud Enterprise ($29/month/team)**
- Advanced analytics & custom reports
- SSO integration (Google, Microsoft)
- REST API access
- Custom integrations and webhooks
- Priority support & onboarding
- Advanced security features

## 🤝 Contributing

This project follows functional programming patterns with TypeScript:
- Use `type` instead of `interface`
- Prefer pure functions over classes
- Use union types instead of enums
- Follow the established hexagonal architecture

## 📄 License

Licensed under the [MIT license](https://github.com/frontio-ai/vite-template/blob/main/LICENSE).
