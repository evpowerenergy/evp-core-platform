import { useForm } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useLeads } from "@/hooks/useLeadsAPI";
import { useToast } from "@/hooks/useToast";
import { PLATFORM_OPTIONS } from "@/utils/dashboardUtils";
import AdditionalInfoSection from "@/components/dashboard/form-sections/AdditionalInfoSection";
import QRCodeSection from "@/components/dashboard/form-sections/QRCodeSection";
import { useSalesTeamAPI as useSalesTeam } from "@/hooks/useSalesTeamAPI";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { ProvinceSelect } from "@/components/ui/province-select";
import { checkPhoneNumberDuplicateNormalized } from "@/utils/leadValidation";
import AdCampaignSelect from "@/components/ads/AdCampaignSelect";

const LeadAdd = () => {
  const { user } = useAuth();
  const { salesTeam } = useSalesTeam();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const phoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const form = useForm({
    defaultValues: {
      full_name: "",
      email: "",
      platform: "",
      category: "",
      tel: "",
      line_id: "",
      region: "",
      avg_electricity_bill: "",
      daytime_percent: "",
      notes: "",
      qr_code: "",
      sale_owner_id: "none",
      ad_campaign_id: "none",
      is_from_ppa_project: false
    },
    // Add validation rules with async phone number duplicate checking
    resolver: async (values) => {
      const errors: any = {};
      
      // Check required fields
      if (!values.full_name?.trim()) {
        errors.full_name = { type: "required", message: "กรุณากรอกชื่อเต็ม" };
      }
      
      if (!values.tel?.trim()) {
        errors.tel = { type: "required", message: "กรุณากรอกเบอร์โทรศัพท์" };
      } else {
        // Check for phone number duplicates
        try {
          setIsCheckingPhone(true);
          const isDuplicate = await checkPhoneNumberDuplicateNormalized(values.tel);
          if (isDuplicate) {
            errors.tel = { type: "duplicate", message: "เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว" };
          }
        } catch (error) {
          console.error("Error checking phone duplicate:", error);
          // Don't block form submission if duplicate check fails
        } finally {
          setIsCheckingPhone(false);
        }
      }
      
      if (!values.platform?.trim()) {
        errors.platform = { type: "required", message: "กรุณาเลือกแพลตฟอร์ม" };
      }
      
      if (!values.category?.trim()) {
        errors.category = { type: "required", message: "กรุณาเลือกประเภทการขาย" };
      }
      
      return {
        values,
        errors: Object.keys(errors).length > 0 ? errors : {}
      };
    }
  });
  const navigate = useNavigate();
  const { addLead, isCreatingLead } = useLeads();
  const { toast } = useToast();

  // Watch phone number changes for real-time validation
  const phoneValue = form.watch('tel');

  // Debounced phone number validation
  useEffect(() => {
    if (phoneTimeoutRef.current) {
      clearTimeout(phoneTimeoutRef.current);
    }

    if (phoneValue && phoneValue.trim().length >= 8) {
      phoneTimeoutRef.current = setTimeout(() => {
        validatePhoneNumber(phoneValue);
      }, 1000); // Wait 1 second after user stops typing
    } else {
      setPhoneError('');
    }

    return () => {
      if (phoneTimeoutRef.current) {
        clearTimeout(phoneTimeoutRef.current);
      }
    };
  }, [phoneValue]);

  const validatePhoneNumber = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      setPhoneError('');
      return true;
    }

    try {
      setIsCheckingPhone(true);
      const isDuplicate = await checkPhoneNumberDuplicateNormalized(phoneNumber);
      if (isDuplicate) {
        setPhoneError('เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว');
        return false;
      } else {
        setPhoneError('');
        return true;
      }
    } catch (error) {
      console.error('Error checking phone duplicate:', error);
      setPhoneError('');
      return true; // Don't block form submission if duplicate check fails
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSubmit = async (values: any) => {
    // Prevent double submission
    if (isSubmitting || isCreatingLead) {
      return;
    }

    // Check for phone number error before submission
    if (phoneError) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาแก้ไขเบอร์โทรศัพท์ที่ซ้ำกัน",
        variant: "destructive",
      });
      return;
    }

    // Double-check phone number duplicate before submitting (ป้องกัน race condition)
    if (values.tel?.trim()) {
      try {
        setIsCheckingPhone(true);
        const isDuplicate = await checkPhoneNumberDuplicateNormalized(values.tel);
        if (isDuplicate) {
          setPhoneError('เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว');
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว กรุณาใช้เบอร์อื่น",
            variant: "destructive",
          });
          setIsCheckingPhone(false);
          return;
        }
      } catch (error) {
        console.error("Error checking phone duplicate before submit:", error);
        // ถ้าเช็คไม่ได้ ให้แจ้งเตือนแต่ยัง submit ได้ (ป้องกันกรณี network error)
        toast({
          title: "คำเตือน",
          description: "ไม่สามารถตรวจสอบเบอร์ซ้ำได้ กรุณาตรวจสอบอีกครั้ง",
          variant: "destructive",
        });
      } finally {
        setIsCheckingPhone(false);
      }
    }

    setIsSubmitting(true);
    
    try {
      if (!user) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณาเข้าสู่ระบบก่อนเพิ่มลีด",
          variant: "destructive",
        });
        return;
      }

      // Get current user data from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่พบข้อมูลผู้ใช้",
          variant: "destructive",
        });
        return;
      }

      // Validate and trim field lengths to prevent database errors
      // Note: After migration 20250117000000_increase_leads_field_lengths_with_generated_column.sql,
      // these fields can be up to 50 characters. Using 50 as the limit.
      const maxTelLength = 50;
      const maxPlatformLength = 50;
      
      const cleanedTel = values.tel 
        ? values.tel.trim().substring(0, maxTelLength)
        : values.tel;
      
      const cleanedPlatform = values.platform 
        ? values.platform.trim().substring(0, maxPlatformLength)
        : values.platform;

      // Warn user if values were truncated.
      if (values.tel && values.tel.trim().length > maxTelLength) {
        toast({
          title: "คำเตือน",
          description: `เบอร์โทรศัพท์ถูกตัดให้เหลือ ${maxTelLength} ตัวอักษร`,
          variant: "default",
        });
      }
      if (values.platform && values.platform.trim().length > maxPlatformLength) {
        toast({
          title: "คำเตือน",
          description: `แพลตฟอร์มถูกตัดให้เหลือ ${maxPlatformLength} ตัวอักษร`,
          variant: "default",
        });
      }

      // Convert "none" to null for sale_owner_id and add created_by
      // Convert empty string or "none" to null for ad_campaign_id
      const processedValues = {
        ...values,
        tel: cleanedTel,
        platform: cleanedPlatform,
        sale_owner_id: values.sale_owner_id === "none" ? null : values.sale_owner_id,
        ad_campaign_id: (values.ad_campaign_id === "" || values.ad_campaign_id === "none") ? null : parseInt(values.ad_campaign_id),
        created_by: userData.id, // Add the creator's user ID
        is_from_ppa_project: values.is_from_ppa_project === true // Ensure boolean value
      };
      
      // Debug: Log the processed values to check if is_from_ppa_project is included
      console.log('📝 Processed Values:', processedValues);
      console.log('📝 is_from_ppa_project value:', processedValues.is_from_ppa_project, typeof processedValues.is_from_ppa_project);
      
      await addLead(processedValues);
      // Success toast is handled in useLeadsAPI onSuccess
      
      // Reset form after successful submission to allow adding more leads
      form.reset({
        full_name: "",
        email: "",
        platform: "",
        category: "",
        tel: "",
        line_id: "",
        region: "",
        avg_electricity_bill: "",
        daytime_percent: "",
        notes: "",
        qr_code: "",
        sale_owner_id: "none",
        ad_campaign_id: "none",
        is_from_ppa_project: false
      });
      setPhoneError(''); // Clear phone error after successful submission
      
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
      // Check if error is about duplicate phone
      const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลได้';
      if (errorMessage.includes('เบอร์โทรศัพท์') || errorMessage.includes('มีอยู่ในระบบ')) {
        setPhoneError('เบอร์โทรศัพท์นี้มีอยู่ในระบบแล้ว');
        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // Error toast is handled in useLeadsAPI onError, but we show a fallback here
        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combined loading state
  const isLoading = isSubmitting || isCreatingLead;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">เพิ่มลีดใหม่</h1>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString('th-TH', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Form Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            
            {/* Main Form - Single Column with 2-column fields inside each card */}
            <div className="space-y-4 mb-8">
              
              {/* Customer Information Section */}
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-5 rounded-xl border-2 border-green-200 shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center">
                  <div className="w-3 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full mr-4"></div>
                  ข้อมูลลูกค้า
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold text-base">ชื่อเต็ม *</FormLabel>
                        <FormControl>
                                                     <Input 
                             placeholder="ชื่อ-นามสกุล ของลูกค้า" 
                             className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-base px-3 placeholder:text-gray-400" 
                             {...field} 
                             disabled={isLoading}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold text-base">
                          โทรศัพท์ *
                          {isCheckingPhone && (
                            <span className="ml-2 text-sm text-blue-600">กำลังตรวจสอบ...</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="เบอร์โทรศัพท์" 
                              className={`h-11 border-2 focus:ring-green-500/20 transition-all duration-200 text-base px-3 placeholder:text-gray-400 ${
                                phoneError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
                              }`}
                              {...field} 
                              disabled={isLoading || isCheckingPhone}
                            />
                            {isCheckingPhone && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        {phoneError ? (
                          <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                        ) : (
                          <FormMessage />
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold text-base">อีเมล</FormLabel>
                        <FormControl>
                                                     <Input 
                             type="email"
                             placeholder="example@email.com" 
                             className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-base px-3 placeholder:text-gray-400" 
                             {...field} 
                             disabled={isLoading}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="line_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold text-base">Line ID</FormLabel>
                        <FormControl>
                                                     <Input 
                             placeholder="Line ID สำหรับติดต่อ" 
                             className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-base px-3 placeholder:text-gray-400" 
                             {...field} 
                             disabled={isLoading}
                           />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold text-base">จังหวัด</FormLabel>
                        <FormControl>
                          <ProvinceSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="เลือกจังหวัด"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold text-base">แพลตฟอร์ม (ที่มาของลีด)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-base px-3">
                              <SelectValue placeholder="เลือกแพลตฟอร์ม" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PLATFORM_OPTIONS.map(platform => (
                              <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold text-base">ประเภทการขาย *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-base px-3">
                              <SelectValue placeholder="เลือกประเภทการขาย" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Package">Package</SelectItem>
                            <SelectItem value="Wholesales">Wholesales</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ad_campaign_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-semibold text-base">แหล่งที่มาจากแอด</FormLabel>
                        <FormControl>
                          <AdCampaignSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isLoading}
                            placeholder="เลือกแคมเปญโฆษณา (ถ้ามี)"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500 mt-1">
                          แสดงเฉพาะแอดที่กำลัง Active อยู่ (ไม่บังคับ)
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_from_ppa_project"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={(checked) => {
                              // Ensure we always set a boolean value
                              field.onChange(checked === true);
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-gray-700 font-semibold text-base cursor-pointer">
                            มาจากโครงการ PPA
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            เลือกถ้าลีดนี้มาจากโครงการ Power Purchase Agreement
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-orange-200 shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center">
                  <div className="w-3 h-8 bg-gradient-to-b from-orange-500 to-amber-600 rounded-full mr-4"></div>
                  ข้อมูลเพิ่มเติม
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Other Fields */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="avg_electricity_bill"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold text-base">ค่าไฟเฉลี่ย</FormLabel>
                          <FormControl>
                                                       <Input 
                             placeholder="ค่าไฟฟ้าเฉลี่ยต่อเดือน" 
                             className="h-11 border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 text-base px-3 placeholder:text-gray-400" 
                             {...field} 
                             disabled={isLoading}
                           />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="daytime_percent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold text-base">เปอร์เซ็นต์การใช้ไฟช่วงกลางวัน (%)</FormLabel>
                          <FormControl>
                                                       <Input 
                             placeholder="เปอร์เซ็นต์การใช้ไฟช่วงกลางวัน" 
                             className="h-11 border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 text-base px-3 placeholder:text-gray-400" 
                             {...field} 
                             disabled={isLoading}
                           />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-semibold text-base">รายละเอียด</FormLabel>
                          <FormControl>
                                                       <Textarea 
                             placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับลูกค้า" 
                             className="min-h-[100px] border-2 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 text-base resize-none px-3 py-2 placeholder:text-gray-400" 
                             {...field} 
                             disabled={isLoading}
                           />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column - QR Code */}
                  <div className="flex items-start justify-center">
                    <QRCodeSection control={form.control} disabled={isLoading} />
                  </div>
                </div>
              </div>

              {/* Assignment Section */}
              <div className="bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 p-5 rounded-xl border-2 border-red-200 shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center">
                  <div className="w-3 h-8 bg-gradient-to-b from-red-500 to-pink-600 rounded-full mr-4"></div>
                  การมอบหมาย (ไม่จำเป็น)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sale_owner_id"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel className="text-gray-700 font-semibold text-base">มอบหมายให้ (ไม่จำเป็น)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="h-11 border-2 border-gray-300 focus:border-red-500 focus:ring-red-500/20 transition-all duration-200 text-base px-3">
                              <SelectValue placeholder="เลือกผู้รับผิดชอบ (ไม่จำเป็น)">
                                {field.value === "none" ? "ไม่มอบหมาย" : field.value ? salesTeam.find(m => m.id.toString() === field.value)?.name : ""}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">ไม่มอบหมาย</SelectItem>
                            {salesTeam.map(member => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-sm text-gray-600 mt-2">สามารถบันทึกลีดได้โดยไม่ต้องมอบหมายให้ใคร</p>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-8 border-t-2 border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)} 
                disabled={isLoading}
                className="h-11 px-8 text-base font-semibold border-2 hover:bg-gray-50"
              >
                ยกเลิก
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="h-11 px-8 text-base font-semibold bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังบันทึก...</span>
                  </div>
                ) : (
                  "บันทึกลีด"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LeadAdd; 