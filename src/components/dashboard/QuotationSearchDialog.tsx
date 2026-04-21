import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from 'react-router-dom';

interface QuotationResult {
  document_number: string;
  document_type: string;
  lead_id: number;
  lead_name: string;
  lead_tel: string;
  lead_category: string;
  lead_status: string;
  productivity_log_id: number;
}

interface QuotationSearchDialogProps {
  onSelectResult?: (result: QuotationResult) => void;
}

const QuotationSearchDialog = ({ onSelectResult }: QuotationSearchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<QuotationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchQuotations(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchQuotations = async (term: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get current user's sales member ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!userData) return;

      // Get sales member info
      const { data: salesMember } = await supabase
        .from('sales_team_with_user_info')
        .select('id')
        .eq('user_id', userData.id)
        .single();

      if (!salesMember) return;

      // Search quotations with lead information
      const { data, error } = await supabase
        .from('quotation_documents')
        .select(`
          document_number,
          document_type,
          productivity_log_id,
          lead_productivity_logs!inner(
            lead_id,
            leads!inner(
              id,
              full_name,
              tel,
              category,
              status,
              sale_owner_id
            )
          )
        `)
        .ilike('document_number', `%${term}%`)
        .eq('lead_productivity_logs.leads.sale_owner_id', salesMember.id);

      if (error) {
        console.error('Error searching quotations:', error);
        return;
      }

      // Map results and deduplicate by document_number + lead_id
      // ถ้ามี quotation_documents หลายตัวที่มี document_number เดียวกันแต่ link กับ productivity_logs ต่างกัน
      // จะแสดงผลซ้ำ ให้ทำ deduplication โดยเลือก record ที่มี productivity_log_id ล่าสุด
      const resultsMap = new Map<string, QuotationResult>();
      
      data?.forEach(item => {
        const key = `${item.document_number}_${item.lead_productivity_logs.leads.id}`;
        const existing = resultsMap.get(key);
        
        // ถ้ายังไม่มี หรือ productivity_log_id นี้ใหม่กว่า ให้เก็บ record นี้
        if (!existing || item.productivity_log_id > existing.productivity_log_id) {
          resultsMap.set(key, {
            document_number: item.document_number,
            document_type: item.document_type,
            lead_id: item.lead_productivity_logs.leads.id,
            lead_name: item.lead_productivity_logs.leads.full_name || '',
            lead_tel: item.lead_productivity_logs.leads.tel || '',
            lead_category: item.lead_productivity_logs.leads.category || '',
            lead_status: item.lead_productivity_logs.leads.status || '',
            productivity_log_id: item.productivity_log_id,
          });
        }
      });

      const searchResults: QuotationResult[] = Array.from(resultsMap.values());

      setResults(searchResults);
    } catch (error) {
      console.error('Error searching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLead = (result: QuotationResult) => {
    setOpen(false);
    if (result.lead_category === 'Package') {
      navigate(`/package/leads/${result.lead_id}/timeline`);
    } else if (result.lead_category === 'Wholesales') {
      navigate(`/wholesale/leads/${result.lead_id}/timeline`);
    } else {
      navigate(`/leads/${result.lead_id}/timeline`);
    }
  };

  const getDocumentTypeColor = (type: string) => {
    return type === 'quotation' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'กำลังติดตาม':
        return 'bg-yellow-100 text-yellow-800';
      case 'ปิดการขาย':
        return 'bg-green-100 text-green-800';
      case 'ไม่สำเร็จ':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-2 border-gray-200/60 shadow-md hover:shadow-lg focus:shadow-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02] text-blue-700 hover:text-blue-800"
        >
          <FileText className="h-4 w-4 mr-2" />
          ค้นหา QT/INV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            ค้นหาเลขที่ใบเสนอราคา / Invoice
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="พิมพ์เลขที่ใบเสนอราคาหรือ Invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => {
                  setSearchTerm('');
                  setResults([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-pulse text-gray-500">กำลังค้นหา...</div>
              </div>
            ) : results.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่เอกสาร</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ชื่อลูกค้า</TableHead>
                    <TableHead>เบอร์โทร</TableHead>
                    <TableHead>ประเภทการขาย</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {result.document_number}
                      </TableCell>
                      <TableCell>
                        <Badge className={getDocumentTypeColor(result.document_type)}>
                          {result.document_type === 'quotation' ? 'ใบเสนอราคา' : 'Invoice'}
                        </Badge>
                      </TableCell>
                      <TableCell>{result.lead_name}</TableCell>
                      <TableCell>{result.lead_tel}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {result.lead_category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(result.lead_status)}>
                          {result.lead_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLead(result)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          ติดตาม
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : searchTerm.length >= 2 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                ไม่พบผลลัพธ์สำหรับ "{searchTerm}"
              </div>
            ) : searchTerm.length > 0 && searchTerm.length < 2 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                กรุณาพิมพ์อย่างน้อย 2 ตัวอักษร
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                พิมพ์เลขที่ใบเสนอราคาหรือ Invoice เพื่อค้นหา
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationSearchDialog;