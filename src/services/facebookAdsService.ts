/**
 * Facebook Marketing API Service
 * สำหรับดึงข้อมูล Facebook Ads มาประมวลผลในระบบ CRM
 */

export interface FacebookPageConfig {
  pageId: string;
  pageAccessToken: string;
}

export interface FacebookAdsConfig {
  accessToken: string;           // System User Token (สำหรับ Marketing API)
  pageAccessToken: string;       // Page Access Token (สำหรับ Page API) — ใช้เมื่อมีแค่หนึ่งเพจ
  adAccountId: string;
  pageId?: string;
  /** หลายเพจ: [{ pageId, pageAccessToken }] — ถ้ามีจะใช้แทน pageId + pageAccessToken */
  pages?: FacebookPageConfig[];
  appId?: string;
  appSecret?: string;
}

export interface FacebookAdsMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  frequency: number;
  cpm: number;
  cpc: number;
  ctr: number;
  cost_per_result: number;
  results: number;
  result_rate: number;
  // v23.0 enhanced metrics
  conversion_rate_ranking?: string;
  quality_ranking?: string;
  engagement_rate_ranking?: string;
  video_play_actions?: number;
  video_30_sec_watched_actions?: number;
  video_p100_watched_actions?: number;
  video_p25_watched_actions?: number;
  video_p50_watched_actions?: number;
  video_p75_watched_actions?: number;
  video_p95_watched_actions?: number;
  // Actions array for conversion data
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
}

export interface FacebookAdsData {
  campaignId: string;
  campaignName: string;
  adSetId: string;
  adSetName: string;
  adId: string;
  adName: string;
  metrics: FacebookAdsMetrics;
  dateStart: string;
  dateStop: string;
  category?: 'Package' | 'Wholesales' | 'Others';
}

export interface FacebookAdsSummary {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalResults: number;
  averageCtr: number;
  averageCpc: number;
  averageCpm: number;
  packageSpend: number;
  wholesalesSpend: number;
  othersSpend: number;
  campaigns: FacebookAdsData[];
  // Messaging metrics from actions array
  totalMessagingConversations: number;
  packageMessagingConversations: number;
  wholesalesMessagingConversations: number;
  othersMessagingConversations: number;
}

export interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  created_time: string;
  updated_time: string;
}

export interface FacebookCreative {
  id?: string;
  image_url?: string;
  thumbnail_url?: string;
  title?: string;
  body?: string;
  effective_object_story_id?: string;
  message?: string;           // Caption ที่ดึงมาจาก Post
  full_picture?: string;      // รูปภาพความละเอียดสูง
  permalink_url?: string;     // ลิงก์โพสต์จริง
  attachments?: any;          // ข้อมูล media (photo/video/reel)
}

export interface FacebookAd {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  campaign?: { 
    id: string;
    name: string;
    status?: string;
    start_time?: string;
    stop_time?: string;
  };
  adset_id?: string;
  adset?: { 
    id: string;
    name: string;
  };
  creative?: FacebookCreative;
  created_time: string;
  updated_time?: string;
}

class FacebookAdsService {
  private config: FacebookAdsConfig;
  private baseUrl = 'https://graph.facebook.com/v23.0';

  constructor(config: FacebookAdsConfig) {
    this.config = config;
  }

  /**
   * ดึงข้อมูล Facebook Ads ตามช่วงวันที่ (API v23.0)
   */
  async getAdsData(
    startDate: string,
    endDate: string,
    fields: string[] = [
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      'cpm',
      'cpc',
      'ctr',
      'cost_per_result',
      'results',
      'result_rate',
      'date_start',
      'date_stop',
      // v23.0 enhanced fields
      'conversion_rate_ranking',
      'quality_ranking',
      'engagement_rate_ranking',
      'video_play_actions',
      'video_30_sec_watched_actions',
      'video_p100_watched_actions',
      'video_p25_watched_actions',
      'video_p50_watched_actions',
      'video_p75_watched_actions',
      'video_p95_watched_actions',
      // Actions array for conversion data
      'actions'
    ]
  ): Promise<FacebookAdsData[]> {
    try {
      
      const url = `${this.baseUrl}/act_${this.config.adAccountId}/insights`;
      
      const timeRange = {
        since: startDate,
        until: endDate
      };
      
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        fields: fields.join(','),
        time_range: JSON.stringify(timeRange),
        level: 'ad',
        limit: '1000'
      });


      const fullUrl = `${url}?${params}`;
      
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Facebook API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Facebook API Error:', data.error);
        throw new Error(`Facebook API Error: ${data.error.message}`);
      }

      const transformedData = this.transformAdsData(data.data || []);
      
      return transformedData;
    } catch (error) {
      console.error('❌ Error fetching Facebook Ads data:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลสรุป Facebook Ads
   */
  async getAdsSummary(startDate: string, endDate: string): Promise<FacebookAdsSummary> {
    try {
      
      const adsData = await this.getAdsData(startDate, endDate);
      
      const summary: FacebookAdsSummary = {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalResults: 0,
        averageCtr: 0,
        averageCpc: 0,
        averageCpm: 0,
        packageSpend: 0,
        wholesalesSpend: 0,
        othersSpend: 0,
        campaigns: adsData,
        // Messaging metrics from actions array
        totalMessagingConversations: 0,
        packageMessagingConversations: 0,
        wholesalesMessagingConversations: 0,
        othersMessagingConversations: 0
      };

      // คำนวณข้อมูลสรุป
      adsData.forEach((ad, index) => {
        summary.totalSpend += ad.metrics.spend;
        summary.totalImpressions += ad.metrics.impressions;
        summary.totalClicks += ad.metrics.clicks;
        summary.totalResults += ad.metrics.results;

        // Messaging conversations from actions array
        const messagingConversations = this.getMessagingConversationsFromActions(ad.metrics.actions);
        summary.totalMessagingConversations += messagingConversations;

        // แยกตาม category
        switch (ad.category) {
          case 'Package':
            summary.packageSpend += ad.metrics.spend;
            summary.packageMessagingConversations += messagingConversations;
            break;
          case 'Wholesales':
            summary.wholesalesSpend += ad.metrics.spend;
            summary.wholesalesMessagingConversations += messagingConversations;
            break;
          default:
            summary.othersSpend += ad.metrics.spend;
            summary.othersMessagingConversations += messagingConversations;
            break;
        }
      });

      // คำนวณค่าเฉลี่ย
      if (adsData.length > 0) {
        summary.averageCtr = adsData.reduce((sum, ad) => sum + ad.metrics.ctr, 0) / adsData.length;
        summary.averageCpc = adsData.reduce((sum, ad) => sum + ad.metrics.cpc, 0) / adsData.length;
        summary.averageCpm = adsData.reduce((sum, ad) => sum + ad.metrics.cpm, 0) / adsData.length;
      }

      
      return summary;
    } catch (error) {
      console.error('Error getting Facebook Ads summary:', error);
      throw error;
    }
  }

  /**
   * แปลงข้อมูลจาก Facebook API เป็นรูปแบบที่ใช้ในระบบ (API v23.0)
   */
  private transformAdsData(apiData: any[]): FacebookAdsData[] {
    return apiData.map(item => ({
      campaignId: item.campaign_id || '',
      campaignName: item.campaign_name || '',
      adSetId: item.adset_id || '',
      adSetName: item.adset_name || '',
      adId: item.ad_id || '',
      adName: item.ad_name || '',
      metrics: {
        impressions: parseFloat(item.impressions || '0'),
        clicks: parseFloat(item.clicks || '0'),
        spend: parseFloat(item.spend || '0'),
        reach: parseFloat(item.reach || '0'),
        frequency: parseFloat(item.frequency || '0'),
        cpm: parseFloat(item.cpm || '0'),
        cpc: parseFloat(item.cpc || '0'),
        ctr: parseFloat(item.ctr || '0'),
        cost_per_result: parseFloat(item.cost_per_result || '0'),
        results: parseFloat(item.results || '0'),
        result_rate: parseFloat(item.result_rate || '0'),
        // v23.0 enhanced metrics
        conversion_rate_ranking: item.conversion_rate_ranking || undefined,
        quality_ranking: item.quality_ranking || undefined,
        engagement_rate_ranking: item.engagement_rate_ranking || undefined,
        video_play_actions: parseFloat(item.video_play_actions || '0') || undefined,
        video_30_sec_watched_actions: parseFloat(item.video_30_sec_watched_actions || '0') || undefined,
        video_p100_watched_actions: parseFloat(item.video_p100_watched_actions || '0') || undefined,
        video_p25_watched_actions: parseFloat(item.video_p25_watched_actions || '0') || undefined,
        video_p50_watched_actions: parseFloat(item.video_p50_watched_actions || '0') || undefined,
        video_p75_watched_actions: parseFloat(item.video_p75_watched_actions || '0') || undefined,
        video_p95_watched_actions: parseFloat(item.video_p95_watched_actions || '0') || undefined,
        // Actions array for conversion data
        actions: item.actions || undefined
      },
      dateStart: item.date_start || '',
      dateStop: item.date_stop || '',
      category: this.categorizeAd(item.campaign_name || item.ad_name || '')
    }));
  }

  /**
   * จำแนกประเภท Ads ตามชื่อ campaign หรือ ad
   */
  private categorizeAd(name: string): 'Package' | 'Wholesales' | 'Others' {
    const lowerName = name.toLowerCase();
    
    // Package: มีคำว่า package หรือ inbox
    if (lowerName.includes('package') || lowerName.includes('แพ็คเกจ') || lowerName.includes('inbox')) {
      return 'Package';
    } 
    // Wholesales: มีคำว่า wholesale, wh, หรือ wholesales
    else if (lowerName.includes('wholesale') || lowerName.includes('โฮลเซล') || lowerName.includes('wh')) {
      return 'Wholesales';
    } 
    // Others: อื่นๆ
    else {
      return 'Others';
    }
  }

  /**
   * ดึงข้อมูล messaging conversations จาก actions array
   */
  private getMessagingConversationsFromActions(actions: Array<{action_type: string; value: string}> | undefined): number {
    if (!actions || !Array.isArray(actions)) {
      return 0;
    }

    const messagingAction = actions.find(action => 
      action.action_type === 'onsite_conversion.messaging_conversation_started_7d'
    );

    return messagingAction ? parseFloat(messagingAction.value || '0') : 0;
  }

  /**
   * ดึงข้อมูล Video Metrics สำหรับ Video Ads (API v23.0)
   */
  async getVideoMetrics(
    startDate: string,
    endDate: string,
    campaignIds?: string[]
  ): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/act_${this.config.adAccountId}/insights`;
      
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        fields: [
          'campaign_id',
          'campaign_name',
          'ad_id',
          'ad_name',
          'video_play_actions',
          'video_30_sec_watched_actions',
          'video_p100_watched_actions',
          'video_p25_watched_actions',
          'video_p50_watched_actions',
          'video_p75_watched_actions',
          'video_p95_watched_actions',
          'video_play_curve_actions',
          'video_avg_time_watched_actions',
          'video_complete_watched_actions'
        ].join(','),
        time_range: JSON.stringify({
          since: startDate,
          until: endDate
        }),
        level: 'ad',
        limit: '1000'
      });

      // เพิ่ม campaign filter หากระบุ
      if (campaignIds && campaignIds.length > 0) {
        params.append('filtering', JSON.stringify([{
          field: 'campaign.id',
          operator: 'IN',
          value: campaignIds
        }]));
      }

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Facebook API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API Error: ${data.error.message}`);
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching video metrics:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูล Quality Rankings (API v23.0)
   */
  async getQualityRankings(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/act_${this.config.adAccountId}/insights`;
      
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        fields: [
          'campaign_id',
          'campaign_name',
          'ad_id',
          'ad_name',
          'quality_ranking',
          'engagement_rate_ranking',
          'conversion_rate_ranking'
        ].join(','),
        time_range: JSON.stringify({
          since: startDate,
          until: endDate
        }),
        level: 'ad',
        limit: '1000'
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Facebook API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Facebook API Error: ${data.error.message}`);
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching quality rankings:', error);
      throw error;
    }
  }

  /**
   * ดึงรายการ Campaigns พร้อมข้อมูลและรูปภาพ (รองรับ pagination)
   */
  async getCampaigns(): Promise<FacebookCampaign[]> {
    try {
      let allCampaigns: FacebookCampaign[] = [];
      let nextUrl: string | null = `${this.baseUrl}/act_${this.config.adAccountId}/campaigns`;
      
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        fields: [
          'id',
          'name',
          'status',
          'objective',
          'created_time',
          'updated_time',
          'daily_budget',
          'lifetime_budget',
          'start_time',
          'stop_time'
        ].join(','),
        limit: '100' // จำกัด 100 รายการต่อ request
      });

      // Loop เพื่อดึงข้อมูลทั้งหมด (pagination)
      while (nextUrl) {
        const fullUrl = nextUrl.includes('?') ? nextUrl : `${nextUrl}?${params}`;
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error(`Facebook API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          console.error('❌ Facebook API Error:', data.error);
          throw new Error(`Facebook API Error: ${data.error.message}`);
        }

        // เพิ่มข้อมูลที่ได้
        if (data.data && data.data.length > 0) {
          allCampaigns = allCampaigns.concat(data.data);
        }

        // เช็คว่ามีหน้าถัดไปหรือไม่
        nextUrl = data.paging?.next || null;
        
        // ป้องกัน infinite loop (สูงสุด 1000 campaigns = 10 pages)
        if (allCampaigns.length >= 1000) {
          console.warn('⚠️ Reached maximum campaigns limit (1000)');
          break;
        }
      }

      console.log(`✅ Fetched ${allCampaigns.length} campaigns from Facebook`);
      return allCampaigns;
    } catch (error) {
      console.error('❌ Error fetching campaigns:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลโพสต์หลายตัวพร้อมกัน (Batch Request) - ใช้ Page Access Token
   * @param storyIds - Array ของ effective_object_story_id
   * @returns Object ที่มี key เป็น storyId และ value เป็นข้อมูลโพสต์
   */
  /**
   * ตรวจสอบว่า Page Access Token ยัง valid อยู่หรือไม่
   */
  private async validatePageAccessToken(): Promise<boolean> {
    if (!this.config.pageAccessToken || this.config.pageAccessToken.trim() === '') {
      return false;
    }

    try {
      // ใช้ Graph API เพื่อตรวจสอบ token
      const url = `${this.baseUrl}/me?access_token=${this.config.pageAccessToken}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return !data.error;
    } catch (error) {
      return false;
    }
  }

  /**
   * ดึงข้อมูลโพสต์หลายตัวแบบ batch
   * @param storyIds รายการ story ID (format: {pageId}_{postId})
   * @param tokenOverride ถ้าระบุ จะใช้ token นี้แทน config.pageAccessToken (สำหรับหลายเพจ)
   */
  private async getBatchPostDetails(
    storyIds: string[],
    tokenOverride?: string
  ): Promise<Record<string, any>> {
    if (storyIds.length === 0) return {};

    const token = tokenOverride ?? this.config.pageAccessToken;
    if (!token || token.trim() === '') {
      console.warn('⚠️ Page Access Token is not configured. Cannot fetch post details (captions).');
      console.warn('   Please set VITE_FACEBOOK_PAGE_ACCESS_TOKEN or VITE_FACEBOOK_PAGES in your .env file');
      return {};
    }

    // เมื่อใช้ tokenOverride (หลายเพจ) ไม่ validate ผ่าน validatePageAccessToken()
    if (!tokenOverride) {
      const isValidToken = await this.validatePageAccessToken();
      if (!isValidToken) {
      console.error('❌ Page Access Token is invalid or expired!');
      console.error('   Error: The session is invalid because the user logged out.');
      console.error('');
      console.error('📋 วิธีแก้ไข:');
      console.error('   1. ไปที่ Facebook Graph API Explorer: https://developers.facebook.com/tools/explorer/');
      console.error('   2. เลือก App และ Page ของคุณ');
      console.error('   3. Generate Page Access Token ใหม่');
      console.error('   4. คัดลอก Token และอัปเดตในไฟล์ .env:');
      console.error('      VITE_FACEBOOK_PAGE_ACCESS_TOKEN=EAALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
      console.error('   5. Restart dev server');
      return {};
      }
    }

    try {
      const BATCH_SIZE = 50;
      const results: Record<string, any> = {};
      let hasTokenError = false;

      for (let i = 0; i < storyIds.length; i += BATCH_SIZE) {
        // ถ้าเจอ token error แล้ว ให้หยุดเลย
        if (hasTokenError) {
          console.warn(`⚠️ Skipping remaining ${storyIds.length - i} posts due to token error`);
          break;
        }

        const batch = storyIds.slice(i, i + BATCH_SIZE);
        const ids = batch.join(',');
        
        const params = new URLSearchParams({
          ids: ids,
          fields: [
            'message',
            'full_picture',
            'permalink_url',
            'attachments{media_type,target{id},url,media{source}}',
            'created_time'
          ].join(','),
          access_token: token, // Page Token (หรือ tokenOverride เมื่อ sync หลายเพจ)
        });

        const url = `${this.baseUrl}/?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          let errorData: any = null;
          try {
            const errorText = await response.text();
            errorData = JSON.parse(errorText);
          } catch (e) {
            // ถ้า parse ไม่ได้ ให้ใช้ errorText ตรงๆ
          }
          
          // ตรวจสอบว่าเป็น token error หรือไม่
          const isTokenError = errorData?.error?.code === 190 || 
                              errorData?.error?.code === 200 ||
                              errorData?.error?.message?.includes('session is invalid') ||
                              errorData?.error?.message?.includes('logged out');
          
          if (isTokenError) {
            console.error('❌ Page Access Token is invalid or expired!');
            console.error(`   Error: ${errorData?.error?.message || 'Token validation failed'}`);
            console.error(`   Error Code: ${errorData?.error?.code || 'N/A'}`);
            console.error('');
            console.error('📋 วิธีแก้ไข:');
            console.error('   1. ไปที่ Facebook Graph API Explorer: https://developers.facebook.com/tools/explorer/');
            console.error('   2. เลือก App และ Page ของคุณ');
            console.error('   3. Generate Page Access Token ใหม่');
            console.error('   4. คัดลอก Token และอัปเดตในไฟล์ .env:');
            console.error('      VITE_FACEBOOK_PAGE_ACCESS_TOKEN=EAALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
            console.error('   5. Restart dev server');
            hasTokenError = true;
            break;
          }
          
          console.warn(`⚠️ Batch request failed (batch ${Math.floor(i / BATCH_SIZE) + 1}): ${response.status}`);
          if (errorData?.error) {
            console.warn(`   Error: ${errorData.error.message || errorData.error.type || 'Unknown error'}`);
            console.warn(`   Error Code: ${errorData.error.code || 'N/A'}`);
            console.warn(`   Error Subcode: ${errorData.error.error_subcode || 'N/A'}`);
          }
          console.warn(`   Retrying ${batch.length} posts individually...`);
          
          // Retry: ดึงทีละ ID
          const beforeRetryCount = Object.keys(results).length;
          let successCount = 0;
          let errorCount = 0;
          
          for (const storyId of batch) {
            // ถ้าเจอ token error แล้ว ให้หยุดเลย
            if (hasTokenError) {
              break;
            }

            try {
              // ใช้ token (หรือ tokenOverride) ไม่ใช้ this.config.pageAccessToken — โหมดหลายเพจอาจไม่มี PAGE_ACCESS_TOKEN
              const singleUrl = `${this.baseUrl}/${storyId}?fields=message,full_picture,permalink_url,attachments{media_type,target{id},url,media{source}},created_time&access_token=${token}`;
              const singleResponse = await fetch(singleUrl);
              
              if (singleResponse.ok) {
                const singleData = await singleResponse.json();
                if (!singleData.error) {
                  results[storyId] = singleData;
                  successCount++;
                } else {
                  // ตรวจสอบว่าเป็น token error หรือไม่
                  const isTokenError = singleData.error.code === 190 || 
                                      singleData.error.code === 200 ||
                                      singleData.error.message?.includes('session is invalid') ||
                                      singleData.error.message?.includes('logged out');
                  
                  if (isTokenError) {
                    console.error('❌ Page Access Token is invalid or expired!');
                    console.error(`   Error: ${singleData.error.message || 'Token validation failed'}`);
                    console.error(`   Error Code: ${singleData.error.code || 'N/A'}`);
                    console.error('');
                    console.error('📋 วิธีแก้ไข:');
                    console.error('   1. ไปที่ Facebook Graph API Explorer: https://developers.facebook.com/tools/explorer/');
                    console.error('   2. เลือก App และ Page ของคุณ');
                    console.error('   3. Generate Page Access Token ใหม่');
                    console.error('   4. คัดลอก Token และอัปเดตในไฟล์ .env:');
                    console.error('      VITE_FACEBOOK_PAGE_ACCESS_TOKEN=EAALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
                    console.error('   5. Restart dev server');
                    hasTokenError = true;
                    break;
                  }
                  
                  // Log error สำหรับแต่ละ post
                  if (singleData.error.code !== 100) { // 100 = Post not found (ปกติ)
                    console.warn(`   ⚠️ Post ${storyId}: ${singleData.error.message || 'Unknown error'}`);
                  }
                  errorCount++;
                }
              } else {
                const errorText = await singleResponse.text();
                try {
                  const errorJson = JSON.parse(errorText);
                  
                  // ตรวจสอบว่าเป็น token error หรือไม่
                  const isTokenError = errorJson.error?.code === 190 || 
                                      errorJson.error?.code === 200 ||
                                      errorJson.error?.message?.includes('session is invalid') ||
                                      errorJson.error?.message?.includes('logged out');
                  
                  if (isTokenError) {
                    console.error('❌ Page Access Token is invalid or expired!');
                    console.error(`   Error: ${errorJson.error?.message || 'Token validation failed'}`);
                    console.error(`   Error Code: ${errorJson.error?.code || 'N/A'}`);
                    console.error('');
                    console.error('📋 วิธีแก้ไข:');
                    console.error('   1. ไปที่ Facebook Graph API Explorer: https://developers.facebook.com/tools/explorer/');
                    console.error('   2. เลือก App และ Page ของคุณ');
                    console.error('   3. Generate Page Access Token ใหม่');
                    console.error('   4. คัดลอก Token และอัปเดตในไฟล์ .env:');
                    console.error('      VITE_FACEBOOK_PAGE_ACCESS_TOKEN=EAALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
                    console.error('   5. Restart dev server');
                    hasTokenError = true;
                    break;
                  }
                  
                  if (errorJson.error?.code !== 100) { // 100 = Post not found (ปกติ)
                    console.warn(`   ⚠️ Post ${storyId} (${singleResponse.status}): ${errorJson.error?.message || 'Unknown error'}`);
                  }
                } catch (e) {
                  // Ignore parse errors
                }
                errorCount++;
              }
            } catch (err: any) {
              // Silent fail - บาง post อาจถูกลบหรือเป็น private
              errorCount++;
            }
          }
          
          const recoveredCount = Object.keys(results).length - beforeRetryCount;
          console.log(`   ✅ Recovered ${recoveredCount}/${batch.length} posts via individual requests (${successCount} success, ${errorCount} errors)`);
          continue;
        }

        const data = await response.json();
        
        if (data.error) {
          // ตรวจสอบว่าเป็น token error หรือไม่
          const isTokenError = data.error.code === 190 || 
                              data.error.code === 200 ||
                              data.error.message?.includes('session is invalid') ||
                              data.error.message?.includes('logged out');
          
          if (isTokenError) {
            console.error('❌ Page Access Token is invalid or expired!');
            console.error(`   Error: ${data.error.message || 'Token validation failed'}`);
            console.error(`   Error Code: ${data.error.code || 'N/A'}`);
            console.error('');
            console.error('📋 วิธีแก้ไข:');
            console.error('   1. ไปที่ Facebook Graph API Explorer: https://developers.facebook.com/tools/explorer/');
            console.error('   2. เลือก App และ Page ของคุณ');
            console.error('   3. Generate Page Access Token ใหม่');
            console.error('   4. คัดลอก Token และอัปเดตในไฟล์ .env:');
            console.error('      VITE_FACEBOOK_PAGE_ACCESS_TOKEN=EAALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
            console.error('   5. Restart dev server');
            hasTokenError = true;
            break;
          }
          
          console.warn(`⚠️ Batch API error (batch ${Math.floor(i / BATCH_SIZE) + 1}):`, data.error.message || data.error);
          console.warn(`   Error Code: ${data.error.code || 'N/A'}`);
          console.warn(`   Error Subcode: ${data.error.error_subcode || 'N/A'}`);
          continue;
        }
        
        // Merge ผลลัพธ์ - กรองเฉพาะ posts ที่ไม่มี error
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'object' && !('error' in value)) {
            results[key] = value;
          } else if (value && typeof value === 'object' && 'error' in value) {
            // ตรวจสอบว่าเป็น token error หรือไม่
            const error = (value as any).error;
            const isTokenError = error.code === 190 || 
                                error.code === 200 ||
                                error.message?.includes('session is invalid') ||
                                error.message?.includes('logged out');
            
            if (isTokenError) {
              console.error('❌ Page Access Token is invalid or expired!');
              console.error(`   Error: ${error.message || 'Token validation failed'}`);
              console.error(`   Error Code: ${error.code || 'N/A'}`);
              console.error('');
              console.error('📋 วิธีแก้ไข:');
              console.error('   1. ไปที่ Facebook Graph API Explorer: https://developers.facebook.com/tools/explorer/');
              console.error('   2. เลือก App และ Page ของคุณ');
              console.error('   3. Generate Page Access Token ใหม่');
              console.error('   4. คัดลอก Token และอัปเดตในไฟล์ .env:');
              console.error('      VITE_FACEBOOK_PAGE_ACCESS_TOKEN=EAALxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
              console.error('   5. Restart dev server');
              hasTokenError = true;
              break;
            }
            
            // Log error สำหรับแต่ละ post ใน batch
            if (error.code !== 100) { // 100 = Post not found (ปกติ)
              console.warn(`   ⚠️ Post ${key}: ${error.message || 'Unknown error'}`);
            }
          }
        }
        
        if (hasTokenError) {
          break;
        }
        
        console.log(`✅ Fetched ${Object.keys(results).length} posts in batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      }

      return results;
    } catch (error: any) {
      console.error('❌ Error in batch post request:', error);
      console.error('   Error message:', error.message);
      return {};
    }
  }

  /**
   * ดึงรายการ Ads พร้อมรูปภาพ Creative (รองรับ pagination)
   * @param campaignId - ID ของ campaign (optional)
   * @param options - ตัวเลือกการกรอง (statusFilter: 'all' | 'active' | 'inactive')
   * @returns Object ที่มี ads และ captionFetchResult
   */
  async getAdsWithCreatives(
    campaignId?: string,
    options?: { statusFilter?: 'all' | 'active' | 'inactive' }
  ): Promise<FacebookAd[] & { __captionFetchResult?: any }> {
    try {
      let allAds: FacebookAd[] = [];
      let nextUrl: string | null = campaignId 
        ? `${this.baseUrl}/${campaignId}/ads`
        : `${this.baseUrl}/act_${this.config.adAccountId}/ads`;
      
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        fields: [
          'id',
          'name',
          'status',
          'campaign_id',
          'campaign{id,name,status,start_time,stop_time}',
          'adset_id',
          'adset{id,name}',
          'creative{image_url,thumbnail_url,title,body,effective_object_story_id}',
          'created_time',
          'updated_time'
        ].join(','),
        limit: '100' // จำกัด 100 รายการต่อ request
      });

      // เพิ่ม filtering ตาม status ถ้าระบุ
      if (options?.statusFilter && options.statusFilter !== 'all') {
        let statusValues: string[];
        if (options.statusFilter === 'active') {
          statusValues = ['ACTIVE'];
        } else {
          // inactive รวมถึง PAUSED, DISAPPROVED, PENDING_REVIEW, etc.
          statusValues = ['PAUSED', 'DISAPPROVED', 'PENDING_REVIEW', 'WITH_ISSUES'];
        }
        
        params.append('filtering', JSON.stringify([{
          field: 'ad.effective_status',
          operator: 'IN',
          value: statusValues
        }]));
      }

      // Loop เพื่อดึงข้อมูลทั้งหมด (pagination)
      while (nextUrl) {
        const fullUrl = nextUrl.includes('?') ? nextUrl : `${nextUrl}?${params}`;
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error(`Facebook API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          console.error('❌ Facebook API Error:', data.error);
          throw new Error(`Facebook API Error: ${data.error.message}`);
        }

        // เพิ่มข้อมูลที่ได้
        if (data.data && data.data.length > 0) {
          allAds = allAds.concat(data.data);
        }

        // เช็คว่ามีหน้าถัดไปหรือไม่
        nextUrl = data.paging?.next || null;
        
        // ป้องกัน infinite loop (สูงสุด 2000 ads = 20 pages)
        if (allAds.length >= 2000) {
          console.warn('⚠️ Reached maximum ads limit (2000)');
          break;
        }
      }

      console.log(`✅ Fetched ${allAds.length} ads from Facebook`);
      
      // รวบรวม story IDs ทั้งหมด
      const allStoryIds = allAds
        .map(ad => ad.creative?.effective_object_story_id)
        .filter((id): id is string => !!id && typeof id === 'string' && id.trim().length > 0);
      
      const uniqueStoryIds = Array.from(new Set(allStoryIds));
      const pages = this.config.pages;
      const pageId = this.config.pageId;
      const hasMultiPage = pages && pages.length > 0;

      let storyIds: string[] = [];
      if (hasMultiPage) {
        const pageIdsSet = new Set(pages!.map(p => p.pageId));
        storyIds = uniqueStoryIds.filter(id => {
          const parts = id.split('_');
          if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
          return pageIdsSet.has(parts[0]);
        });
      } else if (pageId) {
        storyIds = uniqueStoryIds.filter(id => {
          if (!id.startsWith(`${pageId}_`)) return false;
          const parts = id.split('_');
          return parts.length === 2 && !!parts[0] && !!parts[1];
        });
      } else {
        storyIds = uniqueStoryIds.filter(id => {
          const parts = id.split('_');
          return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
        });
      }

      console.log(`📊 Story IDs: ${allStoryIds.length} total → ${uniqueStoryIds.length} unique → ${storyIds.length} from our page(s) (validated)`);

      let captionFetchResult = {
        success: false,
        total: storyIds.length,
        enriched: 0,
        tokenExpired: false,
        tokenNotConfigured: false,
        errorMessage: null as string | null
      };

      const hasAnyToken = hasMultiPage || (this.config.pageAccessToken && this.config.pageAccessToken.trim() !== '');

      if (storyIds.length > 0) {
        console.log(`🔍 Fetching ${storyIds.length} post details in batch${hasMultiPage ? ` (${pages!.length} pages)` : ''}...`);

        if (!hasAnyToken) {
          console.warn('⚠️ Page Access Token is not configured. Skipping post details fetch.');
          console.warn('   Caption/ข้อความ will not be available. Please set VITE_FACEBOOK_PAGE_ACCESS_TOKEN or VITE_FACEBOOK_PAGES in your .env file');
          captionFetchResult.tokenNotConfigured = true;
          captionFetchResult.errorMessage = 'Page Access Token is not configured';
        } else {
          let postDetails: Record<string, any> = {};

          if (hasMultiPage) {
            const byPage: Record<string, string[]> = {};
            for (const id of storyIds) {
              const pid = id.split('_')[0];
              if (!byPage[pid]) byPage[pid] = [];
              byPage[pid].push(id);
            }
            for (const page of pages!) {
              const ids = byPage[page.pageId] || [];
              if (ids.length === 0) continue;
              const details = await this.getBatchPostDetails(ids, page.pageAccessToken);
              Object.assign(postDetails, details);
            }
          } else {
            postDetails = await this.getBatchPostDetails(storyIds);
          }

          const enrichedCount = Object.keys(postDetails).length;
          if (enrichedCount === 0 && storyIds.length > 0 && !hasMultiPage) {
            const isValidToken = await this.validatePageAccessToken();
            if (!isValidToken) {
              captionFetchResult.tokenExpired = true;
              captionFetchResult.errorMessage = 'Page Access Token is invalid or expired';
            }
          }

          for (const ad of allAds) {
            const storyId = ad.creative?.effective_object_story_id;
            if (storyId && postDetails[storyId]) {
              const post = postDetails[storyId];
              if (!ad.creative) ad.creative = {};
              ad.creative.message = post.message || null;
              ad.creative.full_picture = post.full_picture || null;
              ad.creative.permalink_url = post.permalink_url || null;
              ad.creative.attachments = post.attachments || null;
              if (post.message) {
                console.log(`📝 Caption for ad ${ad.id}: ${post.message.substring(0, 50)}...`);
              }
            }
          }

          captionFetchResult.enriched = enrichedCount;
          captionFetchResult.success = enrichedCount > 0;
          console.log(`✅ Successfully enriched ${enrichedCount}/${storyIds.length} ads with post details`);
        }
      } else {
        console.warn('⚠️ No valid story IDs found. Cannot fetch post details (captions).');
        captionFetchResult.errorMessage = 'No valid story IDs found';
      }
      
      // เพิ่ม metadata ลงใน ads object (ใช้เป็น workaround เพื่อส่งข้อมูลกลับไป)
      // เนื่องจาก TypeScript ไม่รองรับ return หลายค่า เราจะใช้วิธีนี้แทน
      (allAds as any).__captionFetchResult = captionFetchResult;
      
      return allAds;
    } catch (error) {
      console.error('❌ Error fetching ads with creatives:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบการเชื่อมต่อ Facebook API
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/act_${this.config.adAccountId}`;
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        fields: 'id,name,account_status'
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return !data.error && data.account_status === 1;
    } catch (error) {
      console.error('Facebook API connection test failed:', error);
      return false;
    }
  }
}

export default FacebookAdsService;
