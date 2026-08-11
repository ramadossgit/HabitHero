// @vitest-environment node
//
// Integration tests for the habit-approval + auto-approval API, run
// against the real database (DATABASE_URL from .env). Data is seeded
// through the storage layer, so assertions exercise the true stack.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import { registerRoutes } from '../../server/routes'
import { storage } from '../../server/storage'

const uniq = Date.now()

describe('Habit Approval API', () => {
  let app: express.Application
  let server: any
  let parentId = ''
  let childId = ''
  let habitId = ''
  let completionId = ''

  beforeAll(async () => {
    // Seed a real family
    const parent = await storage.createUser({
      email: `approval${uniq}@test.local`,
      password: 'hashed-not-used',
      firstName: 'Approval',
      lastName: 'Tester',
      familyCode: `F${String(uniq).slice(-7)}`,
    } as any)
    parentId = parent.id

    const child = await storage.createChild({
      parentId,
      name: 'TestKid',
      avatarType: 'robot',
      age: 8,
    } as any)
    childId = child.id

    const habit = await storage.createHabit({
      childId,
      name: 'Test Habit',
      icon: '⭐',
      xpReward: 50,
    } as any)
    habitId = habit.id

    const completion = await storage.createHabitCompletion({
      habitId,
      childId,
      date: new Date().toISOString().split('T')[0],
      xpEarned: 50,
      rewardPointsEarned: 0,
    } as any)
    completionId = completion.id

    // App authenticated as the seeded parent (premium for settings tests)
    app = express()
    app.use(express.json())
    app.use((req: any, res, next) => {
      req.user = { ...parent, subscriptionStatus: 'active' }
      req.isAuthenticated = () => true
      next()
    })
    server = await registerRoutes(app)
  }, 30000)

  afterAll(async () => {
    if (server) server.close()
    if (childId) await storage.deleteChild(childId).catch(() => {})
  })

  describe('GET /api/pending-habits/all', () => {
    it('should return pending habits for all children', async () => {
      const response = await request(app)
        .get('/api/pending-habits/all')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThanOrEqual(1)
      expect(response.body[0]).toHaveProperty('completion')
      expect(response.body[0]).toHaveProperty('child')
      expect(response.body[0]).toHaveProperty('habit')
    })

    it('should require authentication', async () => {
      const unauthenticatedApp = express()
      unauthenticatedApp.use(express.json())
      unauthenticatedApp.use((req: any, res, next) => {
        req.isAuthenticated = () => false
        next()
      })
      const s = await registerRoutes(unauthenticatedApp)

      await request(unauthenticatedApp)
        .get('/api/pending-habits/all')
        .expect(401)
      s.close()
    })
  })

  describe('POST /api/habit-completions/:completionId/approve', () => {
    it('should approve a habit completion and award XP + points', async () => {
      const response = await request(app)
        .post(`/api/habit-completions/${completionId}/approve`)
        .send({ message: 'Great job!' })
        .expect(200)

      expect(response.body.status).toBe('approved')

      const child = await storage.getChild(childId)
      expect(child!.totalXp).toBe(50)
      expect(child!.rewardPoints).toBeGreaterThan(0)
    })

    it('should reject re-approval of an already reviewed completion', async () => {
      await request(app)
        .post(`/api/habit-completions/${completionId}/approve`)
        .send({ message: 'Again?' })
        .expect(400)
    })

    it('should return an error for a non-existent completion', async () => {
      await request(app)
        .post('/api/habit-completions/does-not-exist/approve')
        .send({ message: 'Hello' })
        .expect(400)
    })
  })

  describe('Auto-Approval Settings', () => {
    describe('GET /api/auto-approval-settings', () => {
      it('should return current auto-approval settings', async () => {
        const response = await request(app)
          .get('/api/auto-approval-settings')
          .expect(200)

        expect(response.body).toHaveProperty('enabled')
        expect(response.body).toHaveProperty('timeValue')
        expect(response.body).toHaveProperty('timeUnit')
        expect(['hours', 'days', 'weeks']).toContain(response.body.timeUnit)
      })
    })

    describe('PUT /api/auto-approval-settings', () => {
      it('should update auto-approval settings with valid data', async () => {
        const settingsData = {
          enabled: true,
          timeValue: 24,
          timeUnit: 'hours',
          applyToAllChildren: true,
          childSpecificSettings: {}
        }

        const response = await request(app)
          .put('/api/auto-approval-settings')
          .send(settingsData)
          .expect(200)

        expect(response.body).toMatchObject(settingsData)

        // Settings persist for the seeded parent
        const readBack = await request(app).get('/api/auto-approval-settings').expect(200)
        expect(readBack.body.enabled).toBe(true)
        expect(readBack.body.timeValue).toBe(24)
      })

      it('should validate timeValue is within acceptable range', async () => {
        const invalidSettings = {
          enabled: true,
          timeValue: 0, // Invalid: should be > 0
          timeUnit: 'hours',
          applyToAllChildren: true,
          childSpecificSettings: {}
        }

        await request(app)
          .put('/api/auto-approval-settings')
          .send(invalidSettings)
          .expect(400)
      })

      it('should validate timeUnit is valid', async () => {
        const invalidSettings = {
          enabled: true,
          timeValue: 24,
          timeUnit: 'invalid-unit', // Invalid time unit
          applyToAllChildren: true,
          childSpecificSettings: {}
        }

        await request(app)
          .put('/api/auto-approval-settings')
          .send(invalidSettings)
          .expect(400)
      })

      it('should only allow premium users to update settings', async () => {
        // Mock non-premium user
        const freeUserApp = express()
        freeUserApp.use(express.json())
        freeUserApp.use((req: any, res, next) => {
          req.user = {
            id: 'free-user-id',
            subscriptionStatus: 'free'
          }
          req.isAuthenticated = () => true
          next()
        })
        const s = await registerRoutes(freeUserApp)

        const settingsData = {
          enabled: true,
          timeValue: 24,
          timeUnit: 'hours',
          applyToAllChildren: true,
          childSpecificSettings: {}
        }

        await request(freeUserApp)
          .put('/api/auto-approval-settings')
          .send(settingsData)
          .expect(403) // Forbidden for free users
        s.close()
      })
    })

    describe('GET /api/auto-approval-stats', () => {
      it('should return auto-approval statistics', async () => {
        const response = await request(app)
          .get('/api/auto-approval-stats')
          .expect(200)

        expect(response.body).toHaveProperty('thisWeek')
        expect(response.body).toHaveProperty('totalSaved')
        expect(response.body).toHaveProperty('pending')
        expect(typeof response.body.thisWeek).toBe('number')
        expect(typeof response.body.totalSaved).toBe('number')
        expect(typeof response.body.pending).toBe('number')
      })
    })
  })
})
