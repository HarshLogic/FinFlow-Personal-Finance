const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

// Mock the models
jest.mock('../models', () => {
  return {
    Expense: { find: jest.fn(), aggregate: jest.fn() },
    Stock: {
      find: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
    },
    MutualFund: { find: jest.fn() },
    FixedDeposit: { find: jest.fn() },
    Liquid: { findOne: jest.fn() }
  };
});

const { Stock } = require('../models');

// Mock global fetch for POST /api/stocks which uses Alpha Vantage API
global.fetch = jest.fn();

describe('Stocks API', () => {
  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stocks', () => {
    it('should return a list of stocks sorted by ticker', async () => {
      const mockStocks = [{ _id: '1', ticker: 'AAPL', qty: 10, avgPrice: 150 }];
      
      const mockSort = jest.fn().mockResolvedValue(mockStocks);
      Stock.find.mockImplementation(() => ({
        sort: mockSort
      }));

      const res = await request(app).get('/api/stocks');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockStocks);
      expect(Stock.find).toHaveBeenCalledWith({ userId: 'demo_user' });
    });
  });

  describe('POST /api/stocks', () => {
    it('should successfully fetch stock data and create a stock', async () => {
      const mockSearchData = {
        bestMatches: [
          { "1. symbol": "RELIANCE.BSE", "2. name": "Reliance Industries Ltd", "4. region": "India" }
        ]
      };
      const mockQuoteData = {
        "Global Quote": { "05. price": "2500.50" }
      };

      fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockSearchData)
      }).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockQuoteData)
      });

      const newStock = { ticker: 'reliance', qty: 10, avgPrice: 2400 };
      Stock.create.mockResolvedValue({ _id: '2', ...newStock, ticker: 'RELIANCE.BSE', cmp: 2500.50, userId: 'demo_user' });

      const res = await request(app)
        .post('/api/stocks')
        .send(newStock);
        
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id', '2');
      expect(res.body).toHaveProperty('cmp', 2500.50);
      expect(Stock.create).toHaveBeenCalledWith(expect.objectContaining({
        ticker: 'RELIANCE.BSE',
        companyName: 'Reliance Industries Ltd',
        cmp: 2500.50,
        qty: 10,
        avgPrice: 2400,
        userId: 'demo_user'
      }));
    });

    it('should return 400 if stock is not listed in India', async () => {
      const mockSearchData = {
        bestMatches: [
          { "1. symbol": "AAPL", "2. name": "Apple Inc", "4. region": "United States" }
        ]
      };

      fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockSearchData)
      });

      const res = await request(app).post('/api/stocks').send({ ticker: 'apple' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Stock not listed in India');
    });

    it('should return 400 if unable to fetch valid price', async () => {
      const mockSearchData = {
        bestMatches: [
          { "1. symbol": "RELIANCE.BSE", "2. name": "Reliance Industries", "4. region": "India" }
        ]
      };
      const mockQuoteData = {
        "Global Quote": {} // Missing price
      };

      fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockSearchData)
      }).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockQuoteData)
      });

      const res = await request(app).post('/api/stocks').send({ ticker: 'reliance' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'Unable to fetch a valid stock price');
    });
  });

  describe('PUT /api/stocks/:id', () => {
    it('should update an existing stock', async () => {
      const updatedStock = { _id: '1', qty: 20 };
      Stock.findOneAndUpdate.mockResolvedValue(updatedStock);

      const res = await request(app)
        .put('/api/stocks/1')
        .send({ qty: 20 });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.qty).toBe(20);
    });

    it('should validate CMP when updating', async () => {
      const res = await request(app)
        .put('/api/stocks/1')
        .send({ cmp: -50 }); // Invalid CMP
        
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'CMP must be a positive number');
    });

    it('should return 404 if stock not found', async () => {
      Stock.findOneAndUpdate.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/stocks/999')
        .send({ qty: 20 });
        
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'Not found');
    });
  });

  describe('PATCH /api/stocks/:id/cmp', () => {
    it('should update the live price (cmp)', async () => {
      const updatedStock = { _id: '1', cmp: 160 };
      Stock.findOneAndUpdate.mockResolvedValue(updatedStock);

      const res = await request(app)
        .patch('/api/stocks/1/cmp')
        .send({ cmp: 160 });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.cmp).toBe(160);
    });

    it('should reject invalid CMP value', async () => {
      const res = await request(app)
        .patch('/api/stocks/1/cmp')
        .send({ cmp: "invalid_string" });
        
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'CMP must be a positive number');
    });
  });

  describe('DELETE /api/stocks/:id', () => {
    it('should delete a stock', async () => {
      Stock.findOneAndDelete.mockResolvedValue({ _id: '1' });

      const res = await request(app).delete('/api/stocks/1');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Deleted');
    });
  });

  describe('GET /api/stocks/pl', () => {
    it('should return P&L summary per holding', async () => {
      const mockStocks = [
        {
          ticker: 'AAPL',
          qty: 10,
          avgPrice: 100,
          cmp: 150,
          investedValue: 1000,
          currentValue: 1500,
          pl: 500,
          plPct: 50
        }
      ];
      Stock.find.mockResolvedValue(mockStocks);

      const res = await request(app).get('/api/stocks/pl');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.holdings).toHaveLength(1);
      expect(res.body.totalInvested).toBe(1000);
      expect(res.body.totalCurrent).toBe(1500);
      expect(res.body.totalPL).toBe(500);
    });
  });
});
