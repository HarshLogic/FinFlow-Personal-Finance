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

  describe('Mutual Funds (/api/mutualfunds)', () => {
    describe('GET /', () => {
      it('should return a list of mutual funds', async () => {
        const mockMFs = [{ _id: '1', name: 'Nifty 50', invested: 1000 }];
        MutualFund.find.mockResolvedValue(mockMFs);

        const res = await request(app).get('/api/mutualfunds');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockMFs);
      });
    });

    describe('POST /', () => {
      it('should create a mutual fund', async () => {
        const mf = { name: 'Small Cap Fund', invested: 5000 };
        MutualFund.create.mockResolvedValue({ _id: '2', ...mf });

        const res = await request(app).post('/api/mutualfunds').send(mf);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id', '2');
        expect(res.body.name).toBe('Small Cap Fund');
      });

      it('should handle creation error', async () => {
        MutualFund.create.mockRejectedValue(new Error('Validation error'));
        const res = await request(app).post('/api/mutualfunds').send({});
        expect(res.statusCode).toEqual(400);
      });
    });

    describe('PUT /:id', () => {
      it('should update a mutual fund', async () => {
        MutualFund.findOneAndUpdate.mockResolvedValue({ _id: '1', invested: 2000 });
        const res = await request(app).put('/api/mutualfunds/1').send({ invested: 2000 });
        expect(res.statusCode).toEqual(200);
        expect(res.body.invested).toBe(2000);
      });

      it('should return 404 if not found', async () => {
        MutualFund.findOneAndUpdate.mockResolvedValue(null);
        const res = await request(app).put('/api/mutualfunds/999').send({ invested: 2000 });
        expect(res.statusCode).toEqual(404);
      });
    });

    describe('DELETE /:id', () => {
      it('should delete a mutual fund', async () => {
        MutualFund.findOneAndDelete.mockResolvedValue({ _id: '1' });
        const res = await request(app).delete('/api/mutualfunds/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Deleted');
      });
    });

    describe('GET /pl', () => {
      it('should return P&L summary for mutual funds', async () => {
        const mockFunds = [{ name: 'Fund A', type: 'Equity', invested: 1000, currentValue: 1500, pl: 500, plPct: 50 }];
        MutualFund.find.mockResolvedValue(mockFunds);

        const res = await request(app).get('/api/mutualfunds/pl');
        expect(res.statusCode).toEqual(200);
        expect(res.body.totalInvested).toBe(1000);
        expect(res.body.totalCurrent).toBe(1500);
        expect(res.body.totalPL).toBe(500);
      });
    });
  });

  describe('Fixed Deposits (/api/fds)', () => {
    describe('GET /', () => {
      it('should return a list of fixed deposits', async () => {
        const mockFDs = [{ _id: '1', principal: 50000 }];
        FixedDeposit.find.mockResolvedValue(mockFDs);

        const res = await request(app).get('/api/fds');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockFDs);
      });
    });

    describe('POST /', () => {
      it('should create a fixed deposit', async () => {
        const fd = { principal: 10000, maturityAmount: 11000 };
        FixedDeposit.create.mockResolvedValue({ _id: '2', ...fd });

        const res = await request(app).post('/api/fds').send(fd);
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('_id', '2');
        expect(res.body.principal).toBe(10000);
      });
    });

    describe('PUT /:id', () => {
      it('should update a fixed deposit', async () => {
        FixedDeposit.findOneAndUpdate.mockResolvedValue({ _id: '1', principal: 15000 });
        const res = await request(app).put('/api/fds/1').send({ principal: 15000 });
        expect(res.statusCode).toEqual(200);
        expect(res.body.principal).toBe(15000);
      });

      it('should return 404 if not found', async () => {
        FixedDeposit.findOneAndUpdate.mockResolvedValue(null);
        const res = await request(app).put('/api/fds/999').send({});
        expect(res.statusCode).toEqual(404);
      });
    });

    describe('DELETE /:id', () => {
      it('should delete a fixed deposit', async () => {
        FixedDeposit.findOneAndDelete.mockResolvedValue({ _id: '1' });
        const res = await request(app).delete('/api/fds/1');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Deleted');
      });
    });
  });

  describe('Liquid Cash (/api/liquid)', () => {
    describe('GET /', () => {
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

    describe('PUT /', () => {
      it('should update liquid cash balance', async () => {
        Liquid.findOneAndUpdate.mockResolvedValue({ balance: 60000 });
        const res = await request(app).put('/api/liquid').send({ balance: 60000 });
        expect(res.statusCode).toEqual(200);
        expect(res.body.balance).toBe(60000);
      });

      it('should handle update error', async () => {
        Liquid.findOneAndUpdate.mockRejectedValue(new Error('Validation error'));
        const res = await request(app).put('/api/liquid').send({});
        expect(res.statusCode).toEqual(400);
      });
    });
  });
});
