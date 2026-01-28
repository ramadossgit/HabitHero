# Habit Heroes 🦸‍♂️🦸‍♀️

**A gamified habit tracking application for children and parents**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)

---

## 📖 Overview

Habit Heroes transforms daily habit tracking into an engaging adventure for kids! Children create personalized hero avatars (robots, princesses, ninjas, animals), complete daily missions to earn XP and rewards, while parents monitor progress and manage incentives through a comprehensive dashboard.

### ✨ Key Features

- 🎮 **Gamified Experience** - XP, levels, streaks, and achievements
- 🦸 **Avatar Customization** - Multiple character types with unlockable gear
- ✅ **Habit Management** - Create, track, and complete daily habits
- 🎁 **Reward System** - Parent-configured rewards and approval workflows
- 📊 **Progress Tracking** - Visual dashboards and analytics
- 👨‍👩‍👧 **Parental Controls** - Screen time limits, bedtime modes, app restrictions
- 🔄 **Cross-Device Sync** - Real-time family data synchronization
- 📱 **Mobile Apps** - iOS and Android native apps (React Native + Expo)

---

## 🚀 Quick Start

Get up and running in **5 minutes**:

```bash
# 1. Install dependencies
cd HabitHero
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 3. Create database
createdb habithero

# 4. Push schema
npm run db:push

# 5. Start development server
npm run dev
```

**Open browser:** http://localhost:5000

📖 **Detailed instructions:** See [QUICK_START.md](QUICK_START.md)

---

## 📚 Documentation

### Getting Started

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](QUICK_START.md)** | ⚡ 5-minute setup guide |
| **[LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md)** | 📘 Complete local deployment instructions |
| **[DATABASE_SETUP.md](DATABASE_SETUP.md)** | 🗄️ PostgreSQL configuration guide |
| **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** | 📊 Replit to local migration report |

### Advanced

| Document | Description |
|----------|-------------|
| **[DOCKER_SETUP.md](DOCKER_SETUP.md)** | 🐳 Docker deployment guide |
| **[design_guidelines.md](design_guidelines.md)** | 🎨 UI/UX design standards |
| **[docs/TDD_WORKFLOW.md](docs/TDD_WORKFLOW.md)** | 🧪 Testing workflow |
| **[MOBILE_QUICK_START.md](MOBILE_QUICK_START.md)** | 📱 Mobile app setup |

---

## 🏗️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first styling
- **Shadcn/ui** - Component library
- **Wouter** - Lightweight routing
- **TanStack Query** - Server state management

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Passport.js** - Authentication
- **Drizzle ORM** - Type-safe database queries
- **WebSocket** - Real-time communication

### Database
- **PostgreSQL** - Primary database
- **Neon** - Serverless PostgreSQL (production)

### Mobile
- **React Native** - Native mobile framework
- **Expo** - Development platform

### Testing
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **WebDriverIO** - Mobile testing
- **MSW** - API mocking

---

## 🗂️ Project Structure

```
HabitHero/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities
│   │   └── pages/         # Page components
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── auth.ts           # Local authentication
│   ├── replitAuth.ts     # OAuth authentication
│   ├── db.ts             # Database connection
│   └── storage.ts        # Data access layer
├── shared/                # Shared TypeScript schemas
│   ├── schema.ts         # Database schema
│   └── subscription-plans.ts
├── tests/                 # Test suite
├── HabitHeroesMobile/    # React Native mobile app
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```

---

## 🌐 Environment Support

| Environment | Status | Authentication | Database |
|-------------|--------|----------------|----------|
| **Local Development** | ✅ Supported | Email/Password | Local PostgreSQL |
| **Docker** | ✅ Supported | Email/Password | PostgreSQL container |
| **Replit** | ✅ Supported | OAuth + Email/Password | Neon Serverless |
| **Production** | ✅ Ready | OAuth + Email/Password | Managed PostgreSQL |

---

## 🔧 Available Scripts

### Development

```bash
npm run dev              # Start dev server (port 5000)
npm run build            # Build for production
npm start                # Start production server
npm run check            # TypeScript type check
```

### Database

```bash
npm run db:push          # Push schema to database
npm run db:generate      # Generate migration files
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio (GUI)
```

### Testing

```bash
npm test                 # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:e2e         # Run E2E tests with Playwright
```

---

## 🔐 Authentication

The application supports **dual authentication**:

### For Parents
- **Local Auth:** Email/password registration and login
- **OAuth:** Replit OAuth (when deployed on Replit)

### For Children
- **Family Code + Username + PIN:** Simple, kid-friendly login
- No email required
- Cross-device support

---

## 🗄️ Database Schema

Key tables:
- `users` - Parent accounts
- `children` - Child accounts
- `habits` - Habit definitions
- `habit_completions` - Daily completion records
- `rewards` - Reward catalog
- `reward_claims` - Redemption history
- `parental_controls` - Parent control settings
- `avatar_shop_items` - Avatar customization items
- `devices` - Registered family devices
- `sync_events` - Cross-device sync events

**Total:** 15+ tables with full relational integrity

---

## 🐳 Docker Support

Run with Docker Compose:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 16 container
- Application container
- Automatic health checks
- Persistent data volumes

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for details.

---

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# With UI
npm run test:ui
```

Test coverage includes:
- API endpoints
- Authentication flows
- React components
- User workflows
- Mobile gestures (WebDriverIO)

---

## 🚢 Deployment Options

### 1. Local Development
```bash
npm run dev
```

### 2. Docker
```bash
docker-compose up -d
```

### 3. Replit
- Push code to Replit
- Set environment secrets
- Click "Run"

### 4. Production
- **Railway:** Connect GitHub repo
- **Heroku:** `git push heroku main`
- **DigitalOcean:** App Platform + GitHub
- **AWS/Azure:** Docker container deployment

See [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md#production-deployment)

---

## 🌟 Key Highlights

### ✅ Migration from Replit Complete

This application was successfully migrated from Replit's cloud environment to run locally while:
- ✅ **Preserving 100% of functionality**
- ✅ **Maintaining backward compatibility**
- ✅ **Adding Docker support**
- ✅ **Creating comprehensive documentation**

### 🔄 Environment Auto-Detection

The application automatically detects its environment and adapts:
- **Replit:** Enables OAuth, Replit plugins
- **Local:** Uses email/password auth, disables Replit-specific features
- **No configuration needed!**

### 🎯 Production-Ready

- Multi-stage Docker builds
- Security-hardened (non-root user, environment secrets)
- Health checks configured
- Database migrations automated
- Comprehensive error handling

---

## 🛠️ System Requirements

### Minimum
- Node.js 20.0.0+
- npm 10.0.0+
- PostgreSQL 13+
- 4GB RAM
- 2GB disk space

### Recommended
- Node.js 22.x
- PostgreSQL 16
- 8GB RAM
- 5GB disk space

---

## 📋 Prerequisites

Before running locally:

1. **Install Node.js:** https://nodejs.org (v20+)
2. **Install PostgreSQL:** https://www.postgresql.org (v13+)
3. **Install Git:** https://git-scm.com

**Windows users:** PowerShell or Git Bash recommended

---

## 🐛 Troubleshooting

Common issues and solutions:

### Database Connection Issues
See [DATABASE_SETUP.md#troubleshooting](DATABASE_SETUP.md#troubleshooting)

### Port Already in Use
See [LOCAL_DEPLOYMENT_GUIDE.md#troubleshooting](LOCAL_DEPLOYMENT_GUIDE.md#troubleshooting)

### npm Install Failures
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (64+ chars)

Optional:
- `PORT` - Server port (default: 5000)
- `STRIPE_SECRET_KEY` - For subscription features
- `REPLIT_DOMAINS` - For OAuth (Replit only)

See [.env.example](.env.example) for full reference.

---

## 🔒 Security

- ✅ Password hashing with scrypt + salt
- ✅ HTTP-only session cookies
- ✅ CSRF protection
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (React escaping)
- ✅ Environment variable secrets
- ✅ Non-root Docker containers

---

## 📱 Mobile Apps

Native mobile apps available in `HabitHeroesMobile/`:

```bash
cd HabitHeroesMobile
npm install
expo start
```

See [MOBILE_QUICK_START.md](MOBILE_QUICK_START.md)

---

## 🤝 Contributing

This is a private project, but contributions are welcome:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- **Replit** - Original hosting platform
- **Neon** - Serverless PostgreSQL
- **Shadcn/ui** - Component library
- **Drizzle** - Type-safe ORM
- **Stripe** - Payment processing

---

## 📞 Support

- 📖 **Documentation:** See [QUICK_START.md](QUICK_START.md)
- 🐛 **Issues:** Check [Troubleshooting](#troubleshooting)
- 💬 **Questions:** See comprehensive guides in `docs/`

---

## 🗺️ Roadmap

- [x] ✅ Local deployment support
- [x] ✅ Docker containerization
- [x] ✅ Comprehensive documentation
- [ ] 🚧 Enhanced mobile features
- [ ] 🚧 Additional mini-games
- [ ] 🚧 Voice command integration
- [ ] 🚧 Analytics dashboard

---

## 📊 Project Stats

- **Lines of Code:** ~50,000+
- **Components:** 50+
- **API Endpoints:** 80+
- **Database Tables:** 15+
- **Test Coverage:** Comprehensive
- **Documentation:** 1,500+ lines

---

## 🎯 Quick Links

| Link | Description |
|------|-------------|
| [QUICK_START.md](QUICK_START.md) | Get started in 5 minutes |
| [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md) | Full deployment guide |
| [DATABASE_SETUP.md](DATABASE_SETUP.md) | Database configuration |
| [DOCKER_SETUP.md](DOCKER_SETUP.md) | Docker deployment |
| [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) | Migration report |

---

**Built with ❤️ for families who want to build better habits together**

---

*Last Updated: January 26, 2026*
*Version: 1.0.0*
*Status: ✅ Production Ready*
