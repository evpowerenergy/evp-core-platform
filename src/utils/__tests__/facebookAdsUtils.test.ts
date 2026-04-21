/**
 * Facebook Ads Utils Test Suite
 * ทดสอบ utility functions สำหรับ Facebook Ads integration
 */
/// <reference types="vitest/globals" />

import { 
  createFacebookAdsService,
  getFacebookAdsData,
  calculateFacebookRoas,
  calculateFacebookCostPerLead,
  formatDateForFacebook,
  createFacebookDateRange,
  isFacebookApiConfigured,
  createMockFacebookAdsData
} from '../facebookAdsUtils';

// When VITE_FACEBOOK_* are not set (e.g. in test env), createFacebookAdsService returns null.

describe('Facebook Ads Utils', () => {
  describe('createFacebookAdsService', () => {
    it('returns null when credentials are not set', () => {
      const service = createFacebookAdsService();
      expect(service).toBeNull();
    });
  });

  describe('calculateFacebookRoas', () => {
    it('should calculate ROAS correctly', () => {
      const roas = calculateFacebookRoas(1000, 5000);
      expect(roas).toBe(500); // (5000 / 1000) * 100
    });

    it('should return null when spend is zero or negative', () => {
      const roas1 = calculateFacebookRoas(0, 5000);
      const roas2 = calculateFacebookRoas(-100, 5000);
      
      expect(roas1).toBeNull();
      expect(roas2).toBeNull();
    });
  });

  describe('calculateFacebookCostPerLead', () => {
    it('should calculate cost per lead correctly', () => {
      const costPerLead = calculateFacebookCostPerLead(1000, 50);
      expect(costPerLead).toBe(20); // 1000 / 50
    });

    it('should return null when leads is zero or negative', () => {
      const costPerLead1 = calculateFacebookCostPerLead(1000, 0);
      const costPerLead2 = calculateFacebookCostPerLead(1000, -10);
      
      expect(costPerLead1).toBeNull();
      expect(costPerLead2).toBeNull();
    });
  });

  describe('formatDateForFacebook', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDateForFacebook(date);
      expect(formatted).toBe('2024-01-15');
    });
  });

  describe('createFacebookDateRange', () => {
    it('should create date range correctly', () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');
      
      const range = createFacebookDateRange(startDate, endDate);
      
      expect(range.since).toBe('2024-01-01');
      expect(range.until).toBe('2024-01-31');
    });
  });

  describe('isFacebookApiConfigured', () => {
    it('returns false when VITE_FACEBOOK_* are not set', () => {
      const isConfigured = isFacebookApiConfigured();
      expect(isConfigured).toBe(false);
    });
  });

  describe('createMockFacebookAdsData', () => {
    it('should create mock data with correct structure', () => {
      const mockData = createMockFacebookAdsData();
      
      expect(mockData).toHaveProperty('totalSpend');
      expect(mockData).toHaveProperty('totalImpressions');
      expect(mockData).toHaveProperty('totalClicks');
      expect(mockData).toHaveProperty('totalResults');
      expect(mockData).toHaveProperty('averageCtr');
      expect(mockData).toHaveProperty('averageCpc');
      expect(mockData).toHaveProperty('averageCpm');
      expect(mockData).toHaveProperty('packageSpend');
      expect(mockData).toHaveProperty('wholesalesSpend');
      expect(mockData).toHaveProperty('othersSpend');
      expect(mockData).toHaveProperty('costPerLead');
      expect(mockData).toHaveProperty('roas');
    });

    it('should have realistic mock values', () => {
      const mockData = createMockFacebookAdsData();
      
      expect(mockData.totalSpend).toBeGreaterThan(0);
      expect(mockData.totalImpressions).toBeGreaterThan(0);
      expect(mockData.totalClicks).toBeGreaterThan(0);
      expect(mockData.totalResults).toBeGreaterThan(0);
      expect(mockData.averageCtr).toBeGreaterThan(0);
      expect(mockData.averageCpc).toBeGreaterThan(0);
      expect(mockData.averageCpm).toBeGreaterThan(0);
    });
  });
});

describe('Facebook Ads Integration Tests', () => {
  it('getFacebookAdsData returns null when service is not created (no env)', async () => {
    // In test env: no client env → createFacebookAdsService() is null → getFacebookAdsData
    // calls fetch. Mock fetch so we don't hit network and we control the response.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, configured: false }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await getFacebookAdsData('2024-01-01', '2024-01-31');

    expect(data).toBeNull();
    vi.unstubAllGlobals();
  });
});
