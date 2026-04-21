/**
 * Facebook Ads Integration Example
 * ตัวอย่างการใช้งาน Facebook Ads integration ในระบบ CRM
 */

import { 
  getFacebookAdsData, 
  calculateFacebookRoas, 
  calculateFacebookCostPerLead,
  testFacebookConnection,
  isFacebookApiConfigured,
  createMockFacebookAdsData
} from '@/utils/facebookAdsUtils';

/**
 * ตัวอย่างการดึงข้อมูล Facebook Ads สำหรับ Marketing Dashboard
 */
export async function fetchMarketingDashboardData(startDate: string, endDate: string) {
  console.log('🚀 เริ่มดึงข้อมูล Marketing Dashboard...');
  
  // ตรวจสอบการตั้งค่า Facebook API
  if (!isFacebookApiConfigured()) {
    console.warn('⚠️ Facebook API ไม่ได้ตั้งค่า ใช้ข้อมูล Mock');
    return createMockFacebookAdsData();
  }

  // ทดสอบการเชื่อมต่อ
  const isConnected = await testFacebookConnection();
  if (!isConnected) {
    console.error('❌ ไม่สามารถเชื่อมต่อ Facebook API ได้');
    return createMockFacebookAdsData();
  }

  console.log('✅ เชื่อมต่อ Facebook API สำเร็จ');

  try {
    // ดึงข้อมูล Facebook Ads
    const facebookData = await getFacebookAdsData(startDate, endDate);
    
    if (!facebookData) {
      console.warn('⚠️ ไม่สามารถดึงข้อมูล Facebook Ads ได้ ใช้ข้อมูล Mock');
      return createMockFacebookAdsData();
    }

    console.log('📊 ข้อมูล Facebook Ads ที่ดึงมา:');
    console.log(`- งบโฆษณารวม: ${facebookData.totalSpend.toLocaleString('th-TH')} บาท`);
    console.log(`- จำนวนการแสดงผล: ${facebookData.totalImpressions.toLocaleString('th-TH')}`);
    console.log(`- จำนวนการคลิก: ${facebookData.totalClicks.toLocaleString('th-TH')}`);
    console.log(`- จำนวนผลลัพธ์: ${facebookData.totalResults.toLocaleString('th-TH')}`);
    console.log(`- CTR เฉลี่ย: ${facebookData.averageCtr.toFixed(2)}%`);
    console.log(`- CPC เฉลี่ย: ${facebookData.averageCpc.toFixed(2)} บาท`);
    console.log(`- CPM เฉลี่ย: ${facebookData.averageCpm.toFixed(2)} บาท`);

    return facebookData;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล Facebook Ads:', error);
    return createMockFacebookAdsData();
  }
}

/**
 * ตัวอย่างการคำนวณ ROAS
 */
export function calculateMarketingRoas(facebookSpend: number, salesValue: number) {
  const roas = calculateFacebookRoas(facebookSpend, salesValue);
  
  if (roas === null) {
    console.log('❌ ไม่สามารถคำนวณ ROAS ได้ (งบโฆษณาเป็น 0 หรือติดลบ)');
    return null;
  }

  console.log(`📈 ROAS: ${roas.toFixed(2)}%`);
  console.log(`💰 ยอดขาย: ${salesValue.toLocaleString('th-TH')} บาท`);
  console.log(`💸 งบโฆษณา: ${facebookSpend.toLocaleString('th-TH')} บาท`);
  
  return roas;
}

/**
 * ตัวอย่างการคำนวณ Cost per Lead
 */
export function calculateMarketingCostPerLead(facebookSpend: number, totalLeads: number) {
  const costPerLead = calculateFacebookCostPerLead(facebookSpend, totalLeads);
  
  if (costPerLead === null) {
    console.log('❌ ไม่สามารถคำนวณ Cost per Lead ได้ (จำนวน Lead เป็น 0 หรือติดลบ)');
    return null;
  }

  console.log(`🎯 Cost per Lead: ${costPerLead.toFixed(2)} บาท`);
  console.log(`👥 จำนวน Lead: ${totalLeads.toLocaleString('th-TH')} คน`);
  console.log(`💸 งบโฆษณา: ${facebookSpend.toLocaleString('th-TH')} บาท`);
  
  return costPerLead;
}

/**
 * ตัวอย่างการวิเคราะห์ประสิทธิภาพ Facebook Ads
 */
export function analyzeFacebookAdsPerformance(facebookData: any) {
  console.log('📊 การวิเคราะห์ประสิทธิภาพ Facebook Ads:');
  
  // วิเคราะห์ CTR
  if (facebookData.averageCtr > 2.0) {
    console.log('✅ CTR ดีเยี่ยม (>2%)');
  } else if (facebookData.averageCtr > 1.0) {
    console.log('👍 CTR ดี (>1%)');
  } else {
    console.log('⚠️ CTR ควรปรับปรุง (<1%)');
  }

  // วิเคราะห์ CPC
  if (facebookData.averageCpc < 5.0) {
    console.log('✅ CPC ต่ำดี (<5 บาท)');
  } else if (facebookData.averageCpc < 10.0) {
    console.log('👍 CPC ปานกลาง (5-10 บาท)');
  } else {
    console.log('⚠️ CPC สูง (>10 บาท)');
  }

  // วิเคราะห์ CPM
  if (facebookData.averageCpm < 50.0) {
    console.log('✅ CPM ต่ำดี (<50 บาท)');
  } else if (facebookData.averageCpm < 100.0) {
    console.log('👍 CPM ปานกลาง (50-100 บาท)');
  } else {
    console.log('⚠️ CPM สูง (>100 บาท)');
  }

  // วิเคราะห์การกระจายงบ
  const totalSpend = facebookData.totalSpend;
  const packagePercentage = (facebookData.packageSpend / totalSpend) * 100;
  const wholesalesPercentage = (facebookData.wholesalesSpend / totalSpend) * 100;
  const othersPercentage = (facebookData.othersSpend / totalSpend) * 100;

  console.log('💰 การกระจายงบโฆษณา:');
  console.log(`- Package: ${packagePercentage.toFixed(1)}% (${facebookData.packageSpend.toLocaleString('th-TH')} บาท)`);
  console.log(`- Wholesales: ${wholesalesPercentage.toFixed(1)}% (${facebookData.wholesalesSpend.toLocaleString('th-TH')} บาท)`);
  console.log(`- อื่นๆ: ${othersPercentage.toFixed(1)}% (${facebookData.othersSpend.toLocaleString('th-TH')} บาท)`);
}

/**
 * ตัวอย่างการใช้งานแบบครบวงจร
 */
export async function runMarketingAnalysis() {
  console.log('🎯 เริ่มการวิเคราะห์ Marketing...');
  
  // กำหนดช่วงวันที่ (7 วันที่ผ่านมา)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`📅 ช่วงวันที่: ${startDateStr} ถึง ${endDateStr}`);
  
  // ดึงข้อมูล Facebook Ads
  const facebookData = await fetchMarketingDashboardData(startDateStr, endDateStr);
  
  // วิเคราะห์ประสิทธิภาพ
  analyzeFacebookAdsPerformance(facebookData);
  
  // ตัวอย่างการคำนวณ ROAS (สมมติยอดขาย 100,000 บาท)
  const salesValue = 100000;
  const roas = calculateMarketingRoas(facebookData.totalSpend, salesValue);
  
  // ตัวอย่างการคำนวณ Cost per Lead (สมมติมี Lead 50 คน)
  const totalLeads = 50;
  const costPerLead = calculateMarketingCostPerLead(facebookData.totalSpend, totalLeads);
  
  console.log('✅ การวิเคราะห์ Marketing เสร็จสิ้น');
  
  return {
    facebookData,
    roas,
    costPerLead,
    analysis: {
      period: `${startDateStr} ถึง ${endDateStr}`,
      totalSpend: facebookData.totalSpend,
      totalImpressions: facebookData.totalImpressions,
      totalClicks: facebookData.totalClicks,
      totalResults: facebookData.totalResults,
      averageCtr: facebookData.averageCtr,
      averageCpc: facebookData.averageCpc,
      averageCpm: facebookData.averageCpm
    }
  };
}

// Export สำหรับการใช้งานใน components
export default {
  fetchMarketingDashboardData,
  calculateMarketingRoas,
  calculateMarketingCostPerLead,
  analyzeFacebookAdsPerformance,
  runMarketingAnalysis
};
