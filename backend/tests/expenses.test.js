const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

// Mock the models
jest.mock('../models', () => {
  return {
    Expense: {
      find: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      aggregate: jest.fn()
    },
    Stock: { find: jest.fn() },
    MutualFund: { find: jest.fn() },
    FixedDeposit: { find: jest.fn() },
    Liquid: { findOne: jest.fn() }
  };
});

const { Expense } = require('../models');

describe('Expenses API', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/expenses', () => {
    it('should return a list of expenses', async () => {
      const mockExpenses = [{ _id: '1', amount: 1000, type: 'need' }];
      
      const mockFind = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockReturnThis();
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockExpenses);
      
      Expense.find.mockImplementation(() => ({
        sort: mockSort,
        skip: mockSkip,
        limit: mockLimit
      }));
      
      Expense.countDocuments.mockResolvedValue(1);

      const res = await request(app).get('/api/expenses');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('expenses');
      expect(res.body.expenses).toEqual(mockExpenses);
      expect(res.body.total).toBe(1);
      expect(res.body.page).toBe(1);
    });
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense', async () => {
      const newExpense = { amount: 500, type: 'want', category: 'Shopping' };
      Expense.create.mockResolvedValue({ _id: '2', ...newExpense, userId: 'demo_user' });

      const res = await request(app)
        .post('/api/expenses')
        .send(newExpense);
        
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id', '2');
      expect(res.body).toHaveProperty('amount', 500);
      expect(Expense.create).toHaveBeenCalledWith(expect.objectContaining({
        ...newExpense,
        userId: 'demo_user'
      }));
    });

    it('should handle creation errors', async () => {
      Expense.create.mockRejectedValue(new Error('Validation error'));

      const res = await request(app).post('/api/expenses').send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('PUT /api/expenses/:id', () => {
    it('should update an existing expense', async () => {
      const updatedExpense = { _id: '1', amount: 1200 };
      Expense.findOneAndUpdate.mockResolvedValue(updatedExpense);

      const res = await request(app)
        .put('/api/expenses/1')
        .send({ amount: 1200 });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.amount).toBe(1200);
    });

    it('should return 404 if expense not found', async () => {
      Expense.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/expenses/999')
        .send({ amount: 1200 });
        
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Not found');
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    it('should delete an expense', async () => {
      Expense.findOneAndDelete.mockResolvedValue({ _id: '1' });

      const res = await request(app).delete('/api/expenses/1');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Deleted');
    });
  });

  describe('GET /api/expenses/analytics', () => {
    it('should return aggregated analytics', async () => {
      const mockAgg = [
        { _id: { year: 2026, month: 6, type: 'need' }, total: 5000, count: 2 }
      ];
      Expense.aggregate.mockResolvedValue(mockAgg);

      const res = await request(app).get('/api/expenses/analytics');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockAgg);
    });
  });
});
