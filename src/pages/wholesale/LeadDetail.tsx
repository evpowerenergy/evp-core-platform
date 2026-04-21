import React, { useEffect, useState } from "react";
import LeadDetail from "@/pages/LeadDetail";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/loading";

interface LeadProduct {
  id: number;
  product_id: number | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  cost_price: number | null;
  total_cost: number | null;
  profit: number | null;
  profit_percent: number | null;
  product: {
    name: string | null;
  } | null;
}

const ProductProposalSection = () => {
  const { id } = useParams();
  const [products, setProducts] = useState<LeadProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeadProducts = async () => {
      if (!id) return;
      setLoading(true);
      
      // ดึงข้อมูลสินค้าจาก lead_products โดยใช้ productivity_log_id
      const { data, error } = await supabase
        .from('lead_products')
        .select(`
          id, 
          product_id, 
          quantity, 
          unit_price, 
          total_price, 
          cost_price, 
          total_cost, 
          profit, 
          profit_percent,
          product:products(name)
        `)
        .eq('productivity_log_id', parseInt(id)); // กลับไปใช้ productivity_log_id
      
      if (error) {
        console.error('Error fetching lead products:', error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };
    fetchLeadProducts();
  }, [id]);

  const handleDeleteProduct = async (productId: number) => {
    const { error } = await supabase
      .from('lead_products')
      .delete()
      .eq('id', productId);
    
    if (error) {
      console.error('Error deleting product:', error);
    } else {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📦 รายการสินค้าที่เสนอขาย</span>
          <span className="text-sm font-normal text-gray-500">(Wholesale)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <PageLoading type="form" />
        ) : products.length === 0 ? (
          <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="mb-4">
              <span className="text-4xl">📦</span>
              <p className="text-gray-600 font-medium mt-2 mb-1">ยังไม่มีรายการสินค้า</p>
              <p className="text-gray-500 text-sm">เพิ่มรายการสินค้าในฟอร์มการติดตามเพื่อดูข้อมูลที่นี่</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">ชื่อสินค้า</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">จำนวน</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">ราคา/หน่วย</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">ราคารวม</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">ต้นทุน/หน่วย</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">ต้นทุนรวม</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">กำไร</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">% กำไร</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item, index) => (
                    <tr key={item.id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-3 py-2 font-medium text-gray-900">{item.product?.name || '-'}</td>
                      <td className="px-3 py-2 text-center text-gray-700">{item.quantity?.toLocaleString() || 0}</td>
                      <td className="px-3 py-2 text-right text-gray-700">฿{item.unit_price?.toLocaleString() || '-'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-blue-600">฿{item.total_price?.toLocaleString() || '-'}</td>
                      <td className="px-3 py-2 text-right text-gray-600">฿{item.cost_price?.toLocaleString() || '-'}</td>
                      <td className="px-3 py-2 text-right text-gray-600">฿{item.total_cost?.toLocaleString() || '-'}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${(item.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ฿{item.profit?.toLocaleString() || '-'}
                      </td>
                      <td className={`px-3 py-2 text-right font-semibold ${(item.profit_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.profit_percent ? item.profit_percent.toFixed(1) + '%' : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteProduct(item.id)}
                          className="hover:bg-red-700"
                        >
                          ลบ
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* สรุปยอดรวม */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">ยอดขายรวม</p>
                  <p className="text-lg font-bold text-blue-600">
                    ฿{products.reduce((sum, item) => sum + (item.total_price || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ต้นทุนรวม</p>
                  <p className="text-lg font-bold text-gray-700">
                    ฿{products.reduce((sum, item) => sum + (item.total_cost || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">กำไรรวม</p>
                  <p className="text-lg font-bold text-green-600">
                    ฿{products.reduce((sum, item) => sum + (item.profit || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">% กำไรรวม</p>
                  <p className="text-lg font-bold text-green-600">
                    {(() => {
                      const totalSales = products.reduce((sum, item) => sum + (item.total_price || 0), 0);
                      const totalProfit = products.reduce((sum, item) => sum + (item.profit || 0), 0);
                      return totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) + '%' : '0%';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const WholesaleLeadDetail = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <LeadDetail />
      <ProductProposalSection />
    </div>
  );
};

export default WholesaleLeadDetail;
