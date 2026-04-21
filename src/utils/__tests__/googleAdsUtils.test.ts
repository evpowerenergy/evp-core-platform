/**
 * Google Ads Utils Test Suite
 * ทดสอบ utility functions สำหรับ Google Ads integration
 */
/// <reference types="vitest/globals" />

import {
  createGoogleAdsService,
  calculateGoogleRoas,
  calculateGoogleCostPerLead,
} from '../googleAdsUtils';

describe('Google Ads Utils', () => {
  describe('createGoogleAdsService', () => {
    it('returns null when credentials are not set', () => {
      const service = createGoogleAdsService();
      expect(service).toBeNull();
    });
  });

  describe('calculateGoogleRoas', () => {
    it('should calculate ROAS correctly', () => {
      const roas = calculateGoogleRoas(1000, 5000);
      expect(roas).toBe(500); // (5000 / 1000) * 100
    });

    it('should return null when cost is zero or negative', () => {
      expect(calculateGoogleRoas(0, 5000)).toBeNull();
      expect(calculateGoogleRoas(-100, 5000)).toBeNull();
    });
  });

  describe('calculateGoogleCostPerLead', () => {
    it('should calculate cost per lead correctly', () => {
      const cpl = calculateGoogleCostPerLead(1000, 50);
      expect(cpl).toBe(20); // 1000 / 50
    });

    it('should return null when totalLeads is zero or negative', () => {
      expect(calculateGoogleCostPerLead(1000, 0)).toBeNull();
      expect(calculateGoogleCostPerLead(1000, -10)).toBeNull();
    });
  });
});
