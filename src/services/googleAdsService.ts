/**
 * Google Ads API Service
 * สำหรับดึงข้อมูล Google Ads มาประมวลผลในระบบ CRM
 * ใช้ Google Ads API v21 (อัพเดตจาก v16)
 */

export interface GoogleAdsConfig {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
}

export interface GoogleAdsMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  costPerConversion: number;
  conversionRate: number;
}

export interface GoogleAdsData {
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  metrics: GoogleAdsMetrics;
  dateStart: string;
  dateEnd: string;
  category?: 'Package' | 'Wholesales' | 'Others';
}

export interface GoogleAdsSummary {
  totalCost: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCtr: number;
  averageCpc: number;
  averageCpm: number;
  packageCost: number;
  wholesalesCost: number;
  othersCost: number;
  campaigns: GoogleAdsData[];
}

class GoogleAdsService {
  private config: GoogleAdsConfig;
  private baseUrl = 'https://googleads.googleapis.com/v21';
  private accessToken: string | null = null;

  constructor(config: GoogleAdsConfig) {
    this.config = config;
  }

  /**
   * ดึงข้อมูล Google Ads ตามช่วงวันที่ (API v21)
   */
  async getAdsData(
    startDate: string,
    endDate: string,
    level: 'campaign' | 'account' = 'campaign'
  ): Promise<GoogleAdsData[]> {
    try {
      // ดึง access token
      await this.refreshAccessToken();
      
      const url = `${this.baseUrl}/customers/${this.config.customerId}/googleAds:search`;
      
      let query = '';
      
      if (level === 'account') {
        query = `
          SELECT 
            customer.id,
            customer.descriptive_name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_per_conversion,
            metrics.conversions_from_interactions_rate,
            segments.date
          FROM customer
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND metrics.impressions > 0
          ORDER BY segments.date DESC
        `;
      } else {
        query = `
          SELECT 
            campaign.id,
            campaign.name,
            campaign.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_per_conversion,
            metrics.conversions_from_interactions_rate,
            segments.date
          FROM campaign
          WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND campaign.status IN ('ENABLED', 'PAUSED', 'REMOVED')
          AND metrics.impressions > 0
          ORDER BY segments.date DESC
        `;
      }

      const requestBody = {
        query: query.trim()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'developer-token': this.config.developerToken
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google Ads API Error:', errorText);
        throw new Error(`Google Ads API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Google Ads API Error:', data.error);
        throw new Error(`Google Ads API Error: ${data.error.message}`);
      }

      const transformedData = this.transformAdsData(data.results || [], level);
      
      return transformedData;
    } catch (error) {
      console.error('❌ Error fetching Google Ads data:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลสรุป Google Ads (API v21)
   */
  async getAdsSummary(startDate: string, endDate: string, level: 'campaign' | 'account' = 'campaign'): Promise<GoogleAdsSummary> {
    try {
      const adsData = await this.getAdsData(startDate, endDate, level);
      
      const summary: GoogleAdsSummary = {
        totalCost: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        averageCtr: 0,
        averageCpc: 0,
        averageCpm: 0,
        packageCost: 0,
        wholesalesCost: 0,
        othersCost: 0,
        campaigns: adsData
      };

      // คำนวณข้อมูลสรุป
      adsData.forEach((ad) => {
        summary.totalCost += ad.metrics.cost;
        summary.totalImpressions += ad.metrics.impressions;
        summary.totalClicks += ad.metrics.clicks;
        summary.totalConversions += ad.metrics.conversions;

        // แยกตาม category
        switch (ad.category) {
          case 'Package':
            summary.packageCost += ad.metrics.cost;
            break;
          case 'Wholesales':
            summary.wholesalesCost += ad.metrics.cost;
            break;
          default:
            summary.othersCost += ad.metrics.cost;
            break;
        }
      });

      // คำนวณค่าเฉลี่ย
      if (adsData.length > 0) {
        summary.averageCtr = adsData.reduce((sum, ad) => sum + ad.metrics.ctr, 0) / adsData.length;
        summary.averageCpc = adsData.reduce((sum, ad) => sum + ad.metrics.cpc, 0) / adsData.length;
        summary.averageCpm = (summary.totalCost / summary.totalImpressions) * 1000;
      }

      return summary;
    } catch (error: any) {
      console.error('❌ Error getting Google Ads summary:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        code: error?.code,
        response: error?.response
      });
      throw error;
    }
  }

  /**
   * แปลงข้อมูลจาก Google Ads API เป็นรูปแบบที่ใช้ในระบบ (API v21)
   */
  private transformAdsData(apiData: any[], level: 'campaign' | 'account' = 'campaign'): GoogleAdsData[] {
    return apiData.map(item => ({
      campaignId: level === 'account' ? item.customer?.id?.toString() || '' : item.campaign?.id?.toString() || '',
      campaignName: level === 'account' ? item.customer?.descriptiveName || 'Account' : item.campaign?.name || '',
      campaignStatus: level === 'account' ? 'ACCOUNT' : (item.campaign?.status || 'UNKNOWN'),
      metrics: {
        impressions: parseInt(item.metrics?.impressions || '0'),
        clicks: parseInt(item.metrics?.clicks || '0'),
        cost: parseFloat(item.metrics?.costMicros || '0') / 1000000, // แปลงจาก micros เป็น THB
        conversions: parseFloat(item.metrics?.conversions || '0'),
        ctr: parseFloat(item.metrics?.ctr || '0'),
        cpc: parseFloat(item.metrics?.averageCpc || '0') / 1000000, // แปลงจาก micros เป็น THB
        cpm: 0, // จะคำนวณภายหลัง
        costPerConversion: parseFloat(item.metrics?.costPerConversion || '0') / 1000000,
        conversionRate: parseFloat(item.metrics?.conversionsFromInteractionsRate || '0')
      },
      dateStart: item.segments?.date || '',
      dateEnd: item.segments?.date || '',
      category: level === 'account' ? 'Others' : this.categorizeAd(item.campaign?.name || '')
    }));
  }

  /**
   * จำแนกประเภท Ads ตามชื่อ campaign หรือ ad
   */
  private categorizeAd(name: string): 'Package' | 'Wholesales' | 'Others' {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('package') || lowerName.includes('แพ็คเกจ')) {
      return 'Package';
    } else if (lowerName.includes('wholesale') || lowerName.includes('โฮลเซล') || lowerName.includes('wh')) {
      return 'Wholesales';
    } else {
      return 'Others';
    }
  }

  /**
   * Refresh Access Token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      // ตรวจสอบค่า config
      if (!this.config.clientId) {
        throw new Error('Google Ads Client ID is missing');
      }
      if (!this.config.clientSecret) {
        throw new Error('Google Ads Client Secret is missing');
      }
      if (!this.config.refreshToken) {
        throw new Error('Google Ads Refresh Token is missing');
      }

      const url = 'https://oauth2.googleapis.com/token';
      
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token'
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('❌ OAuth Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        
        let errorDetails = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetails = errorJson.error_description || errorJson.error || responseText;
        } catch (e) {
          // Response is not JSON
        }
        
        throw new Error(`OAuth Error: ${response.status} - ${errorDetails}`);
      }

      const data = JSON.parse(responseText);
      this.accessToken = data.access_token;
    } catch (error) {
      console.error('❌ Error refreshing Google Ads access token:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบการเชื่อมต่อ Google Ads API (API v21)
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.refreshAccessToken();
      
      const url = `${this.baseUrl}/customers/${this.config.customerId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'developer-token': this.config.developerToken
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Google Ads API connection test failed:', error);
      return false;
    }
  }
}

export default GoogleAdsService;
