
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DateTimePicker from "@/components/ui/DateTimePicker";
import { ProductivityLogFormData } from "@/hooks/useProductivityLogForm";
import CustomerTypeSection from "./CustomerTypeSection";
import ContactStatusSection from "./ContactStatusSection";
import BasicInfoSection from "./BasicInfoSection";
import SiteVisitSection from "./SiteVisitSection";
import QuotationIssuingSection from "./QuotationIssuingSection";
import SalesOpportunitySection from "./SalesOpportunitySection";
import CXLInfoSection from "./CXLInfoSection";
import QuotationDetailsSection from "./QuotationDetailsSection";
import ProductSelectionSection from "./ProductSelectionSection";

// import { useLeadFollowupHistory } from "@/hooks/useLeadFollowupHistory"; // ✅ ลบออกแล้ว - ไม่ใช้ auto-select
import { OPERATION_STATUS_OPTIONS as BASE_OPERATION_STATUS_OPTIONS } from "@/utils/leadStatusUtils";

interface ProductivityLogFormFieldsProps {
  formData: ProductivityLogFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductivityLogFormData>>;
  calculatedData: {
    remainingAmount: number;
    remainingPeriods: number;
  };
  leadId: number;
  isWholesale?: boolean;
  isPackage?: boolean;
}

const ProductivityLogFormFields = ({ formData, setFormData, calculatedData, leadId, isWholesale, isPackage }: ProductivityLogFormFieldsProps) => {
  const canShowFullForm = formData.contact_status === 'ติดต่อได้';
  // ✅ ลบ auto-select logic ออกไปทั้งหมด - ให้ผู้ใช้เลือกเองทุกครั้ง

  // ✅ ลบ auto-select logic ออกไปทั้งหมด - ให้ผู้ใช้เลือกเองทุกครั้ง

  // Determine if quotation details should be shown
  const shouldShowQuotationDetails = ['win', 'win + สินเชื่อ', 'มัดจำเงิน'].includes(formData.sale_chance_status) || 
    formData.has_qt || 
    formData.has_inv || 
    formData.total_amount;

  // ✅ ลบ auto-select logic ออกไปทั้งหมด - ไม่ต้องตรวจสอบ isAutoSelected

  // Custom operation status สำหรับ wholesale
  const OPERATION_STATUS_OPTIONS = isWholesale
    ? BASE_OPERATION_STATUS_OPTIONS.filter(opt => opt !== 'อยู่ระหว่างการสำรวจ')
    : BASE_OPERATION_STATUS_OPTIONS;

  return (
    <>
      <CustomerTypeSection
        leadGroup={formData.lead_group}
        onLeadGroupChange={(value) => setFormData(prev => ({ ...prev, lead_group: value }))}
        presentationType={formData.presentation_type}
        onPresentationTypeChange={(value) => setFormData(prev => ({ ...prev, presentation_type: value }))}
        // ✅ ลบ isAutoSelected prop ออกไปแล้ว - ไม่ใช้ auto-select
      />

      <ContactStatusSection
        contactStatus={formData.contact_status}
        contactFailReason={formData.contact_fail_reason}
        onContactStatusChange={(value) => setFormData(prev => ({ ...prev, contact_status: value }))}
        onContactFailReasonChange={(value) => setFormData(prev => ({ ...prev, contact_fail_reason: value }))}
      />

      <BasicInfoSection
        customerCategory={formData.customer_category}
        operationStatus={formData.operation_status}
        onCustomerCategoryChange={(value) => setFormData(prev => ({ ...prev, customer_category: value }))}
        onOperationStatusChange={(value) => setFormData(prev => ({ ...prev, operation_status: value }))}
        canShowFullForm={canShowFullForm}
        operationStatusOptions={[...OPERATION_STATUS_OPTIONS]}
        isWholesale={isWholesale}
        isPackage={isPackage}
        interestedKwSize={formData.interested_kw_size}
        onInterestedKwSizeChange={(value) => setFormData(prev => ({ ...prev, interested_kw_size: value }))}
      />

      {canShowFullForm && (
        <>
          {/* Show product selection for wholesale leads */}
          {isWholesale && (
            <ProductSelectionSection
              selectedProducts={formData.selected_products}
              onProductsChange={(products) => setFormData(prev => ({ ...prev, selected_products: products }))}
            />
          )}

          {!isWholesale && (
            <SiteVisitSection
              siteVisitDate={formData.site_visit_date}
              location={formData.location}
              buildingInfo={formData.building_info}
              installationNotes={formData.installation_notes}
              onSiteVisitDateChange={(value) => setFormData(prev => ({ ...prev, site_visit_date: value }))}
              onLocationChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              onBuildingInfoChange={(value) => setFormData(prev => ({ ...prev, building_info: value }))}
              onInstallationNotesChange={(value) => setFormData(prev => ({ ...prev, installation_notes: value }))}
            />
          )}

          <QuotationIssuingSection
            canIssueQt={formData.can_issue_qt}
            qtFailReason={formData.qt_fail_reason}
            hasQt={formData.has_qt}
            hasInv={formData.has_inv}
            quotationDocuments={formData.quotation_documents}
            invoiceDocuments={formData.invoice_documents}
            isWholesale={isWholesale}
            isZeroDownPayment={formData.is_zero_down_payment}
            downPaymentAmount={formData.down_payment_amount}
            onCanIssueQtChange={(value) => setFormData(prev => ({ ...prev, can_issue_qt: value }))}
            onQtFailReasonChange={(value) => setFormData(prev => ({ ...prev, qt_fail_reason: value }))}
            onHasQtChange={(checked) => setFormData(prev => ({ ...prev, has_qt: !!checked }))}
            onHasInvChange={(checked) => setFormData(prev => ({ ...prev, has_inv: !!checked }))}
            onQuotationDocumentsChange={(documents) => setFormData(prev => ({ ...prev, quotation_documents: documents }))}
            onInvoiceDocumentsChange={(documents) => setFormData(prev => ({ ...prev, invoice_documents: documents }))}
            onIsZeroDownPaymentChange={(value) => setFormData(prev => ({ ...prev, is_zero_down_payment: value }))}
            onDownPaymentAmountChange={(value) => setFormData(prev => ({ ...prev, down_payment_amount: value }))}
          />

          <SalesOpportunitySection
            saleChanceStatus={formData.sale_chance_status}
            creditApprovalStatus={formData.credit_approval_status}
            onSaleChanceStatusChange={(value) => setFormData(prev => ({ ...prev, sale_chance_status: value }))}
            onCreditApprovalStatusChange={(value) => setFormData(prev => ({ ...prev, credit_approval_status: value }))}
            isWholesale={isWholesale}
          />

          {formData.sale_chance_status === 'CXL' && (
            <CXLInfoSection
              cxlReason={formData.cxl_reason}
              cxlDetail={formData.cxl_detail}
              onCxlReasonChange={(value) => setFormData(prev => ({ ...prev, cxl_reason: value }))}
              onCxlDetailChange={(value) => setFormData(prev => ({ ...prev, cxl_detail: value }))}
            />
          )}

          {shouldShowQuotationDetails && (
            <QuotationDetailsSection
              totalAmount={formData.total_amount}
              paymentMethod={formData.payment_method}
              installmentType={formData.installment_type}
              installmentPercent={formData.installment_percent}
              installmentAmount={formData.installment_amount}
              installmentPeriods={formData.installment_periods}
              estimatePaymentDate={formData.estimate_payment_date}
              calculatedData={calculatedData}
              quotationDocuments={formData.quotation_documents}
              invoiceDocuments={formData.invoice_documents}
              onTotalAmountChange={(value) => {
            
                setFormData(prev => ({ ...prev, total_amount: value }));
              }}
              onPaymentMethodChange={(value) => {
            
                setFormData(prev => ({ ...prev, payment_method: value }));
              }}
              onInstallmentTypeChange={(value) => {
            
                setFormData(prev => ({ ...prev, installment_type: value }));
              }}
              onInstallmentPercentChange={(value) => {
            
                setFormData(prev => ({ ...prev, installment_percent: value }));
              }}
              onInstallmentAmountChange={(value) => {
            
                setFormData(prev => ({ ...prev, installment_amount: value }));
              }}
              onInstallmentPeriodsChange={(value) => {
            
                setFormData(prev => ({ ...prev, installment_periods: value }));
              }}
              onEstimatePaymentDateChange={(value) => {
            
                setFormData(prev => ({ ...prev, estimate_payment_date: value }));
              }}
            />
          )}
        </>
      )}

      <div className="space-y-4 border-b pb-4">
        <h3 className="text-lg font-semibold">รายละเอียดการติดตาม</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              รายละเอียดการติดตาม
              <span className="text-red-500 text-lg font-bold">*</span>
              <span className="text-sm text-gray-500">(จำเป็น)</span>
            </Label>
            <Textarea
              placeholder="บันทึกรายละเอียดการติดตาม หมายเหตุ และข้อมูลสำคัญต่างๆ..."
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              required
              className={`min-h-[120px] ${!formData.note ? "border-red-300 focus:border-red-500" : "border-gray-300 focus:border-gray-500"}`}
              rows={5}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <DateTimePicker
                label="วันเวลานัดติดตาม"
                value={formData.next_follow_up}
                onChange={(value) => setFormData(prev => ({ ...prev, next_follow_up: value }))}
                placeholder="เลือกวันเวลานัดติดตามครั้งถัดไป"
              />
            </div>
            <div className="space-y-2">
              <Label>รายละเอียดการนัดติดตามครั้งถัดไป</Label>
              <Textarea
                placeholder="ระบุรายละเอียดว่าจะติดตามเรื่องอะไรในครั้งถัดไป..."
                value={formData.next_follow_up_details}
                onChange={(e) => setFormData(prev => ({ ...prev, next_follow_up_details: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductivityLogFormFields;
