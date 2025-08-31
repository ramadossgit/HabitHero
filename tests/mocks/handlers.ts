import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth endpoints
  http.get('/api/auth/user', () => {
    return HttpResponse.json({
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      subscriptionStatus: 'active',
    })
  }),

  // Children endpoints
  http.get('/api/children', () => {
    return HttpResponse.json([
      {
        id: 'child-1',
        name: 'Test Child 1',
        username: 'testchild1',
        avatarType: 'robot',
        level: 1,
        xp: 100,
        rewardPoints: 50,
      },
      {
        id: 'child-2',
        name: 'Test Child 2',
        username: 'testchild2',
        avatarType: 'ninja',
        level: 2,
        xp: 250,
        rewardPoints: 75,
      },
    ])
  }),

  // Habits endpoints
  http.get('/api/children/:childId/habits', ({ params }) => {
    return HttpResponse.json([
      {
        id: 'habit-1',
        childId: params.childId,
        masterHabitId: 'master-habit-1',
        title: 'Brush Teeth',
        description: 'Brush teeth twice daily',
        isCompleted: false,
        streak: 5,
        xpReward: 10,
      }
    ])
  }),

  // Habit completions
  http.get('/api/pending-habits/all', () => {
    return HttpResponse.json([
      {
        completion: {
          id: 'completion-1',
          habitId: 'habit-1',
          completedAt: new Date().toISOString(),
          status: 'pending',
        },
        child: {
          id: 'child-1',
          name: 'Test Child 1',
        },
        habit: {
          id: 'habit-1',
          title: 'Brush Teeth',
          xpReward: 10,
        }
      }
    ])
  }),

  // Auto-approval endpoints
  http.get('/api/auto-approval-settings', () => {
    return HttpResponse.json({
      enabled: true,
      timeValue: 24,
      timeUnit: 'hours',
      applyToAllChildren: true,
      childSpecificSettings: {},
    })
  }),

  http.put('/api/auto-approval-settings', async ({ request }) => {
    const settings = await request.json()
    return HttpResponse.json(settings)
  }),

  http.get('/api/auto-approval-stats', () => {
    return HttpResponse.json({
      thisWeek: 5,
      totalSaved: 12,
      pending: 2,
    })
  }),

  // Habit approval/rejection
  http.post('/api/habit-completions/:completionId/approve', ({ params }) => {
    return HttpResponse.json({
      id: params.completionId,
      status: 'approved',
      approvedAt: new Date().toISOString(),
    })
  }),

  http.post('/api/habit-completions/:completionId/reject', ({ params }) => {
    return HttpResponse.json({
      id: params.completionId,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
    })
  }),
]