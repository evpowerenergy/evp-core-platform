import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomerData {
  customerServices: any[];
  leads: any[];
  appointments: any[];
  productivityLogs: any[];
  quotations: any[];
}

export function CustomerDebugger() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debugCustomer = async () => {
    if (!phoneNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. หาข้อมูล customer_services
      const { data: customerServices, error: csError } = await supabase
        .from('customer_services')
        .select('*')
        .eq('tel', phoneNumber);
      
      if (csError) throw csError;
      
      if (!customerServices || customerServices.length === 0) {
        setError('ไม่พบข้อมูลลูกค้า');
        setLoading(false);
        return;
      }
      
      const customerId = customerServices[0].id;
      
      // 2. หาข้อมูล leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('customer_service_id', customerId);
      
      if (leadsError) throw leadsError;
      
      // 3. หาข้อมูล appointments
      const { data: appointments, error: appError } = await supabase
        .from('service_appointments')
        .select('*')
        .eq('customer_service_id', customerId);
      
      if (appError) throw appError;
      
      // 4. หาข้อมูล productivity logs
      let productivityLogs: any[] = [];
      let quotations: any[] = [];
      
      if (leads && leads.length > 0) {
        const leadId = leads[0].id;
        const { data: logs, error: prodError } = await supabase
          .from('lead_productivity_logs')
          .select('*')
          .eq('lead_id', leadId);
        
        if (prodError) throw prodError;
        productivityLogs = logs || [];
        
        // 5. หาข้อมูล quotations
        if (productivityLogs.length > 0) {
          const logIds = productivityLogs.map(log => log.id);
          const { data: quotes, error: quoteError } = await supabase
            .from('quotations')
            .select('*')
            .in('productivity_log_id', logIds);
          
          if (quoteError) throw quoteError;
          quotations = quotes || [];
        }
      }
      
      setCustomerData({
        customerServices,
        leads,
        appointments,
        productivityLogs,
        quotations
      });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔍 Customer Data Debugger</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="ใส่เบอร์โทรศัพท์ลูกค้า"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
        />
        <button
          onClick={debugCustomer}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'กำลังค้นหา...' : 'ค้นหา'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ❌ {error}
        </div>
      )}
      
      {customerData && (
        <div className="space-y-6">
          {/* Customer Services */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📋 Customer Services</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(customerData.customerServices, null, 2)}
            </pre>
          </div>
          
          {/* Leads */}
          <div>
            <h3 className="text-lg font-semibold mb-2">👥 Leads</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(customerData.leads, null, 2)}
            </pre>
          </div>
          
          {/* Appointments */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📅 Appointments</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(customerData.appointments, null, 2)}
            </pre>
          </div>
          
          {/* Productivity Logs */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📊 Productivity Logs</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(customerData.productivityLogs, null, 2)}
            </pre>
          </div>
          
          {/* Quotations */}
          <div>
            <h3 className="text-lg font-semibold mb-2">💰 Quotations</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(customerData.quotations, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
