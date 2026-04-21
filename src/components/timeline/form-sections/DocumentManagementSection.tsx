import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

interface DocumentManagementSectionProps {
  hasQt: boolean;
  hasInv: boolean;
  quotationNumbers: string[];
  invoiceNumbers: string[];
  onHasQtChange: (checked: boolean) => void;
  onHasInvChange: (checked: boolean) => void;
  onQuotationNumbersChange: (numbers: string[]) => void;
  onInvoiceNumbersChange: (numbers: string[]) => void;
}

const DocumentManagementSection = ({
  hasQt,
  hasInv,
  quotationNumbers,
  invoiceNumbers,
  onHasQtChange,
  onHasInvChange,
  onQuotationNumbersChange,
  onInvoiceNumbersChange
}: DocumentManagementSectionProps) => {
  
  const addQuotationNumber = () => {
    onQuotationNumbersChange([...quotationNumbers, '']);
  };

  const removeQuotationNumber = (index: number) => {
    const newNumbers = quotationNumbers.filter((_, i) => i !== index);
    onQuotationNumbersChange(newNumbers);
  };

  const updateQuotationNumber = (index: number, value: string) => {
    const newNumbers = [...quotationNumbers];
    newNumbers[index] = value;
    onQuotationNumbersChange(newNumbers);
  };

  const addInvoiceNumber = () => {
    onInvoiceNumbersChange([...invoiceNumbers, '']);
  };

  const removeInvoiceNumber = (index: number) => {
    const newNumbers = invoiceNumbers.filter((_, i) => i !== index);
    onInvoiceNumbersChange(newNumbers);
  };

  const updateInvoiceNumber = (index: number, value: string) => {
    const newNumbers = [...invoiceNumbers];
    newNumbers[index] = value;
    onInvoiceNumbersChange(newNumbers);
  };

  // Auto-add first item when checkbox is checked
  React.useEffect(() => {
    if (hasQt && quotationNumbers.length === 0) {
      onQuotationNumbersChange(['']);
    }
  }, [hasQt]);

  React.useEffect(() => {
    if (hasInv && invoiceNumbers.length === 0) {
      onInvoiceNumbersChange(['']);
    }
  }, [hasInv]);

  return (
    <div className="space-y-4 border-b pb-4">
      <h3 className="text-lg font-semibold">5. เอกสารใบเสนอราคาและ Invoice</h3>
      
      {/* Main checkboxes */}
      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_qt"
            checked={hasQt}
            onCheckedChange={onHasQtChange}
          />
          <Label htmlFor="has_qt">มีใบเสนอราคา</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_inv"
            checked={hasInv}
            onCheckedChange={onHasInvChange}
          />
          <Label htmlFor="has_inv">มี Invoice</Label>
        </div>
      </div>

      {/* Document numbers section */}
      {(hasQt || hasInv) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quotation Numbers (Left) */}
          {hasQt && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium text-blue-700">
                  หมายเลขใบเสนอราคา
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuotationNumber}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  เพิ่ม
                </Button>
              </div>
              
              <div className="space-y-2">
                {quotationNumbers.map((number, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`QT-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`}
                      value={number}
                      onChange={(e) => updateQuotationNumber(index, e.target.value)}
                      className="flex-1"
                    />
                    {quotationNumbers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuotationNumber(index)}
                        className="h-10 w-10 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice Numbers (Right) */}
          {hasInv && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium text-purple-700">
                  หมายเลข Invoice
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceNumber}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  เพิ่ม
                </Button>
              </div>
              
              <div className="space-y-2">
                {invoiceNumbers.map((number, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`INV-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`}
                      value={number}
                      onChange={(e) => updateInvoiceNumber(index, e.target.value)}
                      className="flex-1"
                    />
                    {invoiceNumbers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInvoiceNumber(index)}
                        className="h-10 w-10 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentManagementSection;