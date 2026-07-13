const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

// Mock the models
jest.mock('../models', () => {
  return {
    Stock: { find: jest.fn() },
    MutualFund: { find: jest.fn() },
    FixedDeposit: { find: jest.fn() },
    Liquid: { findOne: jest.fn() },
    Expense: { find: jest.fn() }
  };
});

const { Stock, MutualFund, FixedDeposit, Liquid, Expense } = require('../models');

describe('Summary API', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/summary/projection', () => {
    it('should return projection data with default values', async () => {
      const res = await request(app).get('/api/summary/projection');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('params');
      expect(res.body.params).toEqual({ monthly: 10000, rate: 12, years: 20 });
      expect(res.body).toHaveProperty('projection');
      expect(res.body.projection.length).toBe(21); // 0 to 20 years
      expect(res.body).toHaveProperty('summary');
    });

    it('should return projection data with custom query values', async () => {
      const res = await request(app).get('/api/summary/projection?monthly=5000&rate=10&years=10');
      expect(res.statusCode).toEqual(200);
      expect(res.body.params).toEqual({ monthly: 5000, rate: 10, years: 10 });
      expect(res.body.projection.length).toBe(11); // 0 to 10 years
    });
  });

  describe('GET /api/summary', () => {
    it('should return portfolio snapshot', async () => {
      Stock.find.mockResolvedValue([
        { qty: 10, cmp: 150, avgPrice: 100 }
      ]);
      MutualFund.find.mockResolvedValue([
        { currentValue: 5000, invested: 4000 }
      ]);
      FixedDeposit.find.mockResolvedValue([
        { maturityAmount: 11000, principal: 10000 }
      ]);
      Liquid.findOne.mockResolvedValue({ balance: 20000 });
      
      const now = new Date();
      Expense.find.mockResolvedValue([
        { amount: 1000, type: 'need', date: now },
        { amount: 500, type: 'want', date: now }
      ]);

      const res = await request(app).get('/api/summary');
      expect(res.statusCode).toEqual(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.totalWealth).toBeDefined();
      expect(res.body.stocks).toBeDefined();
      expect(res.body.mf).toBeDefined();
      expect(res.body.fds).toBeDefined();
      expect(res.body.expenses).toBeDefined();

      // Check stock math
      expect(res.body.stocks.value).toBe(1500); // 10 * 150
      expect(res.body.stocks.cost).toBe(1000); // 10 * 100
      expect(res.body.stocks.pl).toBe(500); // 1500 - 1000
    });

    it('should handle missing liquid balance safely', async () => {
      Stock.find.mockResolvedValue([]);
      MutualFund.find.mockResolvedValue([]);
      FixedDeposit.find.mockResolvedValue([]);
      Liquid.findOne.mockResolvedValue(null);
      Expense.find.mockResolvedValue([]);

      const res = await request(app).get('/api/summary');
      expect(res.statusCode).toEqual(200);
      
      // Values should be 0 or NaN but not crash
      expect(res.body.summary.totalWealth).toBe(0);
      expect(res.body.summary.allocation.liquid.value).toBe(0);
    });
  });
});
