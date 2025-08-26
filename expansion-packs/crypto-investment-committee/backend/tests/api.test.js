const request = require('supertest');
const { app } = require('../src/api/server');

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service', 'crypto-investment-committee');
    });
  });

  describe('POST /api/chat', () => {
    it('should process a valid query', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ query: 'Should I buy Bitcoin?' })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('query');
      expect(response.body.data).toHaveProperty('finalVerdict');
    }, 30000); // Increase timeout for LLM calls

    it('should reject request without query', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Query is required');
    });

    it('should handle session storage', async () => {
      // First create a session
      const sessionResponse = await request(app)
        .post('/api/session')
        .expect(200);
      
      const sessionId = sessionResponse.body.data.sessionId;
      
      // Send query with session
      const response = await request(app)
        .post('/api/chat')
        .send({ 
          query: 'Test query',
          sessionId 
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verify session was stored
      const historyResponse = await request(app)
        .get(`/api/session/${sessionId}`)
        .expect(200);
      
      expect(historyResponse.body.data.count).toBe(1);
    }, 30000);
  });

  describe('GET /api/daily', () => {
    it('should return daily analysis', async () => {
      const response = await request(app)
        .get('/api/daily')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('date');
      expect(response.body.data).toHaveProperty('analyses');
      expect(Array.isArray(response.body.data.analyses)).toBe(true);
      expect(response.body.data.analyses.length).toBe(3);
    }, 60000); // Longer timeout for multiple analyses
  });

  describe('POST /api/session', () => {
    it('should create a new session', async () => {
      const response = await request(app)
        .post('/api/session')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data.sessionId).toMatch(/^session_/);
    });
  });

  describe('GET /api/session/:id', () => {
    it('should retrieve session history', async () => {
      // First create a session
      const sessionResponse = await request(app)
        .post('/api/session')
        .expect(200);
      
      const sessionId = sessionResponse.body.data.sessionId;
      
      // Get empty session
      const response = await request(app)
        .get(`/api/session/${sessionId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(sessionId);
      expect(response.body.data.history).toEqual([]);
      expect(response.body.data.count).toBe(0);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/session/non-existent-session')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Session not found');
    });
  });

  describe('GET /api/agents', () => {
    it('should list available agents', async () => {
      const response = await request(app)
        .get('/api/agents')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const agent = response.body.data[0];
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('title');
      }
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Route not found');
    });
  });
});