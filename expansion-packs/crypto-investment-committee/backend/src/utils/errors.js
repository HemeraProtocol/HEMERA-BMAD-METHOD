class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400);
    this.field = field;
    this.type = 'ValidationError';
  }
}

class AgentError extends AppError {
  constructor(message, agentId) {
    super(message, 500);
    this.agentId = agentId;
    this.type = 'AgentError';
  }
}

class LLMError extends AppError {
  constructor(message, model) {
    super(message, 503);
    this.model = model;
    this.type = 'LLMError';
  }
}

class DataServiceError extends AppError {
  constructor(message, service) {
    super(message, 503);
    this.service = service;
    this.type = 'DataServiceError';
  }
}

class SessionError extends AppError {
  constructor(message, sessionId) {
    super(message, 404);
    this.sessionId = sessionId;
    this.type = 'SessionError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429);
    this.retryAfter = retryAfter;
    this.type = 'RateLimitError';
  }
}

const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const errorHandler = (err, req, res, next) => {
  const { logger } = require('./logger');
  
  if (!err.isOperational) {
    logger.error('Unexpected error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query
    });
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  
  const response = {
    error: {
      message,
      type: err.type || 'Error',
      statusCode,
      timestamp: err.timestamp || new Date().toISOString()
    }
  };
  
  if (err.field) response.error.field = err.field;
  if (err.agentId) response.error.agentId = err.agentId;
  if (err.sessionId) response.error.sessionId = err.sessionId;
  if (err.retryAfter) response.error.retryAfter = err.retryAfter;
  
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

module.exports = {
  AppError,
  ValidationError,
  AgentError,
  LLMError,
  DataServiceError,
  SessionError,
  RateLimitError,
  asyncErrorHandler,
  errorHandler
};