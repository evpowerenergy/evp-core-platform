import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoading } from "@/components/ui/loading";
import { 
  Save, 
  X, 
  Wrench, 
  Calendar,
  User,
  AlertCircle,
  Loader2,
  CheckCircle,
  Clock
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomerServiceAPI as useCustomerService } from "@/hooks/useCustomerServicesAPI";
import { useCreateServiceVisitAPI as useCreateServiceVisit, useUpdateServiceVisitAPI as useUpdateServiceVisit } from "@/hooks/useServiceVisitsAPI";
import { useToast } from "@/hooks/useToast";

const ServiceVisitForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    visitNumber: "1" | "2" | "3" | "4" | "5" | "";
    visitDate: string;
  }>({
    visitNumber: "1",
    visitDate: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch customer data
  const { data: customerService, isLoading: isLoadingCustomer } = useCustomerService(Number(id) || 0);
  const createMutation = useCreateServiceVisit();
  const updateMutation = useUpdateServiceVisit();

  // Set default visit number based on current service status
  useEffect(() => {
    if (customerService) {
      // หา visit ครั้งถัดไปที่ยังไม่เสร็จ
      const getNextVisitNumber = (customer: any) => {
        if (!customer.service_visit_1) return "1";
        if (!customer.service_visit_2) return "2";
        if (!customer.service_visit_3) return "3";
        if (!customer.service_visit_4) return "4";
        if (!customer.service_visit_5) return "5";
        return ""; // ครบ 5 ครั้งแล้ว
      };

      const nextVisit = getNextVisitNumber(customerService);
      if (nextVisit === "") {
        setFormData(prev => ({ ...prev, visitNumber: "" })); // Clear the value
        return;
      }
      
      // Only set default if no visit number is selected yet
      if (!formData.visitNumber) {
        setFormData(prev => ({ ...prev, visitNumber: nextVisit as "1" | "2" | "3" | "4" | "5" }));
      }
    }
  }, [customerService]);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.visitDate) {
      newErrors.visitDate = "กรุณาเลือกวันที่บริการ";
    }

    // Check if visit number is valid based on current status
    if (customerService) {
      if (formData.visitNumber === "1" && customerService.service_visit_1) {
        newErrors.visitNumber = "บริการครั้งที่ 1 เสร็จสิ้นแล้ว";
      }
      if (formData.visitNumber === "2" && !customerService.service_visit_1) {
        newErrors.visitNumber = "ต้องทำบริการครั้งที่ 1 ก่อน";
      }
      if (formData.visitNumber === "2" && customerService.service_visit_2) {
        newErrors.visitNumber = "บริการครั้งที่ 2 เสร็จสิ้นแล้ว";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerService) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบข้อมูลลูกค้า",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      // Validate visitNumber before proceeding
      if (formData.visitNumber !== "1" && formData.visitNumber !== "2") {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "กรุณาเลือกครั้งที่บริการ",
          variant: "destructive",
        });
        return;
      }
      
      const visitNumber = parseInt(formData.visitNumber) as 1 | 2;
      
      // Check if this is an update (if visit already exists)
      const isUpdate = (visitNumber === 1 && customerService.service_visit_1) || 
                      (visitNumber === 2 && customerService.service_visit_2);

      if (isUpdate) {
        await updateMutation.mutateAsync({
          customerId: customerService.id,
          visitNumber,
          visitDate: formData.visitDate,
          technician: customerService.installer_name || ""
        });
        toast({
          title: "อัปเดตสำเร็จ",
          description: `อัปเดตการบริการครั้งที่ ${visitNumber} เรียบร้อยแล้ว`,
        });
      } else {
        await createMutation.mutateAsync({
          customerId: customerService.id,
          visitNumber,
          visitDate: formData.visitDate,
          technician: customerService.installer_name || ""
        });
        toast({
          title: "บันทึกสำเร็จ",
          description: `บันทึกการบริการครั้งที่ ${visitNumber} เรียบร้อยแล้ว`,
        });
      }
      
      // Navigate back to customer detail
      navigate(`/service-tracking/customer-services/${id}`);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการบริการได้",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate(`/service-tracking/customer-services/${id}`);
  };

  if (isLoadingCustomer) {
    return <PageLoading type="form" />;
  }

  if (!customerService) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">ไม่พบข้อมูลลูกค้า</p>
          <Button 
            onClick={() => navigate("/service-tracking/customer-services")}
            className="mt-4"
          >
            กลับไปรายการลูกค้า
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Determine available visit numbers
  const availableVisits = [];
  
  // Visit 1
  if (!customerService.service_visit_1) {
    availableVisits.push({ value: "1", label: "บริการครั้งที่ 1", status: "pending" });
  } else {
    availableVisits.push({ value: "1", label: "บริการครั้งที่ 1 (เสร็จสิ้น)", status: "completed" });
  }
  
  // Visit 2
  if (customerService.service_visit_1 && !customerService.service_visit_2) {
    availableVisits.push({ value: "2", label: "บริการครั้งที่ 2", status: "pending" });
  } else if (customerService.service_visit_2) {
    availableVisits.push({ value: "2", label: "บริการครั้งที่ 2 (เสร็จสิ้น)", status: "completed" });
  }
  
  // Visit 3
  if (customerService.service_visit_2 && !customerService.service_visit_3) {
    availableVisits.push({ value: "3", label: "บริการครั้งที่ 3", status: "pending" });
  } else if (customerService.service_visit_3) {
    availableVisits.push({ value: "3", label: "บริการครั้งที่ 3 (เสร็จสิ้น)", status: "completed" });
  }
  
  // Visit 4
  if (customerService.service_visit_3 && !customerService.service_visit_4) {
    availableVisits.push({ value: "4", label: "บริการครั้งที่ 4", status: "pending" });
  } else if (customerService.service_visit_4) {
    availableVisits.push({ value: "4", label: "บริการครั้งที่ 4 (เสร็จสิ้น)", status: "completed" });
  }
  
  // Visit 5
  if (customerService.service_visit_4 && !customerService.service_visit_5) {
    availableVisits.push({ value: "5", label: "บริการครั้งที่ 5", status: "pending" });
  } else if (customerService.service_visit_5) {
    availableVisits.push({ value: "5", label: "บริการครั้งที่ 5 (เสร็จสิ้น)", status: "completed" });
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">บันทึกการบริการลูกค้า</h1>
          <p className="text-gray-600 mt-1">
            บันทึกการบริการสำหรับ {customerService.customer_group}
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={handleCancel}
          className="border-gray-300 text-gray-600 hover:bg-gray-50 w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          ยกเลิก
        </Button>
        </div>
      </div>

      {/* Customer Info Summary */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            ข้อมูลลูกค้า
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">กลุ่มไลน์ซัพพอร์ตลูกค้า</p>
              <p className="font-medium">{customerService.customer_group}</p>
            </div>
            <div>
              <p className="text-gray-500">เบอร์โทร</p>
              <p className="font-medium">{customerService.tel}</p>
            </div>
            <div>
              <p className="text-gray-500">จังหวัด</p>
              <p className="font-medium">{customerService.province}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Visit Selection */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              เลือกการบริการ
            </CardTitle>
            <CardDescription>เลือกการบริการที่ต้องการบันทึก</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                ครั้งที่บริการ *
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Warning when both visits completed */}
                {customerService?.service_visit_1 && customerService?.service_visit_2 && (
                  <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        ทั้งสองครั้งเสร็จสิ้นแล้ว - กรุณาเลือกครั้งที่ต้องการแก้ไขข้อมูล
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Service Visit 1 Card */}
                <div 
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.visitNumber === "1" 
                      ? "border-orange-500 bg-orange-50 shadow-md cursor-pointer" 
                      : customerService.service_visit_1 
                        ? "border-green-200 bg-green-50 cursor-pointer hover:border-green-300" 
                        : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!customerService.service_visit_1) {
                      handleInputChange("visitNumber", "1");
                    } else if (customerService.service_visit_1 && customerService.service_visit_2) {
                      // Both completed - allow selection for editing
                      handleInputChange("visitNumber", "1");
                    } else if (customerService.service_visit_1 && !customerService.service_visit_2) {
                      // Only visit 1 completed - allow selection for editing
                      handleInputChange("visitNumber", "1");
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      customerService.service_visit_1 
                        ? "bg-green-100" 
                        : formData.visitNumber === "1" 
                          ? "bg-orange-100" 
                          : "bg-gray-100"
                    }`}>
                      {customerService.service_visit_1 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : formData.visitNumber === "1" ? (
                        <Wrench className="h-5 w-5 text-orange-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">บริการครั้งที่ 1</h3>
                      <p className="text-sm text-gray-600">
                        {customerService.service_visit_1 ? "เสร็จสิ้นแล้ว" : "รอดำเนินการ"}
                      </p>
                      {customerService.service_visit_1_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          วันที่: {new Date(customerService.service_visit_1_date).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>
                    {formData.visitNumber === "1" && (
                      <div className="p-1 bg-orange-500 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Visit 2 Card */}
                <div 
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.visitNumber === "2" 
                      ? "border-orange-500 bg-orange-50 shadow-md cursor-pointer" 
                      : customerService.service_visit_2 
                        ? "border-green-200 bg-green-50 cursor-pointer hover:border-green-300" 
                        : !customerService.service_visit_1 
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-40" 
                          : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (customerService.service_visit_1 && !customerService.service_visit_2) {
                      handleInputChange("visitNumber", "2");
                    } else if (customerService.service_visit_1 && customerService.service_visit_2) {
                      // Both completed - allow selection for editing
                      handleInputChange("visitNumber", "2");
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      customerService.service_visit_2 
                        ? "bg-green-100" 
                        : formData.visitNumber === "2" 
                          ? "bg-orange-100" 
                          : !customerService.service_visit_1 
                            ? "bg-gray-100" 
                            : "bg-gray-100"
                    }`}>
                      {customerService.service_visit_2 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : formData.visitNumber === "2" ? (
                        <Wrench className="h-5 w-5 text-orange-600" />
                      ) : !customerService.service_visit_1 ? (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">บริการครั้งที่ 2</h3>
                      <p className="text-sm text-gray-600">
                        {customerService.service_visit_2 
                          ? "เสร็จสิ้นแล้ว" 
                          : !customerService.service_visit_1 
                            ? "ต้องทำครั้งที่ 1 ก่อน" 
                            : "รอดำเนินการ"}
                      </p>
                      {customerService.service_visit_2_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          วันที่: {new Date(customerService.service_visit_2_date).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>
                    {formData.visitNumber === "2" && (
                      <div className="p-1 bg-orange-500 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Visit 3 Card */}
                <div 
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.visitNumber === "3" 
                      ? "border-orange-500 bg-orange-50 shadow-md cursor-pointer" 
                      : customerService.service_visit_3 
                        ? "border-green-200 bg-green-50 cursor-pointer hover:border-green-300" 
                        : !customerService.service_visit_2 
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-40" 
                          : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (customerService.service_visit_2 && !customerService.service_visit_3) {
                      handleInputChange("visitNumber", "3");
                    } else if (customerService.service_visit_2 && customerService.service_visit_3) {
                      // Both completed - allow selection for editing
                      handleInputChange("visitNumber", "3");
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      customerService.service_visit_3 
                        ? "bg-green-100" 
                        : formData.visitNumber === "3" 
                          ? "bg-orange-100" 
                          : !customerService.service_visit_2 
                            ? "bg-gray-100" 
                            : "bg-gray-100"
                    }`}>
                      {customerService.service_visit_3 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : formData.visitNumber === "3" ? (
                        <Wrench className="h-5 w-5 text-orange-600" />
                      ) : !customerService.service_visit_2 ? (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">บริการครั้งที่ 3</h3>
                      <p className="text-sm text-gray-600">
                        {customerService.service_visit_3 
                          ? "เสร็จสิ้นแล้ว" 
                          : !customerService.service_visit_2 
                            ? "ต้องทำครั้งที่ 2 ก่อน" 
                            : "รอดำเนินการ"}
                      </p>
                      {customerService.service_visit_3_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          วันที่: {new Date(customerService.service_visit_3_date).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>
                    {formData.visitNumber === "3" && (
                      <div className="p-1 bg-orange-500 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Visit 4 Card */}
                <div 
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.visitNumber === "4" 
                      ? "border-orange-500 bg-orange-50 shadow-md cursor-pointer" 
                      : customerService.service_visit_4 
                        ? "border-green-200 bg-green-50 cursor-pointer hover:border-green-300" 
                        : !customerService.service_visit_3 
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-40" 
                          : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (customerService.service_visit_3 && !customerService.service_visit_4) {
                      handleInputChange("visitNumber", "4");
                    } else if (customerService.service_visit_3 && customerService.service_visit_4) {
                      // Both completed - allow selection for editing
                      handleInputChange("visitNumber", "4");
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      customerService.service_visit_4 
                        ? "bg-green-100" 
                        : formData.visitNumber === "4" 
                          ? "bg-orange-100" 
                          : !customerService.service_visit_3 
                            ? "bg-gray-100" 
                            : "bg-gray-100"
                    }`}>
                      {customerService.service_visit_4 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : formData.visitNumber === "4" ? (
                        <Wrench className="h-5 w-5 text-orange-600" />
                      ) : !customerService.service_visit_3 ? (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">บริการครั้งที่ 4</h3>
                      <p className="text-sm text-gray-600">
                        {customerService.service_visit_4 
                          ? "เสร็จสิ้นแล้ว" 
                          : !customerService.service_visit_3 
                            ? "ต้องทำครั้งที่ 3 ก่อน" 
                            : "รอดำเนินการ"}
                      </p>
                      {customerService.service_visit_4_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          วันที่: {new Date(customerService.service_visit_4_date).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>
                    {formData.visitNumber === "4" && (
                      <div className="p-1 bg-orange-500 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Visit 5 Card */}
                <div 
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.visitNumber === "5" 
                      ? "border-orange-500 bg-orange-50 shadow-md cursor-pointer" 
                      : customerService.service_visit_5 
                        ? "border-green-200 bg-green-50 cursor-pointer hover:border-green-300" 
                        : !customerService.service_visit_4 
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-40" 
                          : "border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-25 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (customerService.service_visit_4 && !customerService.service_visit_5) {
                      handleInputChange("visitNumber", "5");
                    } else if (customerService.service_visit_4 && customerService.service_visit_5) {
                      // Both completed - allow selection for editing
                      handleInputChange("visitNumber", "5");
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      customerService.service_visit_5 
                        ? "bg-green-100" 
                        : formData.visitNumber === "5" 
                          ? "bg-orange-100" 
                          : !customerService.service_visit_4 
                            ? "bg-gray-100" 
                            : "bg-gray-100"
                    }`}>
                      {customerService.service_visit_5 ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : formData.visitNumber === "5" ? (
                        <Wrench className="h-5 w-5 text-orange-600" />
                      ) : !customerService.service_visit_4 ? (
                        <AlertCircle className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">บริการครั้งที่ 5</h3>
                      <p className="text-sm text-gray-600">
                        {customerService.service_visit_5 
                          ? "เสร็จสิ้นแล้ว" 
                          : !customerService.service_visit_4 
                            ? "ต้องทำครั้งที่ 4 ก่อน" 
                            : "รอดำเนินการ"}
                      </p>
                      {customerService.service_visit_5_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          วันที่: {new Date(customerService.service_visit_5_date).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>
                    {formData.visitNumber === "5" && (
                      <div className="p-1 bg-orange-500 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {errors.visitNumber && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.visitNumber}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Visit Details */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              รายละเอียดการบริการ
            </CardTitle>
            <CardDescription>กรอกรายละเอียดการบริการ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visitDate" className="text-sm font-medium">
                วันที่บริการ *
              </Label>
              <Input
                id="visitDate"
                type="date"
                value={formData.visitDate}
                onChange={(e) => handleInputChange("visitDate", e.target.value)}
                className={errors.visitDate ? "border-red-500" : ""}
              />
              {errors.visitDate && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.visitDate}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">ช่างที่ไปบริการ:</p>
                  <p className="text-blue-700">{customerService.installer_name || "ไม่ระบุ"}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    (ใช้ช่างติดตั้งระบบเดียวกัน)
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Current Service Status */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              สถานะการบริการปัจจุบัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${customerService.service_visit_1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {customerService.service_visit_1 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">บริการครั้งที่ 1</p>
                  <p className="text-sm text-gray-600">
                    {customerService.service_visit_1 ? "เสร็จสิ้น" : "รอดำเนินการ"}
                  </p>
                  {customerService.service_visit_1_date && (
                    <p className="text-xs text-gray-500">
                      {new Date(customerService.service_visit_1_date).toLocaleDateString('th-TH')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${customerService.service_visit_2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {customerService.service_visit_2 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">บริการครั้งที่ 2</p>
                  <p className="text-sm text-gray-600">
                    {customerService.service_visit_2 ? "เสร็จสิ้น" : "รอดำเนินการ"}
                  </p>
                  {customerService.service_visit_2_date && (
                    <p className="text-xs text-gray-500">
                      {new Date(customerService.service_visit_2_date).toLocaleDateString('th-TH')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button 
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            ยกเลิก
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            บันทึกการบริการ
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ServiceVisitForm;
