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
  User, 
  MapPin, 
  Zap, 
  Wrench,
  Users,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  useCustomerServiceAPI as useCustomerService, 
  useCreateCustomerServiceAPI as useCreateCustomerService, 
  useUpdateCustomerServiceAPI as useUpdateCustomerService 
} from "@/hooks/useCustomerServicesAPI";
import { 
  useCreateCustomerServicePurchase,
  useCustomerServicePurchases 
} from "@/hooks/useCustomerServicePurchasesAPI";
import { useToast } from "@/hooks/useToast";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const CustomerServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    sale: "",
    customer_group: "",
    tel: "",
    installation_date: "",
    district: "",
    province: "",
    capacity_kw: "",
    notes: "",
    installer_name: "",
    service_package_type: "",
    purchase_number: "1", // ครั้งที่ซื้อ package
    // Service visit options
    service_visit_1: false,
    service_visit_2: false,
    service_visit_3: false,
    service_visit_4: false,
    service_visit_5: false,
    service_visit_1_date: "",
    service_visit_2_date: "",
    service_visit_3_date: "",
    service_visit_4_date: "",
    service_visit_5_date: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customSaleValue, setCustomSaleValue] = useState("");
  const [provinceSearch, setProvinceSearch] = useState("");

  // Fetch existing data for edit mode
  const { data: existingCustomerService, isLoading: isLoadingCustomerService } = useCustomerService(Number(id) || 0);
  const { data: existingPurchases } = useCustomerServicePurchases(Number(id) || 0);
  const createMutation = useCreateCustomerService();
  const updateMutation = useUpdateCustomerService();
  const createPurchaseMutation = useCreateCustomerServicePurchase();

  // Load existing data when in edit mode
  useEffect(() => {
    if (isEdit && existingCustomerService) {
      const saleValue = existingCustomerService.sale || "";
      const isCustomSale = saleValue && !saleOptions.slice(0, -1).includes(saleValue);
      
      // Calculate next purchase number from existing purchases
      const nextPurchaseNumber = existingPurchases && existingPurchases.length > 0 
        ? (existingPurchases.length + 1).toString() 
        : "1";
      
      setFormData({
        sale: isCustomSale ? "อื่นๆ" : saleValue,
        customer_group: existingCustomerService.customer_group || "",
        tel: existingCustomerService.tel || "",
        installation_date: existingCustomerService.installation_date || "",
        district: existingCustomerService.district || "",
        province: existingCustomerService.province || "",
        capacity_kw: existingCustomerService.capacity_kw?.toString() || "",
        notes: existingCustomerService.notes || "",
        installer_name: existingCustomerService.installer_name || "",
        service_package_type: existingCustomerService.service_package_type || "",
        purchase_number: nextPurchaseNumber,
        // Service visit data
        service_visit_1: existingCustomerService.service_visit_1 || false,
        service_visit_2: existingCustomerService.service_visit_2 || false,
        service_visit_3: existingCustomerService.service_visit_3 || false,
        service_visit_4: existingCustomerService.service_visit_4 || false,
        service_visit_5: existingCustomerService.service_visit_5 || false,
        service_visit_1_date: existingCustomerService.service_visit_1_date || "",
        service_visit_2_date: existingCustomerService.service_visit_2_date || "",
        service_visit_3_date: existingCustomerService.service_visit_3_date || "",
        service_visit_4_date: existingCustomerService.service_visit_4_date || "",
        service_visit_5_date: existingCustomerService.service_visit_5_date || "",
      });
      
      // Set custom value if it's a custom sale
      if (isCustomSale) {
        setCustomSaleValue(saleValue);
      }
    }
  }, [isEdit, existingCustomerService, existingPurchases]);

  const provinces = [
    "กรุงเทพมหานคร",
    "เชียงใหม่",
    "เชียงราย", 
    "ลำปาง",
    "ลำพูน",
    "แม่ฮ่องสอน",
    "อุตรดิตถ์",
    "แพร่",
    "น่าน",
    "พะเยา",
    "นครสวรรค์",
    "อุทัยธานี",
    "กำแพงเพชร",
    "ตาก",
    "สุโขทัย",
    "พิษณุโลก",
    "พิจิตร",
    "เพชรบูรณ์",
    "ราชบุรี",
    "กาญจนบุรี",
    "สุพรรณบุรี",
    "นครปฐม",
    "สมุทรสาคร",
    "สมุทรสงคราม",
    "สมุทรปราการ",
    "นนทบุรี",
    "ปทุมธานี",
    "พระนครศรีอยุธยา",
    "อ่างทอง",
    "ลพบุรี",
    "สิงห์บุรี",
    "ชัยนาท",
    "สระบุรี",
    "ระยอง",
    "จันทบุรี",
    "ตราด",
    "ฉะเชิงเทรา",
    "ปราจีนบุรี",
    "นครนายก",
    "สระแก้ว",
    "นครราชสีมา",
    "บุรีรัมย์",
    "สุรินทร์",
    "ศรีสะเกษ",
    "อุบลราชธานี",
    "ยโสธร",
    "ชัยภูมิ",
    "อำนาจเจริญ",
    "บึงกาฬ",
    "หนองบัวลำภู",
    "ขอนแก่น",
    "อุดรธานี",
    "เลย",
    "หนองคาย",
    "มหาสารคาม",
    "ร้อยเอ็ด",
    "กาฬสินธุ์",
    "สกลนคร",
    "นครพนม",
    "มุกดาหาร",
    "นครศรีธรรมราช",
    "กระบี่",
    "พังงา",
    "ภูเก็ต",
    "สุราษฎร์ธานี",
    "ระนอง",
    "ชุมพร",
    "สงขลา",
    "สตูล",
    "ตรัง",
    "พัทลุง",
    "ปัตตานี",
    "ยะลา",
    "นราธิวาส"
  ];

  // Filter provinces based on search
  const filteredProvinces = provinces.filter(province =>
    province.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  const saleOptions = [
    "EV",
    "HP",
    "Premier",
    "Gulf",
    "101",
    "อื่นๆ"
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
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

    if (!formData.customer_group.trim()) {
      newErrors.customer_group = "กรุณากรอกกลุ่มไลน์ซัพพอร์ตลูกค้า";
    }

    if (!formData.tel.trim()) {
      newErrors.tel = "กรุณากรอกเบอร์โทรศัพท์";
    }

    if (!formData.province) {
      newErrors.province = "กรุณาเลือกจังหวัด";
    }

    if (!formData.installation_date) {
      newErrors.installation_date = "กรุณาเลือกวันที่ติดตั้ง";
    }

    if (formData.capacity_kw && isNaN(Number(formData.capacity_kw))) {
      newErrors.capacity_kw = "กรุณากรอกตัวเลขเท่านั้น";
    }

    // Validate custom sale value
    if (formData.sale === "อื่นๆ" && !customSaleValue.trim()) {
      newErrors.sale = "กรุณากรอกฝ่ายขายที่ต้องการ";
    }

    // Validate purchase_number if service_package_type is selected
    if (formData.service_package_type) {
      const purchaseNumber = parseInt(formData.purchase_number);
      if (!formData.purchase_number || isNaN(purchaseNumber) || purchaseNumber < 1) {
        newErrors.purchase_number = "กรุณากรอกครั้งที่ซื้อ package (ต้องเป็นตัวเลขมากกว่า 0)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Determine the actual sale value to submit
      const actualSaleValue = formData.sale === "อื่นๆ" && customSaleValue.trim() 
        ? customSaleValue.trim() 
        : formData.sale || null;
        
      const submitData = {
        sale: actualSaleValue,
        customer_group: formData.customer_group,
        tel: formData.tel,
        installation_date: formData.installation_date || null,
        installation_date_thai: formData.installation_date ? format(new Date(formData.installation_date), "yyyy-MM-dd", { locale: th }) : null,
        district: formData.district || null,
        province: formData.province,
        capacity_kw: formData.capacity_kw ? Number(formData.capacity_kw) : null,
        notes: formData.notes || null,
        installer_name: formData.installer_name || null,
        service_package_type: formData.service_package_type || null,
        service_visit_1: formData.service_visit_1,
        service_visit_2: formData.service_visit_2,
        service_visit_1_date: formData.service_visit_1_date || null,
        service_visit_1_date_thai: formData.service_visit_1_date ? format(new Date(formData.service_visit_1_date), "yyyy-MM-dd", { locale: th }) : null,
        service_visit_2_date: formData.service_visit_2_date || null,
        service_visit_2_date_thai: formData.service_visit_2_date ? format(new Date(formData.service_visit_2_date), "yyyy-MM-dd", { locale: th }) : null,
        service_visit_1_technician: null,
        service_visit_2_technician: null,
      };

      if (isEdit && id) {
        const customerId = Number(id);
        const oldPackageType = existingCustomerService?.service_package_type;
        const newPackageType = formData.service_package_type || null;
        
        // Update customer service
        await updateMutation.mutateAsync({ id: customerId, data: submitData });
        
        // If service_package_type changed or is newly added, create purchase record
        if (newPackageType && (oldPackageType !== newPackageType || !oldPackageType)) {
          try {
            const purchaseDate = formData.installation_date || new Date().toISOString().split('T')[0];
            const purchaseDateObj = new Date(purchaseDate);
            const purchaseDateThai = new Date(purchaseDateObj);
            purchaseDateThai.setHours(purchaseDateThai.getHours() + 7);

            await createPurchaseMutation.mutateAsync({
              customer_service_id: customerId,
              service_package_type: newPackageType as '1_year' | '3_year' | '5_year',
              purchase_date: purchaseDate,
              purchase_date_thai: purchaseDateThai.toISOString(),
              status: 'active',
              notes: formData.purchase_number ? `ซื้อครั้งที่ ${formData.purchase_number}` : null,
            });
          } catch (purchaseError) {
            console.error("Failed to create purchase record:", purchaseError);
            toast({
              title: "คำเตือน",
              description: "อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว แต่ไม่สามารถบันทึกประวัติการซื้อได้",
              variant: "destructive",
            });
          }
        }
        
        toast({
          title: "อัปเดตสำเร็จ",
          description: "อัปเดตข้อมูลลูกค้าเรียบร้อยแล้ว",
        });
        // Stay on the same edit page after update
        // No navigation needed - user stays on edit page
      } else {
        // Create customer service
        const newCustomer = await createMutation.mutateAsync(submitData);
        
        // If service_package_type is provided, create purchase record
        if (formData.service_package_type && newCustomer?.id && formData.installation_date) {
          try {
            const purchaseDate = new Date(formData.installation_date);
            const purchaseDateThai = new Date(purchaseDate);
            purchaseDateThai.setHours(purchaseDateThai.getHours() + 7);

            await createPurchaseMutation.mutateAsync({
              customer_service_id: newCustomer.id,
              service_package_type: formData.service_package_type as '1_year' | '3_year' | '5_year',
              purchase_date: formData.installation_date,
              purchase_date_thai: purchaseDateThai.toISOString(),
              status: 'active',
              notes: formData.purchase_number ? `ซื้อครั้งที่ ${formData.purchase_number}` : null,
            });
          } catch (purchaseError) {
            console.error("Failed to create purchase record:", purchaseError);
            // Don't fail the whole operation if purchase record creation fails
            toast({
              title: "คำเตือน",
              description: "สร้างข้อมูลลูกค้าเรียบร้อยแล้ว แต่ไม่สามารถบันทึกประวัติการซื้อได้",
              variant: "destructive",
            });
          }
        }
        
        toast({
          title: "สร้างสำเร็จ",
          description: "สร้างข้อมูลลูกค้าใหม่เรียบร้อยแล้ว",
        });
        // Stay on the same new page after create
        // No navigation needed - user stays on new page
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: isEdit ? "ไม่สามารถอัปเดตข้อมูลลูกค้าได้" : "ไม่สามารถสร้างข้อมูลลูกค้าได้",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/service-tracking/customer-services");
  };

  // Loading state for edit mode
  if (isEdit && isLoadingCustomerService) {
    return <PageLoading type="form" />;
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              ข้อมูลลูกค้า
            </CardTitle>
            <CardDescription>กรอกข้อมูลพื้นฐานของลูกค้า</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sale" className="text-sm font-semibold">
                  ฝ่ายขาย
                </Label>
                <Select 
                  value={formData.sale} 
                  onValueChange={(value) => {
                    handleInputChange("sale", value);
                    if (value !== "อื่นๆ") {
                      setCustomSaleValue("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกฝ่ายขาย" />
                  </SelectTrigger>
                  <SelectContent>
                    {saleOptions.map(sale => (
                      <SelectItem key={sale} value={sale}>
                        {sale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {formData.sale === "อื่นๆ" && (
                  <div className="mt-2">
                    <Input
                      placeholder="กรอกฝ่ายขายที่ต้องการ"
                      value={customSaleValue}
                      onChange={(e) => {
                        setCustomSaleValue(e.target.value);
                        // Clear error when user starts typing
                        if (errors.sale) {
                          setErrors(prev => ({
                            ...prev,
                            sale: ""
                          }));
                        }
                      }}
                      className={`border-orange-200 focus:border-orange-400 ${errors.sale ? "border-red-500" : ""}`}
                    />
                  </div>
                )}
                {errors.sale && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.sale}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_group" className="text-sm font-semibold">
                  ชื่อลูกค้า หรือ กลุ่มไลน์ซัพพอร์ตลูกค้า *
                </Label>
                <Input
                  id="customer_group"
                  value={formData.customer_group}
                  onChange={(e) => handleInputChange("customer_group", e.target.value)}
                  placeholder="กรอกกลุ่มไลน์ซัพพอร์ตลูกค้า (รวมรายละเอียดในวงเล็บ)"
                  className={errors.customer_group ? "border-red-500" : ""}
                />
                {errors.customer_group && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.customer_group}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tel" className="text-sm font-semibold">
                  เบอร์โทรศัพท์ *
                </Label>
                <Input
                  id="tel"
                  value={formData.tel}
                  onChange={(e) => handleInputChange("tel", e.target.value)}
                  placeholder="กรอกเบอร์โทรศัพท์"
                  className={errors.tel ? "border-red-500" : ""}
                />
                {errors.tel && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.tel}
                  </p>
                )}
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              ข้อมูลที่อยู่
            </CardTitle>
            <CardDescription>กรอกข้อมูลที่อยู่ของลูกค้า</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province" className="text-sm font-semibold">
                  จังหวัด *
                </Label>
                <Select 
                  value={formData.province} 
                  onValueChange={(value) => {
                    handleInputChange("province", value);
                    setProvinceSearch("");
                  }}
                >
                  <SelectTrigger className={errors.province ? "border-red-500" : ""}>
                    <SelectValue placeholder="เลือกจังหวัด" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="ค้นหาจังหวัด..."
                        value={provinceSearch}
                        onChange={(e) => setProvinceSearch(e.target.value)}
                        className="h-8"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-auto">
                      {filteredProvinces.map(province => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                {errors.province && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.province}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-semibold">
                  อำเภอ
                </Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange("district", e.target.value)}
                  placeholder="กรอกอำเภอ"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Information */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              ข้อมูลการติดตั้ง
            </CardTitle>
            <CardDescription>กรอกข้อมูลการติดตั้งระบบ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installation_date" className="text-sm font-semibold">
                  วันที่ติดตั้ง *
                </Label>
                <Input
                  id="installation_date"
                  type="date"
                  value={formData.installation_date}
                  onChange={(e) => handleInputChange("installation_date", e.target.value)}
                  className={errors.installation_date ? "border-red-500" : ""}
                />
                {errors.installation_date && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.installation_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity_kw" className="text-sm font-semibold">
                  กิโลวัตต์ที่ติดตั้ง
                </Label>
                <Input
                  id="capacity_kw"
                  type="number"
                  step="0.1"
                  value={formData.capacity_kw}
                  onChange={(e) => handleInputChange("capacity_kw", e.target.value)}
                  placeholder="กรอกเเค่ตัวเลข"
                  className={errors.capacity_kw ? "border-red-500" : ""}
                />
                {errors.capacity_kw && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.capacity_kw}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installer_name" className="text-sm font-semibold">
                  ช่างติดตั้ง
                </Label>
                <Input
                  id="installer_name"
                  value={formData.installer_name}
                  onChange={(e) => handleInputChange("installer_name", e.target.value)}
                  placeholder="กรอกชื่อช่างติดตั้ง"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_package_type" className="text-sm font-semibold">
                  แพ็คเกจ Service
                </Label>
                <Select 
                  value={formData.service_package_type} 
                  onValueChange={(value) => handleInputChange("service_package_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกแพ็คเกจ Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_year">1 ปี (Service 1 ครั้ง)</SelectItem>
                    <SelectItem value="3_year">3 ปี (Service 3 ครั้ง)</SelectItem>
                    <SelectItem value="5_year">5 ปี (Service 5 ครั้ง)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_number" className="text-sm font-semibold">
                  ซื้อ Package ครั้งที่เท่าไหร่ {formData.service_package_type && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="purchase_number"
                  type="number"
                  min="1"
                  value={formData.purchase_number}
                  onChange={(e) => handleInputChange("purchase_number", e.target.value)}
                  placeholder="เช่น 1, 2, 3..."
                  disabled={!formData.service_package_type}
                  className={errors.purchase_number ? "border-red-500" : ""}
                />
                {errors.purchase_number && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.purchase_number}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {!formData.service_package_type 
                    ? "กรุณาเลือกแพ็คเกจ Service ก่อน"
                    : isEdit && existingPurchases && existingPurchases.length > 0 
                      ? `มีประวัติ ${existingPurchases.length} ครั้ง - ครั้งถัดไป: ${existingPurchases.length + 1}`
                      : "ครั้งแรก: 1"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Visits */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              การบริการลูกค้า
            </CardTitle>
            <CardDescription>เลือกบริการที่ต้องการเพิ่มให้ลูกค้า (สามารถเพิ่มได้ในภายหลัง)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Visits Grid - แนวนอน */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Service Visit 1 */}
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="service_visit_1"
                    checked={formData.service_visit_1}
                    onChange={(e) => handleInputChange("service_visit_1", e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="service_visit_1" className="text-sm font-semibold">
                    บริการครั้งที่ 1
                  </Label>
                </div>
                
                {formData.service_visit_1 && (
                  <div className="space-y-2">
                    <Label htmlFor="service_visit_1_date" className="text-xs font-medium text-gray-600">
                      วันที่บริการ
                    </Label>
                    <Input
                      id="service_visit_1_date"
                      type="date"
                      value={formData.service_visit_1_date}
                      onChange={(e) => handleInputChange("service_visit_1_date", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Service Visit 2 */}
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="service_visit_2"
                    checked={formData.service_visit_2}
                    onChange={(e) => handleInputChange("service_visit_2", e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="service_visit_2" className="text-sm font-semibold">
                    บริการครั้งที่ 2
                  </Label>
                </div>
                
                {formData.service_visit_2 && (
                  <div className="space-y-2">
                    <Label htmlFor="service_visit_2_date" className="text-xs font-medium text-gray-600">
                      วันที่บริการ
                    </Label>
                    <Input
                      id="service_visit_2_date"
                      type="date"
                      value={formData.service_visit_2_date}
                      onChange={(e) => handleInputChange("service_visit_2_date", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Service Visit 3 */}
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="service_visit_3"
                    checked={formData.service_visit_3}
                    onChange={(e) => handleInputChange("service_visit_3", e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="service_visit_3" className="text-sm font-semibold">
                    บริการครั้งที่ 3
                  </Label>
                </div>
                
                {formData.service_visit_3 && (
                  <div className="space-y-2">
                    <Label htmlFor="service_visit_3_date" className="text-xs font-medium text-gray-600">
                      วันที่บริการ
                    </Label>
                    <Input
                      id="service_visit_3_date"
                      type="date"
                      value={formData.service_visit_3_date}
                      onChange={(e) => handleInputChange("service_visit_3_date", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Service Visit 4 */}
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="service_visit_4"
                    checked={formData.service_visit_4}
                    onChange={(e) => handleInputChange("service_visit_4", e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="service_visit_4" className="text-sm font-semibold">
                    บริการครั้งที่ 4
                  </Label>
                </div>
                
                {formData.service_visit_4 && (
                  <div className="space-y-2">
                    <Label htmlFor="service_visit_4_date" className="text-xs font-medium text-gray-600">
                      วันที่บริการ
                    </Label>
                    <Input
                      id="service_visit_4_date"
                      type="date"
                      value={formData.service_visit_4_date}
                      onChange={(e) => handleInputChange("service_visit_4_date", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Service Visit 5 */}
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="service_visit_5"
                    checked={formData.service_visit_5}
                    onChange={(e) => handleInputChange("service_visit_5", e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="service_visit_5" className="text-sm font-semibold">
                    บริการครั้งที่ 5
                  </Label>
                </div>
                
                {formData.service_visit_5 && (
                  <div className="space-y-2">
                    <Label htmlFor="service_visit_5_date" className="text-xs font-medium text-gray-600">
                      วันที่บริการ
                    </Label>
                    <Input
                      id="service_visit_5_date"
                      type="date"
                      value={formData.service_visit_5_date}
                      onChange={(e) => handleInputChange("service_visit_5_date", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">หมายเหตุ:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• สามารถเพิ่มบริการได้ในภายหลังผ่านหน้า "บริการลูกค้า"</li>
                    <li>• หากไม่เลือกบริการตอนนี้ ระบบจะแสดงสถานะ "รอบริการครั้งที่ 1"</li>
                    <li>• ระบบรองรับการบริการสูงสุด 5 ครั้ง</li>
                    <li>• วันที่บริการควรเป็นวันที่หลังจากการติดตั้ง</li>
                    <li>• ช่างเทคนิคจะถูกกำหนดในภายหลังเมื่อมีการบันทึกการบริการ</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              หมายเหตุ
            </CardTitle>
            <CardDescription>เพิ่มหมายเหตุหรือข้อมูลเพิ่มเติม</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="กรอกหมายเหตุหรือข้อมูลเพิ่มเติม..."
              rows={4}
            />
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
            {isEdit ? "บันทึกการแก้ไข" : "บันทึกข้อมูลลูกค้าใหม่"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerServiceForm;
