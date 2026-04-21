import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, TrendingUp, Activity } from "lucide-react";
import { useInventoryDataAPI as useInventoryData } from "@/hooks/useInventoryDataAPI";

// Chart components
import { ReactECharts } from '@/utils/echartsLoader.tsx';

const InventoryDashboard: React.FC = () => {
  // ใช้ centralized inventory data hook
  const { 
    data: inventoryData, 
    isLoading: inventoryLoading 
  } = useInventoryData({
    includeProducts: true,
    includeSuppliers: true,
    includeCustomers: true,
    includeSalesDocs: true,
    includePurchaseOrders: true
  });

  const { 
    products = [], 
    suppliers = [], 
    customers = [], 
    salesDocs = [],
    purchaseOrders = []
  } = inventoryData || {};

  // คำนวณสถิติต่างๆ
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.is_active).length;
    const totalSuppliers = suppliers.length;
    const totalCustomers = customers.length;
    const totalSalesDocs = salesDocs.length;

    return {
      totalProducts,
      activeProducts,
      totalSuppliers,
      totalCustomers,
      totalSalesDocs
    };
  }, [products, suppliers, customers, salesDocs]);

  // Data for charts
  const chartData = useMemo(() => {

    // Monthly Sales Trend (Last 6 months)
    const monthlySalesData = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('th-TH', { month: 'short' });
      const monthSales = salesDocs
        .filter(doc => {
          const docDate = new Date(doc.doc_date);
          return docDate.getMonth() === date.getMonth() && docDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, doc) => sum + (doc.total_amount || 0), 0);
      
      monthlySalesData.push({
        month: monthName,
        sales: monthSales
      });
    }

    // Top Products by Sales Performance - ใช้ข้อมูลจริงจาก sales_doc_items
    const topProductsData = [];
    
    // สร้าง Map เพื่อเก็บข้อมูลการขายของแต่ละสินค้า
    const productSalesMap = new Map();
    

    
    // นับจำนวนการขายจาก sales_doc_items
    salesDocs.forEach((doc, docIndex) => {
      if (doc.sales_doc_items && Array.isArray(doc.sales_doc_items)) {
        doc.sales_doc_items.forEach((item, itemIndex) => {
          if (item.product_id) {
            const product = products.find(p => p.id === item.product_id);
            const productName = product?.name || `Product ${item.product_id}`;
            const currentCount = productSalesMap.get(productName) || 0;
            const quantity = item.qty || 1;
            productSalesMap.set(productName, currentCount + quantity);
            

          }
        });
      }
    });

    // แปลงเป็น array และเรียงลำดับตามจำนวนการขาย
    const sortedProducts = Array.from(productSalesMap.entries())
      .map(([name, salesCount]) => {
        const product = products.find(p => p.name === name);
        return {
          name,
          stock: product ? (product.stock_available || 0) : 0,
          salesCount: salesCount,
          value: product ? (product.stock_available || 0) * (product.unit_price || 0) : 0
        };
      })
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);
    
    // ถ้าไม่มีข้อมูลการขาย ให้ใช้ข้อมูล stock เป็นหลัก
    if (sortedProducts.length === 0 || sortedProducts.every(p => p.salesCount === 0)) {
      const stockBasedProducts = products
        .filter(product => product.is_active && (product.stock_available || 0) > 0)
        .map(product => ({
          name: product.name,
          stock: product.stock_available || 0,
          salesCount: product.stock_available || 0, // ใช้ stock เป็น salesCount เพื่อแสดง chart
          value: (product.stock_available || 0) * (product.unit_price || 0)
        }))
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5);
      
      topProductsData.push(...stockBasedProducts);
    } else {
      topProductsData.push(...sortedProducts);
    }



    // Purchase Orders Product Count (Last 6 months) - แก้ไขให้ใช้ purchase_order_items
    const poProductCountData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('th-TH', { month: 'short' });
      
      const monthPOs = purchaseOrders.filter(po => {
        const poDate = new Date(po.created_at);
        return poDate.getMonth() === date.getMonth() && poDate.getFullYear() === date.getFullYear();
      });
      
      // คำนวณจำนวนสินค้าทั้งหมดใน PO ของเดือนนั้น
      const totalProducts = monthPOs.reduce((sum, po) => {
        // ใช้ purchase_order_items แทน lead_products
        if (po.purchase_order_items && Array.isArray(po.purchase_order_items)) {
          return sum + po.purchase_order_items.reduce((itemSum, item) => itemSum + (item.qty || 0), 0);
        }
        // ถ้าไม่มีข้อมูลจริง ให้ใช้ค่า 0
        return sum + 0;
      }, 0);
      
      poProductCountData.push({
        month: monthName,
        productCount: totalProducts
      });
    }

    // Purchase Orders Count (Last 6 months) - สำหรับรวมกับ chart ยอดเงิน
    const poCountData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('th-TH', { month: 'short' });
      
      const monthPOs = purchaseOrders.filter(po => {
        const poDate = new Date(po.created_at);
        return poDate.getMonth() === date.getMonth() && poDate.getFullYear() === date.getFullYear();
      }).length;
      
      poCountData.push({
        month: monthName,
        count: monthPOs
      });
    }

    // Purchase Orders Amount (Last 6 months)
    const poAmountData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('th-TH', { month: 'short' });
      
      const monthPOAmount = purchaseOrders.filter(po => {
        const poDate = new Date(po.created_at);
        return poDate.getMonth() === date.getMonth() && poDate.getFullYear() === date.getFullYear();
      }).reduce((sum, po) => sum + (po.total_amount || 0), 0);
      
      poAmountData.push({
        month: monthName,
        amount: monthPOAmount
      });
    }

    // Suppliers Purchase Amount Data
    const suppliersPurchaseData = [];
    const supplierPurchaseMap = new Map();
    
    // คำนวณยอดสั่งซื้อของแต่ละ supplier
    purchaseOrders.forEach(po => {
      if (po.supplier_id) {
        const supplier = suppliers.find(s => s.id === po.supplier_id);
        const supplierName = supplier ? supplier.name : `Supplier ${po.supplier_id}`;
        const currentAmount = supplierPurchaseMap.get(supplierName) || 0;
        supplierPurchaseMap.set(supplierName, currentAmount + (po.total_amount || 0));
      }
    });
    
    // แปลงเป็น array และเรียงลำดับตามยอดเงิน
    const sortedSuppliers = Array.from(supplierPurchaseMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // แสดงเฉพาะ Top 8 suppliers
    
    suppliersPurchaseData.push(...sortedSuppliers);

    // Revenue vs Expenses (Last 6 months)
    const revenueExpensesData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('th-TH', { month: 'short' });
      
      const monthRevenue = salesDocs.filter(doc => {
        const docDate = new Date(doc.doc_date);
        return docDate.getMonth() === date.getMonth() && docDate.getFullYear() === date.getFullYear();
      }).reduce((sum, doc) => sum + (doc.total_amount || 0), 0);
      
      const monthExpenses = purchaseOrders.filter(po => {
        const poDate = new Date(po.created_at);
        return poDate.getMonth() === date.getMonth() && poDate.getFullYear() === date.getFullYear();
      }).reduce((sum, po) => sum + (po.total_amount || 0), 0);
      
      revenueExpensesData.push({
        month: monthName,
        revenue: monthRevenue,
        expenses: monthExpenses
      });
    }



    return {
      monthlySalesData,
      topProductsData,
      poProductCountData,
      poCountData,
      poAmountData,
      suppliersPurchaseData,
      revenueExpensesData
    };
  }, [stats, products, salesDocs, purchaseOrders]);

  if (inventoryLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดคลังสินค้า</h1>
        <p className="text-gray-600 mt-1">ภาพรวมระบบคลังสินค้าและข้อมูลสำคัญ</p>
      </div>



      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Orders Product Count */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              ยอดจำนวนสินค้า PO แต่ละเดือน (6 เดือนล่าสุด)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ReactECharts
                option={{
                  title: {
                    text: 'จำนวนสินค้าใน PO รายเดือน',
                    left: 'center',
                    textStyle: {
                      fontSize: 14,
                      fontWeight: 'normal'
                    }
                  },
                  tooltip: {
                    trigger: 'axis',
                    formatter: function(params) {
                      return `${params[0].name}<br/>
                              <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params[0].color}"></span>
                              จำนวนสินค้า: ${params[0].value} รายการ`;
                    }
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'category',
                    data: chartData.poProductCountData.map(item => item.month),
                    axisLine: {
                      lineStyle: {
                        color: '#E5E7EB'
                      }
                    },
                    axisLabel: {
                      color: '#6B7280'
                    }
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: {
                      lineStyle: {
                        color: '#E5E7EB'
                      }
                    },
                    axisLabel: {
                      color: '#6B7280'
                    },
                    splitLine: {
                      lineStyle: {
                        color: '#F3F4F6'
                      }
                    }
                  },
                  series: [
                    {
                      name: 'จำนวนสินค้า',
                      type: 'bar',
                      data: chartData.poProductCountData.map(item => item.productCount),
                      itemStyle: {
                        color: {
                          type: 'linear',
                          x: 0,
                          y: 0,
                          x2: 0,
                          y2: 1,
                          colorStops: [
                            { offset: 0, color: '#10B981' },
                            { offset: 1, color: '#059669' }
                          ]
                        },
                        borderRadius: [4, 4, 0, 0]
                      }
                    }
                  ]
                }}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Purchase Amount Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              ยอดการสั่งซื้อสินค้าในแต่ละ Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ReactECharts
                option={{
                  title: {
                    text: 'ยอดสั่งซื้อตาม Suppliers (Top 8)',
                    left: 'center',
                    textStyle: {
                      fontSize: 14,
                      fontWeight: 'normal'
                    }
                  },
                  tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                      const percentage = ((params.value / chartData.suppliersPurchaseData.reduce((sum, item) => sum + item.amount, 0)) * 100).toFixed(1);
                      return `${params.name}<br/>
                              <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params.color}"></span>
                              ยอดสั่งซื้อ: ฿${params.value.toLocaleString()}<br/>
                              สัดส่วน: ${percentage}%`;
                    }
                  },
                  legend: {
                    type: 'scroll',
                    orient: 'vertical',
                    right: 10,
                    top: 'middle',
                    textStyle: {
                      fontSize: 11
                    }
                  },
                  series: [
                    {
                      name: 'ยอดสั่งซื้อ',
                      type: 'pie',
                      radius: ['40%', '70%'],
                      center: ['40%', '50%'],
                      avoidLabelOverlap: false,
                      itemStyle: {
                        borderRadius: 8,
                        borderColor: '#fff',
                        borderWidth: 2
                      },
                      label: {
                        show: false,
                        position: 'center'
                      },
                      emphasis: {
                        label: {
                          show: true,
                          fontSize: '18',
                          fontWeight: 'bold'
                        }
                      },
                      labelLine: {
                        show: false
                      },
                      data: chartData.suppliersPurchaseData.map((item, index) => ({
                        value: item.amount,
                        name: item.name,
                        itemStyle: {
                          color: [
                            '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
                            '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
                          ][index % 8]
                        }
                      }))
                    }
                  ]
                }}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              แนวโน้มการขายรายเดือน (6 เดือนล่าสุด)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ReactECharts
                option={{
                  title: {
                    text: 'แนวโน้มการขายรายเดือน',
                    left: 'center',
                    textStyle: {
                      fontSize: 14,
                      fontWeight: 'normal'
                    }
                  },
                  tooltip: {
                    trigger: 'axis',
                    formatter: function(params) {
                      return `${params[0].name}<br/>
                              <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params[0].color}"></span>
                              ยอดขาย: ฿${params[0].value.toLocaleString()}`;
                    }
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: chartData.monthlySalesData.map(item => item.month),
                    axisLine: {
                      lineStyle: {
                        color: '#E5E7EB'
                      }
                    },
                    axisLabel: {
                      color: '#6B7280'
                    }
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: {
                      lineStyle: {
                        color: '#E5E7EB'
                      }
                    },
                    axisLabel: {
                      color: '#6B7280',
                      formatter: function(value) {
                        return '฿' + (value / 1000) + 'K';
                      }
                    },
                    splitLine: {
                      lineStyle: {
                        color: '#F3F4F6'
                      }
                    }
                  },
                  series: [
                    {
                      name: 'ยอดขาย',
                      type: 'line',
                      stack: 'Total',
                      data: chartData.monthlySalesData.map(item => item.sales),
                      smooth: true,
                      lineStyle: {
                        width: 3,
                        color: '#8B5CF6'
                      },
                      itemStyle: {
                        color: '#8B5CF6',
                        borderColor: '#8B5CF6',
                        borderWidth: 2
                      },
                      areaStyle: {
                        color: {
                          type: 'linear',
                          x: 0,
                          y: 0,
                          x2: 0,
                          y2: 1,
                          colorStops: [
                            { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                            { offset: 1, color: 'rgba(139, 92, 246, 0.1)' }
                          ]
                        }
                      },
                      symbol: 'circle',
                      symbolSize: 8
                    }
                  ]
                }}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Top Products by Sales Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              สินค้าขายดี (ตามข้อมูลการขาย)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ReactECharts
                option={{
                  title: {
                    text: 'สินค้าขายดี (Top 5)',
                    left: 'center',
                    textStyle: {
                      fontSize: 14,
                      fontWeight: 'normal'
                    }
                  },
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                      type: 'shadow'
                    },
                    formatter: function(params) {
                      const item = chartData.topProductsData.find(p => p.name === params[0].name);
                      const salesCount = item?.salesCount || 0;
                      const stock = item?.stock || 0;
                      
                      return `${params[0].name}<br/>
                              <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params[0].color}"></span>
                              จำนวนขาย: ${salesCount} รายการ<br/>
                              จำนวนในคลัง: ${stock} รายการ`;
                    }
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'value',
                    axisLine: {
                      lineStyle: {
                        color: '#E5E7EB'
                      }
                    },
                    axisLabel: {
                      color: '#6B7280'
                    },
                    splitLine: {
                      lineStyle: {
                        color: '#F3F4F6'
                      }
                    }
                  },
                  yAxis: {
                    type: 'category',
                    data: chartData.topProductsData.map(item => item.name),
                    axisLine: {
                      lineStyle: {
                        color: '#E5E7EB'
                      }
                    },
                    axisLabel: {
                      color: '#6B7280',
                      width: 120,
                      overflow: 'truncate'
                    }
                  },
                  series: [
                    {
                      name: 'จำนวนขาย',
                      type: 'bar',
                      data: chartData.topProductsData.map(item => {
                        const salesCount = item.salesCount || 0;
                        // ถ้า salesCount เป็น 0 แต่มี stock ให้แสดง 1 เพื่อให้เห็น bar (จะแสดงค่าจริงใน tooltip)
                        const displayValue = salesCount === 0 && item.stock > 0 ? 0.1 : salesCount;
                        
                        return {
                          value: displayValue,
                          itemStyle: {
                            color: {
                              type: 'linear',
                              x: 0,
                              y: 0,
                              x2: 1,
                              y2: 0,
                              colorStops: [
                                { offset: 0, color: salesCount === 0 ? '#94A3B8' : '#F97316' },
                                { offset: 1, color: salesCount === 0 ? '#CBD5E1' : '#FB923C' }
                              ]
                            },
                            borderRadius: [0, 4, 4, 0]
                          }
                        };
                      })
                    }
                  ]
                }}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              รายได้รวมและค่าใช้จ่ายตามเอกสาร (6 เดือนล่าสุด)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ReactECharts
                option={{
                  title: {
                    text: 'รายได้รวมและค่าใช้จ่าย',
                    left: 'center',
                    textStyle: {
                      fontSize: 14,
                      fontWeight: 'normal'
                    }
                  },
                  tooltip: {
                    trigger: 'axis',
                    formatter: function(params) {
                      let result = `${params[0].name}<br/>`;
                      params.forEach(param => {
                        const color = param.color;
                        const value = param.seriesName === 'รายได้' ? 
                          '฿' + param.value.toLocaleString() : 
                          '฿' + param.value.toLocaleString();
                        result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color}"></span>${param.seriesName}: ${value}<br/>`;
                      });
                      return result;
                    }
                  },
                  legend: {
                    data: ['รายได้', 'ค่าใช้จ่าย'],
                    top: 'bottom'
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '15%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: chartData.revenueExpensesData.map(item => item.month),
                    axisLine: {
                      lineStyle: {
                        color: '#E5E7EB'
                      }
                    },
                    axisLabel: {
                      color: '#6B7280'
                    }
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: {
                      lineStyle: {
                        color: '#E5E7EB'
                      }
                    },
                    axisLabel: {
                      color: '#6B7280',
                      formatter: function(value) {
                        return '฿' + (value / 1000) + 'K';
                      }
                    },
                    splitLine: {
                      lineStyle: {
                        color: '#F3F4F6'
                      }
                    }
                  },
                  series: [
                    {
                      name: 'รายได้',
                      type: 'line',
                      data: chartData.revenueExpensesData.map(item => item.revenue),
                      smooth: true,
                      lineStyle: {
                        width: 3,
                        color: '#10B981'
                      },
                      itemStyle: {
                        color: '#10B981',
                        borderColor: '#10B981',
                        borderWidth: 2
                      },
                      areaStyle: {
                        color: {
                          type: 'linear',
                          x: 0,
                          y: 0,
                          x2: 0,
                          y2: 1,
                          colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
                          ]
                        }
                      },
                      symbol: 'circle',
                      symbolSize: 8
                    },
                    {
                      name: 'ค่าใช้จ่าย',
                      type: 'line',
                      data: chartData.revenueExpensesData.map(item => item.expenses),
                      smooth: true,
                      lineStyle: {
                        width: 3,
                        color: '#EF4444'
                      },
                      itemStyle: {
                        color: '#EF4444',
                        borderColor: '#EF4444',
                        borderWidth: 2
                      },
                      areaStyle: {
                        color: {
                          type: 'linear',
                          x: 0,
                          y: 0,
                          x2: 0,
                          y2: 1,
                          colorStops: [
                            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                            { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
                          ]
                        }
                      },
                      symbol: 'circle',
                      symbolSize: 8
                    }
                  ]
                }}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};

export default InventoryDashboard;