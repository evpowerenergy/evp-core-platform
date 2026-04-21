export interface ThailandProvince {
  id: number;
  name: string;
  nameEn: string;
  region: string;
}

export const THAILAND_PROVINCES: ThailandProvince[] = [
  // ภาคเหนือ (Northern Region)
  { id: 1, name: "เชียงใหม่", nameEn: "Chiang Mai", region: "ภาคเหนือ" },
  { id: 2, name: "เชียงราย", nameEn: "Chiang Rai", region: "ภาคเหนือ" },
  { id: 3, name: "น่าน", nameEn: "Nan", region: "ภาคเหนือ" },
  { id: 4, name: "พะเยา", nameEn: "Phayao", region: "ภาคเหนือ" },
  { id: 5, name: "แพร่", nameEn: "Phrae", region: "ภาคเหนือ" },
  { id: 6, name: "แม่ฮ่องสอน", nameEn: "Mae Hong Son", region: "ภาคเหนือ" },
  { id: 7, name: "ลำปาง", nameEn: "Lampang", region: "ภาคเหนือ" },
  { id: 8, name: "ลำพูน", nameEn: "Lamphun", region: "ภาคเหนือ" },
  { id: 9, name: "อุตรดิตถ์", nameEn: "Uttaradit", region: "ภาคเหนือ" },
  { id: 10, name: "ตาก", nameEn: "Tak", region: "ภาคเหนือ" },
  { id: 11, name: "สุโขทัย", nameEn: "Sukhothai", region: "ภาคเหนือ" },
  { id: 12, name: "พิษณุโลก", nameEn: "Phitsanulok", region: "ภาคเหนือ" },
  { id: 13, name: "เพชรบูรณ์", nameEn: "Phetchabun", region: "ภาคเหนือ" },
  { id: 14, name: "พิจิตร", nameEn: "Phichit", region: "ภาคเหนือ" },
  { id: 15, name: "นครสวรรค์", nameEn: "Nakhon Sawan", region: "ภาคเหนือ" },
  { id: 16, name: "อุทัยธานี", nameEn: "Uthai Thani", region: "ภาคเหนือ" },
  { id: 17, name: "กำแพงเพชร", nameEn: "Kamphaeng Phet", region: "ภาคเหนือ" },

  // ภาคกลาง (Central Region)
  { id: 18, name: "กรุงเทพมหานคร", nameEn: "Bangkok", region: "ภาคกลาง" },
  { id: 19, name: "สมุทรปราการ", nameEn: "Samut Prakan", region: "ภาคกลาง" },
  { id: 20, name: "นนทบุรี", nameEn: "Nonthaburi", region: "ภาคกลาง" },
  { id: 21, name: "ปทุมธานี", nameEn: "Pathum Thani", region: "ภาคกลาง" },
  { id: 22, name: "พระนครศรีอยุธยา", nameEn: "Phra Nakhon Si Ayutthaya", region: "ภาคกลาง" },
  { id: 23, name: "อ่างทอง", nameEn: "Ang Thong", region: "ภาคกลาง" },
  { id: 24, name: "ลพบุรี", nameEn: "Lopburi", region: "ภาคกลาง" },
  { id: 25, name: "สิงห์บุรี", nameEn: "Sing Buri", region: "ภาคกลาง" },
  { id: 26, name: "ชัยนาท", nameEn: "Chai Nat", region: "ภาคกลาง" },
  { id: 27, name: "สระบุรี", nameEn: "Saraburi", region: "ภาคกลาง" },
  { id: 28, name: "นครนายก", nameEn: "Nakhon Nayok", region: "ภาคกลาง" },
  { id: 29, name: "สมุทรสาคร", nameEn: "Samut Sakhon", region: "ภาคกลาง" },
  { id: 30, name: "สมุทรสงคราม", nameEn: "Samut Songkhram", region: "ภาคกลาง" },
  { id: 31, name: "นครปฐม", nameEn: "Nakhon Pathom", region: "ภาคกลาง" },
  { id: 32, name: "สุพรรณบุรี", nameEn: "Suphan Buri", region: "ภาคกลาง" },
  { id: 33, name: "กาญจนบุรี", nameEn: "Kanchanaburi", region: "ภาคกลาง" },
  { id: 34, name: "ราชบุรี", nameEn: "Ratchaburi", region: "ภาคกลาง" },
  { id: 35, name: "เพชรบุรี", nameEn: "Phetchaburi", region: "ภาคกลาง" },
  { id: 36, name: "ประจวบคีรีขันธ์", nameEn: "Prachuap Khiri Khan", region: "ภาคกลาง" },

  // ภาคตะวันออกเฉียงเหนือ (Northeastern Region)
  { id: 37, name: "นครราชสีมา", nameEn: "Nakhon Ratchasima", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 38, name: "ชัยภูมิ", nameEn: "Chaiyaphum", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 39, name: "บุรีรัมย์", nameEn: "Buriram", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 40, name: "สุรินทร์", nameEn: "Surin", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 41, name: "ศรีสะเกษ", nameEn: "Sisaket", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 42, name: "อุบลราชธานี", nameEn: "Ubon Ratchathani", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 43, name: "ยโสธร", nameEn: "Yasothon", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 44, name: "อำนาจเจริญ", nameEn: "Amnat Charoen", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 45, name: "หนองบัวลำภู", nameEn: "Nong Bua Lamphu", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 46, name: "ขอนแก่น", nameEn: "Khon Kaen", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 47, name: "อุดรธานี", nameEn: "Udon Thani", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 48, name: "เลย", nameEn: "Loei", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 49, name: "หนองคาย", nameEn: "Nong Khai", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 50, name: "มหาสารคาม", nameEn: "Maha Sarakham", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 51, name: "ร้อยเอ็ด", nameEn: "Roi Et", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 52, name: "กาฬสินธุ์", nameEn: "Kalasin", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 53, name: "สกลนคร", nameEn: "Sakon Nakhon", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 54, name: "นครพนม", nameEn: "Nakhon Phanom", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 55, name: "มุกดาหาร", nameEn: "Mukdahan", region: "ภาคตะวันออกเฉียงเหนือ" },
  { id: 56, name: "บึงกาฬ", nameEn: "Bueng Kan", region: "ภาคตะวันออกเฉียงเหนือ" },

  // ภาคตะวันออก (Eastern Region)
  { id: 57, name: "ชลบุรี", nameEn: "Chonburi", region: "ภาคตะวันออก" },
  { id: 58, name: "ระยอง", nameEn: "Rayong", region: "ภาคตะวันออก" },
  { id: 59, name: "จันทบุรี", nameEn: "Chanthaburi", region: "ภาคตะวันออก" },
  { id: 60, name: "ตราด", nameEn: "Trat", region: "ภาคตะวันออก" },
  { id: 61, name: "ฉะเชิงเทรา", nameEn: "Chachoengsao", region: "ภาคตะวันออก" },
  { id: 62, name: "ปราจีนบุรี", nameEn: "Prachinburi", region: "ภาคตะวันออก" },
  { id: 63, name: "นครนายก", nameEn: "Nakhon Nayok", region: "ภาคตะวันออก" },
  { id: 64, name: "สระแก้ว", nameEn: "Sa Kaeo", region: "ภาคตะวันออก" },

  // ภาคใต้ (Southern Region)
  { id: 65, name: "นครศรีธรรมราช", nameEn: "Nakhon Si Thammarat", region: "ภาคใต้" },
  { id: 66, name: "กระบี่", nameEn: "Krabi", region: "ภาคใต้" },
  { id: 67, name: "พังงา", nameEn: "Phang Nga", region: "ภาคใต้" },
  { id: 68, name: "ภูเก็ต", nameEn: "Phuket", region: "ภาคใต้" },
  { id: 69, name: "สุราษฎร์ธานี", nameEn: "Surat Thani", region: "ภาคใต้" },
  { id: 70, name: "ระนอง", nameEn: "Ranong", region: "ภาคใต้" },
  { id: 71, name: "ชุมพร", nameEn: "Chumphon", region: "ภาคใต้" },
  { id: 72, name: "สงขลา", nameEn: "Songkhla", region: "ภาคใต้" },
  { id: 73, name: "สตูล", nameEn: "Satun", region: "ภาคใต้" },
  { id: 74, name: "ตรัง", nameEn: "Trang", region: "ภาคใต้" },
  { id: 75, name: "พัทลุง", nameEn: "Phatthalung", region: "ภาคใต้" },
  { id: 76, name: "ปัตตานี", nameEn: "Pattani", region: "ภาคใต้" },
  { id: 77, name: "ยะลา", nameEn: "Yala", region: "ภาคใต้" },
  { id: 78, name: "นราธิวาส", nameEn: "Narathiwat", region: "ภาคใต้" }
];

// ฟังก์ชันสำหรับค้นหาจังหวัด
export const searchProvinces = (query: string): ThailandProvince[] => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return THAILAND_PROVINCES;
  
  return THAILAND_PROVINCES.filter(province => 
    province.name.toLowerCase().includes(searchTerm) ||
    province.nameEn.toLowerCase().includes(searchTerm) ||
    province.region.toLowerCase().includes(searchTerm)
  );
};

// ฟังก์ชันสำหรับหาจังหวัดตาม ID
export const getProvinceById = (id: number): ThailandProvince | undefined => {
  return THAILAND_PROVINCES.find(province => province.id === id);
};

// ฟังก์ชันสำหรับหาจังหวัดตามชื่อ
export const getProvinceByName = (name: string): ThailandProvince | undefined => {
  return THAILAND_PROVINCES.find(province => 
    province.name === name || province.nameEn === name
  );
};
