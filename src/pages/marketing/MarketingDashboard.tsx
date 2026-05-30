import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  EMPTY_MARKETING_DASHBOARD,
  fetchMarketingDashboardSummary,
  type MarketingDashboardData,
} from "@/utils/marketingDashboardUtils";
import {
  Target,
  BarChart3,
  DollarSign,
  Coins,
  MessageSquare,
  Facebook,
  Chrome
} from "lucide-react";

const getDateRangeStrings = (dateRange: DateRange | undefined) => {
  let startDate: string, endDate: string;

  if (dateRange && dateRange.from) {
    const fromDate = dateRange.from;
    const toDate = dateRange.to || dateRange.from;

    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const startDateString = formatter.format(fromDate);
    startDate = startDateString + 'T00:00:00.000';

    const endDateString = formatter.format(toDate);
    endDate = endDateString + 'T23:59:59.999';
  } else {
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 30);

    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const startDateString = formatter.format(startDateObj);
    startDate = startDateString + 'T00:00:00.000';

    const endDateString = formatter.format(endDateObj);
    endDate = endDateString + 'T23:59:59.999';
  }

  return { startDate, endDate };
};

const MarketingDashboard = () => {
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });

  const [dashboardData, setDashboardData] = useState<MarketingDashboardData>(EMPTY_MARKETING_DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [facebookApiConnected, setFacebookApiConnected] = useState(false);
  const [googleApiConnected, setGoogleApiConnected] = useState(false);

  const dateRangeStrings = useMemo(() => getDateRangeStrings(dateRangeFilter), [dateRangeFilter]);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!dateRangeStrings.startDate || !dateRangeStrings.endDate) return;

      try {
        setLoading(true);
        const result = await fetchMarketingDashboardSummary(
          dateRangeStrings.startDate,
          dateRangeStrings.endDate,
        );
        setDashboardData(result.data);
        setFacebookApiConnected(result.facebookApiConnected);
        setGoogleApiConnected(result.googleApiConnected);
      } catch (error) {
        console.error('❌ Error fetching marketing dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [dateRangeStrings.startDate, dateRangeStrings.endDate]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "ไม่มีข้อมูล";
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "ไม่มีข้อมูล";
    return num.toLocaleString('th-TH');
  };

  const formatPercentage = (num: number | null) => {
    if (num === null) return "ไม่มีข้อมูล";
    return num.toFixed(1) + '%';
  };

  return (
    <div className="p-1 min-h-screen flex flex-col">
      <div className="mb-2 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Marketing Dashboard</h1>
          {dateRangeFilter?.from && dateRangeFilter?.to && (
            <p className="text-sm text-gray-600 mt-1">
              ข้อมูลช่วง: {dateRangeFilter.from.toLocaleDateString('th-TH')} - {dateRangeFilter.to.toLocaleDateString('th-TH')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker
            value={dateRangeFilter}
            onChange={setDateRangeFilter}
            placeholder="เลือกช่วงเวลา"
          />
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              กำลังโหลดข้อมูล...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="flex flex-col gap-2">
          <Card className="bg-gradient-to-br from-white to-gray-50 border-2 border-yellow-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              <div className="text-center mb-2">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">ยอดขาย ทั้งหมด</h3>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-700 p-2 rounded-xl shadow-lg">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatNumber(dashboardData.totalSales)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
                  <h4 className="text-2xl font-bold text-blue-900 mb-2 text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">PACKAGE</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">ยอดขาย</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.sales)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Lead ใหม่</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.newLeads)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">QT ที่ออกทั้งหมด</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.totalQtDocuments)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">PK ออก QT(ยังไม่ปิดการขาย)</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.pkOutQt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Win QT (ปิดการขายแล้ว)</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.package.win)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Win Rate (QT)</p>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.package.winRateQt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-base mb-1 text-center font-medium">Conversion Rate (Lead)</p>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-md">
                          <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.package.conversionRate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl border border-orange-200">
                  <h4 className="text-2xl font-bold text-orange-900 mb-2 text-center bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">WHOLESALES</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">ยอดขาย</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.sales)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Lead ใหม่</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.newLeads)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">QT ที่ออกทั้งหมด</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.totalQtDocuments)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">WH ออก QT (ยังไม่ปิดการขาย)</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.whOutQt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Win QT (ปิดการขายเเล้ว)</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.wholesales.winQt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Win Rate (QT)</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.wholesales.winRateQt)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base mb-1 text-center font-medium">Conversion Rate (Lead)</p>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-lg shadow-md">
                        <p className="text-white text-lg font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.wholesales.conversionRate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-2">
          <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">งบ Ads ทั้งหมด</h3>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-xl shadow-lg mb-4">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatCurrency(dashboardData.totalAdBudget)}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Facebook className="h-6 w-6 text-blue-500" />
                  <span className="text-gray-900 font-bold text-lg">FacebookAds</span>
                  <div className={`w-3 h-3 rounded-full ${facebookApiConnected ? 'bg-green-500' : 'bg-red-500'}`}
                       title={facebookApiConnected ? 'เชื่อมต่อ Facebook API สำเร็จ' : 'ไม่สามารถเชื่อมต่อ Facebook API ได้'}></div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-xl shadow-md mb-3">
                  {facebookApiConnected ? (
                    <p className="text-white font-bold text-xl text-center drop-shadow-sm">{formatCurrency(dashboardData.facebookAds.total)}</p>
                  ) : (
                    <p className="text-white font-bold text-lg text-center drop-shadow-sm">ไม่สามารถดึงข้อมูลได้</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2 font-medium">FBAds Package</p>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-xl shadow-sm">
                      {facebookApiConnected ? (
                        <p className="text-white text-lg font-bold drop-shadow-sm">{formatCurrency(dashboardData.facebookAds.package)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2 font-medium">FBAds Wholesales</p>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-xl shadow-sm">
                      {facebookApiConnected ? (
                        <p className="text-white text-lg font-bold drop-shadow-sm">{formatCurrency(dashboardData.facebookAds.wholesales)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2 font-medium">FBAds อื่นๆ</p>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-xl shadow-sm">
                      {facebookApiConnected ? (
                        <p className="text-white text-lg font-bold drop-shadow-sm">{formatCurrency(dashboardData.facebookAds.others)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Chrome className="h-6 w-6 text-orange-500" />
                  <span className="text-gray-900 font-bold text-lg">GoogleAds</span>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-4 rounded-xl shadow-md">
                  <p className="text-white font-bold text-xl text-center drop-shadow-sm">{formatCurrency(dashboardData.googleAds.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">ค่า Ads / Lead</h3>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 rounded-xl shadow-lg mb-4">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatNumber(dashboardData.adCostPerLead)}</p>
                </div>
                <div className="mb-3">
                  <p className="text-gray-600 text-lg font-semibold">Lead ใหม่ ทั้งหมด</p>
                </div>
                <div className="bg-gradient-to-br from-gray-500 to-gray-700 p-4 rounded-xl shadow-lg">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatNumber(dashboardData.totalNewLeads)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-2">
          <Card className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Inbox จาก Ads ทั้งหมด</h3>
                  <div className={`w-3 h-3 rounded-full ${facebookApiConnected ? 'bg-green-500' : 'bg-red-500'}`}
                       title={facebookApiConnected ? 'เชื่อมต่อ Facebook API สำเร็จ' : 'ไม่สามารถเชื่อมต่อ Facebook API ได้'}></div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-4 rounded-xl shadow-lg mb-4">
                  {facebookApiConnected ? (
                    <p className="text-white text-2xl font-bold drop-shadow-lg">{formatNumber(dashboardData.totalInboxFromAds)}</p>
                  ) : (
                    <p className="text-white text-lg font-bold drop-shadow-lg">ไม่สามารถดึงข้อมูลได้</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ข้อความ ฝั่ง Package</p>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.inboxBreakdown.packageMessages)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ต้นทุนต่อข้อความ ฝั่ง Package</p>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatCurrency(dashboardData.inboxBreakdown.packageCostPerMessage)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ข้อความ ฝั่ง Wholesales</p>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.inboxBreakdown.wholesalesMessages)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ต้นทุนต่อข้อความ ฝั่ง Wholesales</p>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatCurrency(dashboardData.inboxBreakdown.wholesalesCostPerMessage)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ข้อความ สินค้าอื่นๆ</p>
                    <div className="bg-gradient-to-br from-gray-500 to-gray-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatNumber(dashboardData.inboxBreakdown.otherMessages)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ต้นทุนต่อข้อความ ฝั่ง บริการอื่นๆ</p>
                    <div className="bg-gradient-to-br from-gray-500 to-gray-700 p-2 rounded-xl shadow-md">
                      {facebookApiConnected ? (
                        <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatCurrency(dashboardData.inboxBreakdown.otherCostPerMessage)}</p>
                      ) : (
                        <p className="text-white text-sm font-bold text-center drop-shadow-sm">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Overall RoAS</h3>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 rounded-xl shadow-lg mb-4">
                  <p className="text-white text-2xl font-bold drop-shadow-lg">{formatPercentage(dashboardData.overallRoas)}</p>
                </div>
                <p className="text-gray-500 text-sm mb-4 font-medium">*Return on Ad Spend - % ผลลัพธ์จากการลงทุน</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ROAS ฝั่ง Package</p>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-md">
                      <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.packageRoas)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-2 text-center font-medium">ROAS ฝั่ง Wholesales</p>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2 rounded-xl shadow-md">
                      <p className="text-white text-xl font-bold text-center drop-shadow-sm">{formatPercentage(dashboardData.wholesalesRoas)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketingDashboard;
