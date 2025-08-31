import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import { createServer } from 'http'
import express from 'express'
import { registerRoutes } from '../../server/routes'

describe('Habit Approval API', () => {
  let app: express.Application
  let server: any

  beforeEach(async () => {
    app = express()
    app.use(express.json())
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = {
        id: 'test-parent-id',
        subscriptionStatus: 'active'
      }
      req.isAuthenticated = () => true
      next()
    })

    server = await registerRoutes(app)
  })

  afterEach(() => {
    if (server) {
      server.close()
    }
  })

  describe('GET /api/pending-habits/all', () => {
    it('should return pending habits for all children', async () => {
      const response = await request(app)
        .get('/api/pending-habits/all')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('completion')
        expect(response.body[0]).toHaveProperty('child')
        expect(response.body[0]).toHaveProperty('habit')
      }
    })

    it('should require authentication', async () => {
      const unauthenticatedApp = express()
      unauthenticatedApp.use(express.json())
      await registerRoutes(unauthenticatedApp)

      await request(unauthenticatedApp)
        .get('/api/pending-habits/all')
        .expect(401)
    })
  })

  describe('POST /api/habit-completions/:completionId/approve', () => {
    it('should approve a habit completion with valid data', async () => {
      const mockCompletionId = 'test-completion-id'
      
      const response = await request(app)
        .post(`/api/habit-completions/${mockCompletionId}/approve`)
        .send({
          approvedBy: 'test-parent-id',
          message: 'Great job!',
          isAutoApproval: false
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
    })

    it('should reject approval without required approvedBy field', async () => {
      const mockCompletionId = 'test-completion-id'
      
      await request(app)
        .post(`/api/habit-completions/${mockCompletionId}/approve`)
        .send({
          message: 'Great job!'
        })
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
        freeUserApp.use((req, res, next) => {
          req.user = {
            id: 'free-user-id',
            subscriptionStatus: 'free'
          }
          req.isAuthenticated = () => true
          next()
        })
        await registerRoutes(freeUserApp)

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