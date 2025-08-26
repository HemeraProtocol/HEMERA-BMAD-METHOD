const express = require('express');
const router = express.Router();
const CommitteeOrchestrator = require('../agents/CommitteeOrchestrator');
const LLMService = require('../llm/LLMService');
const ContextBuilder = require('../services/ContextBuilder');
const { logger } = require('../utils/logger');

// Initialize services
const llmService = new LLMService();
const orchestrator = new CommitteeOrchestrator(llmService);
const contextBuilder = new ContextBuilder();

// Session storage (in-memory for MVP, use Redis in production)
const sessions = new Map();

/**
 * POST /api/chat
 * Execute committee meeting for a query
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { query, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: { message: 'Query is required' }
      });
    }
    
    logger.info(`Processing query: ${query}`);
    
    // Build context from mock data
    const context = await contextBuilder.buildContext();
    
    // Execute committee meeting
    const result = await orchestrator.executeCommitteeMeeting(query, context);
    
    // Store in session if provided
    if (sessionId) {
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
      sessions.get(sessionId).push({
        query,
        result,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/daily
 * Get pre-computed daily analysis
 */
router.get('/daily', async (req, res, next) => {
  try {
    const context = await contextBuilder.buildContext();
    
    // Three daily questions
    const questions = [
      "Why is BTC/ETH up or down today?",
      "Should I keep, buy, or sell my portfolio?",
      "What new assets are showing strong potential?"
    ];
    
    const analyses = [];
    
    for (const question of questions) {
      const result = await orchestrator.executeCommitteeMeeting(question, context);
      analyses.push({
        question,
        answer: result.finalVerdict,
        confidence: result.phases.consensus?.averageConfidence || 0
      });
    }
    
    res.json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        marketContext: context.market,
        analyses
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/session
 * Create a new conversation session
 */
router.post('/session', (req, res) => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessions.set(sessionId, []);
  
  res.json({
    success: true,
    data: { sessionId }
  });
});

/**
 * GET /api/session/:id
 * Retrieve conversation history
 */
router.get('/session/:id', (req, res) => {
  const { id } = req.params;
  
  if (!sessions.has(id)) {
    return res.status(404).json({
      error: { message: 'Session not found' }
    });
  }
  
  const history = sessions.get(id);
  
  res.json({
    success: true,
    data: {
      sessionId: id,
      history,
      count: history.length
    }
  });
});

/**
 * GET /api/agents
 * List available agents
 */
router.get('/agents', async (req, res, next) => {
  try {
    const agents = await orchestrator.agentExecutor.getAvailableAgents();
    
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;