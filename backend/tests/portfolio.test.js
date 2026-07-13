const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

jest.mock('../models', () => {
  return {
    MutualFund: {
      find: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn()
    },
    FixedDeposit: {
      find: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn()
    },
    Liquid: {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn()
    },
    Stock: { find: jest.fn() },
    Expense: { find: jest.fn() }
  };
});

const { MutualFund, FixedDeposit, Liquid } = require('../models');

describe('Portfolio API', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/mutualfunds', () => {
    it('should return a list of mutual funds', async () => {
      const mockMFs = [{ _id: '1', name: 'Nifty 50', invested: 1000 }];
      MutualFund.find.mockResolvedValue(mockMFs);

      const res = await request(app).get('/api/mutualfunds');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockMFs);
    });
  });

  describe('POST /api/fds', () => {
    it('should create a fixed deposit', async () => {
      const fd = { principal: 10000, maturityAmount: 11000 };
      FixedDeposit.create.mockResolvedValue({ _id: '2', ...fd });

      const res = await request(app).post('/api/fds').send(fd);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id', '2');
      expect(res.body.principal).toBe(10000);
    });
  });

  describe('GET /api/liquid', () => {
    it('should return liquid cash balance', async () => {
      Liquid.findOne.mockResolvedValue({ balance: 50000 });

      const res = await request(app).get('/api/liquid');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.balance).toBe(50000);
    });

    it('should return 0 balance if not found', async () => {
      Liquid.findOne.mockResolvedValue(null);

      const res = await request(app).get('/api/liquid');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.balance).toBe(0);
    });
  });

  describe('PUT /api/liquid', () => {
    it('should update liquid cash balance', async () => {
      Liquid.findOneAndUpdate.mockResolvedValue({ balance: 60000 });

      const res = await request(app).put('/api/liquid').send({ balance: 60000 });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.balance).toBe(60000);
    });
  });
});
