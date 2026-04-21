import { useState, useEffect, useRef } from "react";
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
  FileText,
  AlertCircle,
  Loader2,
  Calendar,
  Paperclip
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  usePermitRequest, 
  useCreatePermitRequest, 
  useUpdatePermitRequest 
} from "@/hooks/usePermitRequests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import MultiFileUpload, { MultiFileUploadRef } from "@/components/ui/multi-file-upload";

const RequestForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    requester_name: "",
    phone_number: "",
    district: "",
    province: "",
    capacity_kw: "",
    main_status: "",
    sub_status: "",
    executor: "",
    note: "",
    // ข้อมูลใหม่
    operator_name: "",
    company_name: "",
    document_number: "",
    requested_name: "",
    document_received_date: "",
    completion_date: "",
    online_date: "",
    team_leader: "",
    connection_type: "",
    meter_number: "",
    permit_number: "",
    map_reference: ""
  });

  const [attachments, setAttachments] = useState<Array<{
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: string;
  }>>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [provinceSearch, setProvinceSearch] = useState("");
  const [latestSLNumber, setLatestSLNumber] = useState<string>("");
  const [latestWCNumber, setLatestWCNumber] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Ref for file upload component
  const fileUploadRef = useRef<MultiFileUploadRef>(null);

  // Fetch existing data for edit mode
  const { data: existingRequest, isLoading: isLoadingRequest } = usePermitRequest(
    id ? parseInt(id, 10) : 0
  );
  const createMutation = useCreatePermitRequest();
  const updateMutation = useUpdatePermitRequest();

  // Fetch latest SL document number
  const { data: latestSLData, isLoading: isLoadingLatestSL } = useQuery({
    queryKey: ["latest_sl_document_number"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_requests")
        .select("document_number")
        .not("document_number", "is", null)
        .like("document_number", "SL-%")
        .order("id", { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(`Failed to fetch latest SL document number: ${error.message}`);
      }

      return data?.[0]?.document_number || "";
    },
    enabled: !isEdit, // Only fetch for new requests
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch latest WC document number
  const { data: latestWCData, isLoading: isLoadingLatestWC } = useQuery({
    queryKey: ["latest_wc_document_number"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_requests")
        .select("document_number")
        .not("document_number", "is", null)
        .like("document_number", "WC-%")
        .order("id", { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(`Failed to fetch latest WC document number: ${error.message}`);
      }

      return data?.[0]?.document_number || "";
    },
    enabled: !isEdit, // Only fetch for new requests
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load existing data when in edit mode
  useEffect(() => {
    if (isEdit && existingRequest) {
      setFormData({
        requester_name: existingRequest.requester_name || "",
        phone_number: existingRequest.phone_number || "",
        district: existingRequest.district || "",
        province: existingRequest.province || "",
        capacity_kw: existingRequest.capacity_kw?.toString() || "",
        main_status: existingRequest.main_status || "",
        sub_status: existingRequest.sub_status || "",
        executor: existingRequest.executor || "",
        note: existingRequest.note || "",
        operator_name: existingRequest.operator_name || "",
        company_name: existingRequest.company_name || "",
        document_number: existingRequest.document_number || "",
        requested_name: existingRequest.requested_name || "",
        document_received_date: existingRequest.document_received_date || "",
        completion_date: existingRequest.completion_date || "",
        online_date: existingRequest.online_date || "",
        team_leader: existingRequest.team_leader || "",
        connection_type: existingRequest.connection_type || "",
        meter_number: existingRequest.meter_number || "",
        permit_number: existingRequest.permit_number || "",
        map_reference: existingRequest.map_reference || ""
      });
      
      // Load attachments
      if (existingRequest.attachments) {
        try {
          const parsedAttachments = typeof existingRequest.attachments === 'string' 
            ? JSON.parse(existingRequest.attachments) 
            : existingRequest.attachments;
          setAttachments(Array.isArray(parsedAttachments) ? parsedAttachments : []);
        } catch (error) {
          console.error('Error parsing attachments:', error);
          setAttachments([]);
        }
      }
    }
  }, [isEdit, existingRequest]);

  // Set latest document numbers for new requests
  useEffect(() => {
    if (!isEdit && latestSLData) {
      setLatestSLNumber(latestSLData);
    }
  }, [isEdit, latestSLData]);

  useEffect(() => {
    if (!isEdit && latestWCData) {
      setLatestWCNumber(latestWCData);
    }
  }, [isEdit, latestWCData]);

  const provinces = [
    "ไม่ระบุ",
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

  const mainStatusOptions = [
    "ไม่สามารถดำเนินการได้",
    "ระหว่างดำเนินการ", 
    "ดำเนินการเสร็จสิ้น",
    "ไม่ยื่นขออนุญาต",
    "ยกเลิกกิจการ"
  ];

  const executorOptions = [
    "EV ดำเนินการให้",
    "ลูกค้าดำเนินการเอง"
  ];

  const subStatusOptions = {
    "ไม่สามารถดำเนินการได้": [
      "ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์",
      "รอโควต้าขายไฟรอบใหม่"
    ],
    "ระหว่างดำเนินการ": [
      "รอเอกสารสำคัญเพื่อจัดทำเล่ม",
      "อยู่ระหว่างดำเนินการบืนยันเข้าสู่ระบบ PEA หรือ MEA",
      "ยื่นคำร้องเข้าระบบการไฟฟ้าเรียบร้อย รอการไฟฟ้าดำเนินการตรวจสอบ",
      "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร",
      "อยู่ระหว่างการชำระเงิน",
      "ชำระค่าบริการแล้ว",
      "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้หน้างาน",
      "รอ PEA หรือ MEA นัดหมาย เข้าตรวจสอบงานติดตั้ง",
      "COD เรียบร้อย รอเปลี่ยนมิเตอร์"
    ],
    "ดำเนินการเสร็จสิ้น": [],
    "ไม่ยื่นขออนุญาต": [],
    "ยกเลิกกิจการ": []
  };

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

    if (!formData.requester_name.trim()) {
      newErrors.requester_name = "กรุณากรอกชื่อผู้ขอ";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "กรุณากรอกเบอร์โทรศัพท์";
    }


    if (!formData.main_status) {
      newErrors.main_status = "กรุณาเลือกสถานะหลัก";
    }

    if (formData.capacity_kw && isNaN(Number(formData.capacity_kw))) {
      newErrors.capacity_kw = "กรุณากรอกตัวเลขเท่านั้น";
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
      setIsUploading(true);

      // Upload pending files first (if any)
      let newlyUploadedFiles = [];
      if (fileUploadRef.current) {
        const pendingFiles = fileUploadRef.current.getPendingFiles();
        if (pendingFiles.length > 0) {
          toast({
            title: "กำลังอัปโหลดไฟล์...",
            description: `กำลังอัปโหลด ${pendingFiles.length} ไฟล์`,
          });
          newlyUploadedFiles = await fileUploadRef.current.uploadPendingFiles();
        }

        // Delete files that were marked for deletion
        await fileUploadRef.current.deleteRemovedFiles();
      }

      // Combine existing attachments with newly uploaded files
      const allAttachments = [...attachments, ...newlyUploadedFiles];

      const submitData = {
        requester_name: formData.requester_name,
        phone_number: formData.phone_number || null,
        district: formData.district || null,
        province: formData.province || null,
        capacity_kw: formData.capacity_kw ? Number(formData.capacity_kw) : null,
        main_status: formData.main_status,
        sub_status: formData.sub_status || null,
        executor: formData.executor || null,
        note: formData.note || null,
        operator_name: formData.operator_name || null,
        company_name: formData.company_name || null,
        document_number: formData.document_number || null,
        requested_name: formData.requested_name || null,
        document_received_date: formData.document_received_date || null,
        completion_date: formData.completion_date || null,
        online_date: formData.online_date || null,
        team_leader: formData.team_leader || null,
        connection_type: formData.connection_type || null,
        meter_number: formData.meter_number || null,
        permit_number: formData.permit_number || null,
        map_reference: formData.map_reference || null,
        attachments: allAttachments,
      };

      if (isEdit && id) {
        await updateMutation.mutateAsync({ 
          id: parseInt(id, 10), 
          data: submitData 
        });
        toast({
          title: "อัปเดตสำเร็จ",
          description: "อัปเดตคำขออนุญาตเรียบร้อยแล้ว",
        });
        // Navigate back to requests list with saved filters
        const savedFilters = sessionStorage.getItem('requestsListFilters');
        if (savedFilters) {
          try {
            const filters = JSON.parse(savedFilters);
            const searchParams = new URLSearchParams();
            if (filters.status && filters.status !== 'all') {
              searchParams.set('status', filters.status);
            }
            if (filters.subStatus && filters.subStatus !== 'all') {
              searchParams.set('subStatus', filters.subStatus);
            }
            if (filters.executor && filters.executor !== 'all') {
              searchParams.set('executor', filters.executor);
            }
            const queryString = searchParams.toString();
            navigate(`/service-tracking/requests${queryString ? `?${queryString}` : ''}`);
          } catch (error) {
            console.error('Error parsing saved filters:', error);
            navigate("/service-tracking/requests");
          }
        } else {
          navigate("/service-tracking/requests");
        }
      } else {
        const newRequest = await createMutation.mutateAsync(submitData);
        toast({
          title: "สร้างสำเร็จ",
          description: "สร้างคำขออนุญาตใหม่เรียบร้อยแล้ว",
        });
        // Navigate to edit page of the newly created request
        navigate(`/service-tracking/requests/${newRequest.id}/edit`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: isEdit ? "ไม่สามารถอัปเดตคำขอได้" : "ไม่สามารถสร้างคำขอได้",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to requests list with saved filters
    const savedFilters = sessionStorage.getItem('requestsListFilters');
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        const searchParams = new URLSearchParams();
        if (filters.status && filters.status !== 'all') {
          searchParams.set('status', filters.status);
        }
        if (filters.subStatus && filters.subStatus !== 'all') {
          searchParams.set('subStatus', filters.subStatus);
        }
        if (filters.executor && filters.executor !== 'all') {
          searchParams.set('executor', filters.executor);
        }
        const queryString = searchParams.toString();
        navigate(`/service-tracking/requests${queryString ? `?${queryString}` : ''}`);
      } catch (error) {
        console.error('Error parsing saved filters:', error);
        navigate("/service-tracking/requests");
      }
    } else {
      navigate("/service-tracking/requests");
    }
  };

  // Loading state for edit mode
  if (isEdit && isLoadingRequest) {
    return <PageLoading type="form" />;
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="w-full space-y-6">

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ข้อมูลลูกค้าและเอกสาร */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <User className="h-5 w-5" />
              ข้อมูลลูกค้าและเอกสาร
            </CardTitle>
            <CardDescription className="text-blue-600">กรอกข้อมูลพื้นฐานของลูกค้าและเอกสารที่เกี่ยวข้อง</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* แถวที่ 1: ผู้ดำเนินการขออนุญาต, บริษัท, เลขที่เอกสาร */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ผู้ดำเนินการขออนุญาต */}
              <div className="space-y-2">
                <Label htmlFor="operatorName" className="text-sm font-semibold text-blue-800">
                  ผู้ดำเนินการขออนุญาต
                </Label>
                <Input
                  id="operator_name"
                  value={formData.operator_name}
                  onChange={(e) => handleInputChange("operator_name", e.target.value)}
                  placeholder="กรอกชื่อผู้ดำเนินการขออนุญาต"
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              {/* บริษัท */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-semibold text-blue-800">
                  บริษัท
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="กรอกชื่อบริษัท"
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              {/* เลขที่เอกสาร */}
              <div className="space-y-2">
                <Label htmlFor="documentNumber" className="text-sm font-semibold text-blue-800">
                  เลขที่เอกสาร
                </Label>
                <div className="space-y-1">
                  <Input
                    id="document_number"
                    value={formData.document_number}
                    onChange={(e) => handleInputChange("document_number", e.target.value)}
                    placeholder="กรอกเลขที่เอกสาร"
                    className="border-blue-200 focus:border-blue-400"
                  />
                  {!isEdit && (latestSLNumber || latestWCNumber) && (
                    <div className="space-y-1">
                      {latestSLNumber && (
                        <p className="text-xs text-gray-600">
                          SL ล่าสุด: <span className="font-medium text-blue-600">{latestSLNumber}</span>
                        </p>
                      )}
                      {latestWCNumber && (
                        <p className="text-xs text-gray-600">
                          WC ล่าสุด: <span className="font-medium text-green-600">{latestWCNumber}</span>
                        </p>
                      )}
                    </div>
                  )}
                  {!isEdit && (isLoadingLatestSL || isLoadingLatestWC) && (
                    <p className="text-xs text-gray-500">กำลังโหลดเลขเอกสารล่าสุด...</p>
                  )}
                </div>
              </div>
            </div>

            {/* แถวที่ 2: ชื่อผู้ขอ, ชื่อที่ขออนุญาต, เบอร์โทรศัพท์ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ชื่อผู้ขอ */}
              <div className="space-y-2">
                <Label htmlFor="requesterName" className="text-sm font-semibold text-blue-800">
                  ชื่อผู้ขอ *
                </Label>
                <Input
                  id="requester_name"
                  value={formData.requester_name}
                  onChange={(e) => handleInputChange("requester_name", e.target.value)}
                  placeholder="กรอกชื่อผู้ขอ"
                  className={errors.requester_name ? "border-red-500" : "border-blue-200 focus:border-blue-400"}
                />
                {errors.requester_name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.requester_name}
                  </p>
                )}
              </div>

              {/* ชื่อที่ขออนุญาต */}
              <div className="space-y-2">
                <Label htmlFor="requestedName" className="text-sm font-semibold text-blue-800">
                  ชื่อที่ขออนุญาต
                </Label>
                <Input
                  id="requested_name"
                  value={formData.requested_name}
                  onChange={(e) => handleInputChange("requested_name", e.target.value)}
                  placeholder="กรอกชื่อที่ขออนุญาต"
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>

              {/* เบอร์โทรศัพท์ */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-semibold text-blue-800">
                  เบอร์โทรศัพท์ *
                </Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  placeholder="กรอกเบอร์โทรศัพท์"
                  className={errors.phone_number ? "border-red-500" : "border-blue-200 focus:border-blue-400"}
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone_number}
                  </p>
                )}
              </div>
            </div>

            {/* แถวที่ 3: จังหวัด, อำเภอ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* จังหวัด */}
              <div className="space-y-2">
                <Label htmlFor="province" className="text-sm font-semibold text-blue-800">
                  จังหวัด
                </Label>
                <Select 
                  value={formData.province} 
                  onValueChange={(value) => {
                    handleInputChange("province", value);
                    setProvinceSearch("");
                  }}
                >
                  <SelectTrigger className="border-blue-200 focus:border-blue-400">
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
              </div>

              {/* อำเภอ */}
              <div className="space-y-2">
                <Label htmlFor="district" className="text-sm font-semibold text-blue-800">
                  อำเภอ
                </Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange("district", e.target.value)}
                  placeholder="กรอกอำเภอ"
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
            </div>

            {/* ส่วนข้อมูลวันที่ */}
            <div>
              <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                วันที่ดำเนินการ
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* วันที่รับเอกสาร */}
                <div className="space-y-2">
                  <Label htmlFor="documentReceivedDate" className="text-sm font-semibold text-blue-800">
                    วันที่รับเอกสาร
                  </Label>
                  <Input
                    id="document_received_date"
                    type="date"
                    value={formData.document_received_date}
                    onChange={(e) => handleInputChange("document_received_date", e.target.value)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>

                {/* วันที่ดำเนินการเสร็จ */}
                <div className="space-y-2">
                  <Label htmlFor="completionDate" className="text-sm font-semibold text-blue-800">
                    วันที่ดำเนินการเสร็จ
                  </Label>
                  <Input
                    id="completion_date"
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => handleInputChange("completion_date", e.target.value)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>

                {/* วันที่ออนระบบ */}
                <div className="space-y-2">
                  <Label htmlFor="onlineDate" className="text-sm font-semibold text-blue-800">
                    วันที่ออนระบบ
                  </Label>
                  <Input
                    id="online_date"
                    type="date"
                    value={formData.online_date}
                    onChange={(e) => handleInputChange("online_date", e.target.value)}
                    className="border-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ข้อมูลการติดตั้ง */}
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Zap className="h-5 w-5" />
              ข้อมูลการติดตั้ง
            </CardTitle>
            <CardDescription className="text-green-600">กรอกข้อมูลการติดตั้งระบบและอุปกรณ์</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ขนาดติดตั้ง (kW) */}
              <div className="space-y-2">
                <Label htmlFor="capacityKw" className="text-sm font-semibold text-green-800">
                  ขนาดติดตั้ง (kW) *
                </Label>
                <Input
                  id="capacity_kw"
                  type="number"
                  step="0.1"
                  value={formData.capacity_kw}
                  onChange={(e) => handleInputChange("capacity_kw", e.target.value)}
                  placeholder="กรอกขนาดกำลังไฟฟ้า"
                  className={errors.capacity_kw ? "border-red-500" : "border-green-200 focus:border-green-400"}
                />
                {errors.capacity_kw && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.capacity_kw}
                  </p>
                )}
              </div>

              {/* ผู้คุมงาน + ทีมช่าง */}
              <div className="space-y-2">
                <Label htmlFor="teamLeader" className="text-sm font-semibold text-green-800">
                  ผู้คุมงาน + ทีมช่าง
                </Label>
                <Input
                  id="team_leader"
                  value={formData.team_leader}
                  onChange={(e) => handleInputChange("team_leader", e.target.value)}
                  placeholder="กรอกชื่อผู้คุมงานและทีมช่าง"
                  className="border-green-200 focus:border-green-400"
                />
              </div>

              {/* ขนาน/ขาย */}
              <div className="space-y-2">
                <Label htmlFor="connectionType" className="text-sm font-semibold text-green-800">
                  ขนาน/ขาย
                </Label>
                <Select value={formData.connection_type} onValueChange={(value) => handleInputChange("connection_type", value)}>
                  <SelectTrigger className="border-green-200 focus:border-green-400">
                    <SelectValue placeholder="เลือกประเภทการเชื่อมต่อ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ขนาน">ขนาน</SelectItem>
                    <SelectItem value="ขาย">ขาย</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* เลขมิเตอร์ */}
              <div className="space-y-2">
                <Label htmlFor="meterNumber" className="text-sm font-semibold text-green-800">
                  เลขมิเตอร์
                </Label>
                <Input
                  id="meter_number"
                  value={formData.meter_number}
                  onChange={(e) => handleInputChange("meter_number", e.target.value)}
                  placeholder="กรอกเลขมิเตอร์"
                  className="border-green-200 focus:border-green-400"
                />
              </div>

              {/* เลขที่ขออนุญาต */}
              <div className="space-y-2">
                <Label htmlFor="permitNumber" className="text-sm font-semibold text-green-800">
                  เลขที่ขออนุญาต
                </Label>
                <Input
                  id="permit_number"
                  value={formData.permit_number}
                  onChange={(e) => handleInputChange("permit_number", e.target.value)}
                  placeholder="กรอกเลขที่ขออนุญาต"
                  className="border-green-200 focus:border-green-400"
                />
              </div>

              {/* MAP */}
              <div className="space-y-2">
                <Label htmlFor="mapReference" className="text-sm font-semibold text-green-800">
                  MAP
                </Label>
                <Input
                  id="map_reference"
                  value={formData.map_reference}
                  onChange={(e) => handleInputChange("map_reference", e.target.value)}
                  placeholder="กรอกข้อมูล MAP"
                  className="border-green-200 focus:border-green-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              สถานะการดำเนินการ
            </CardTitle>
            <CardDescription>กำหนดสถานะการดำเนินการ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* ผู้ดำเนินการ */}
              <div className="space-y-2">
                <Label htmlFor="executor" className="text-sm font-semibold">
                  ผู้ดำเนินการ
                </Label>
                <Select 
                  value={formData.executor} 
                  onValueChange={(value) => handleInputChange("executor", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกผู้ดำเนินการ" />
                  </SelectTrigger>
                  <SelectContent>
                    {executorOptions.map(executor => (
                      <SelectItem key={executor} value={executor}>
                        {executor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* สถานะหลักและสถานะย่อย */}
              <div className={`grid gap-4 ${formData.main_status && subStatusOptions[formData.main_status as keyof typeof subStatusOptions]?.length > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                <div className="space-y-2">
                  <Label htmlFor="mainStatus" className="text-sm font-semibold">
                    สถานะหลัก *
                  </Label>
                  <Select 
                    value={formData.main_status} 
                    onValueChange={(value) => {
                      handleInputChange("main_status", value);
                      handleInputChange("sub_status", ""); // Reset sub status
                    }}
                  >
                    <SelectTrigger className={errors.main_status ? "border-red-500" : ""}>
                      <SelectValue placeholder="เลือกสถานะหลัก" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainStatusOptions.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.main_status && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.main_status}
                    </p>
                  )}
                </div>

                {/* แสดงสถานะย่อยเฉพาะเมื่อมีตัวเลือก */}
                {formData.main_status && subStatusOptions[formData.main_status as keyof typeof subStatusOptions]?.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="subStatus" className="text-sm font-semibold">
                      สถานะย่อย
                    </Label>
                    <Select 
                      value={formData.sub_status} 
                      onValueChange={(value) => handleInputChange("sub_status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสถานะย่อย" />
                      </SelectTrigger>
                      <SelectContent>
                        {subStatusOptions[formData.main_status as keyof typeof subStatusOptions]?.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


        {/* หมายเหตุ */}
        <Card className="border-gray-200 bg-gray-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <Wrench className="h-5 w-5" />
              หมายเหตุ
            </CardTitle>
            <CardDescription className="text-gray-600">เพิ่มหมายเหตุหรือข้อมูลเพิ่มเติม</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.note}
              onChange={(e) => handleInputChange("note", e.target.value)}
              placeholder="กรอกหมายเหตุหรือข้อมูลเพิ่มเติม..."
              rows={4}
              className="border-gray-200 focus:border-gray-400"
            />
          </CardContent>
        </Card>

        {/* เอกสารแนบ */}
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <Paperclip className="h-5 w-5" />
              เอกสารแนบ
            </CardTitle>
            <CardDescription className="text-indigo-600">
              แนบเอกสารที่เกี่ยวข้อง (สูงสุด 30 ไฟล์, ไฟล์ละไม่เกิน 50MB)
              <br />
              <span className="text-sm text-orange-700 font-medium">💡 เลือกไฟล์ที่ต้องการ แล้วกดปุ่ม "บันทึก" เพื่ออัปโหลดและบันทึกข้อมูล</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiFileUpload
              ref={fileUploadRef}
              value={attachments}
              onChange={setAttachments}
              maxFiles={30}
              maxSizePerFile={50}
              storageBucket="permit-documents"
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button 
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading || isUploading}
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            ยกเลิก
          </Button>
          <Button 
            type="submit"
            disabled={isLoading || isUploading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {(isLoading || isUploading) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isUploading ? "กำลังอัปโหลดไฟล์..." : (isEdit ? "บันทึกการแก้ไข" : "บันทึกคำขอใหม่")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RequestForm;

