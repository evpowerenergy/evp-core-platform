import { supabase } from "@/integrations/supabase/client";
import { THAILAND_PROVINCES } from "@/utils/thailandProvinces";
import type {
  AlarmSummary,
  DataHealth,
  DeviceDetailResponse,
  FleetSummary,
  HuaweiIntegrationView,
  PlantDetailResponse,
  PlantListResponse,
} from "./types";

const db = supabase as unknown as {
  rpc: (
    name: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => {
    select: (columns: string) => {
      limit: (count: number) => {
        single: () => Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
};

async function rpc<T>(name: string, params: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(name, params);
  if (error) throw error;
  return data as T;
}

const thaiProvinceAliases: Array<[string, string[]]> = [
  ["กรุงเทพมหานคร", ["กรุงเทพมหานคร", "กรุงเทพฯ", "กรุงเทพ", "กทม.", "กทม", "bangkok", "krung thep"]],
  ["กระบี่", ["กระบี่", "krabi"]], ["กาญจนบุรี", ["กาญจนบุรี", "kanchanaburi"]],
  ["กาฬสินธุ์", ["กาฬสินธุ์", "kalasin"]], ["กำแพงเพชร", ["กำแพงเพชร", "kamphaeng phet"]],
  ["ขอนแก่น", ["ขอนแก่น", "khon kaen"]], ["จันทบุรี", ["จันทบุรี", "chanthaburi"]],
  ["ฉะเชิงเทรา", ["ฉะเชิงเทรา", "chachoengsao"]], ["ชลบุรี", ["ชลบุรี", "chon buri", "chonburi"]],
  ["ชัยนาท", ["ชัยนาท", "chai nat"]], ["ชัยภูมิ", ["ชัยภูมิ", "chaiyaphum"]],
  ["ชุมพร", ["ชุมพร", "chumphon"]], ["เชียงราย", ["เชียงราย", "chiang rai"]],
  ["เชียงใหม่", ["เชียงใหม่", "chiang mai"]], ["ตรัง", ["ตรัง", "trang"]],
  ["ตราด", ["ตราด", "trat"]], ["ตาก", ["ตาก", "tak"]],
  ["นครนายก", ["นครนายก", "nakhon nayok"]], ["นครปฐม", ["นครปฐม", "nakhon pathom"]],
  ["นครพนม", ["นครพนม", "nakhon phanom"]], ["นครราชสีมา", ["นครราชสีมา", "โคราช", "nakhon ratchasima", "korat"]],
  ["นครศรีธรรมราช", ["นครศรีธรรมราช", "nakhon si thammarat"]], ["นครสวรรค์", ["นครสวรรค์", "nakhon sawan"]],
  ["นนทบุรี", ["นนทบุรี", "nonthaburi"]], ["นราธิวาส", ["นราธิวาส", "narathiwat"]],
  ["น่าน", ["น่าน", "nan"]], ["บึงกาฬ", ["บึงกาฬ", "bueng kan"]],
  ["บุรีรัมย์", ["บุรีรัมย์", "buriram"]], ["ปทุมธานี", ["ปทุมธานี", "pathum thani"]],
  ["ประจวบคีรีขันธ์", ["ประจวบคีรีขันธ์", "prachuap khiri khan"]], ["ปราจีนบุรี", ["ปราจีนบุรี", "prachin buri", "prachinburi"]],
  ["ปัตตานี", ["ปัตตานี", "pattani"]], ["พระนครศรีอยุธยา", ["พระนครศรีอยุธยา", "อยุธยา", "phra nakhon si ayutthaya", "ayutthaya"]],
  ["พะเยา", ["พะเยา", "phayao"]], ["พังงา", ["พังงา", "phang nga"]],
  ["พัทลุง", ["พัทลุง", "phatthalung"]], ["พิจิตร", ["พิจิตร", "phichit"]],
  ["พิษณุโลก", ["พิษณุโลก", "phitsanulok"]], ["เพชรบุรี", ["เพชรบุรี", "phetchaburi"]],
  ["เพชรบูรณ์", ["เพชรบูรณ์", "phetchabun"]], ["แพร่", ["แพร่", "phrae"]],
  ["ภูเก็ต", ["ภูเก็ต", "phuket"]], ["มหาสารคาม", ["มหาสารคาม", "maha sarakham"]],
  ["มุกดาหาร", ["มุกดาหาร", "mukdahan"]], ["แม่ฮ่องสอน", ["แม่ฮ่องสอน", "mae hong son"]],
  ["ยโสธร", ["ยโสธร", "yasothon"]], ["ยะลา", ["ยะลา", "yala"]],
  ["ร้อยเอ็ด", ["ร้อยเอ็ด", "roi et"]], ["ระนอง", ["ระนอง", "ranong"]],
  ["ระยอง", ["ระยอง", "rayong"]], ["ราชบุรี", ["ราชบุรี", "ratchaburi"]],
  ["ลพบุรี", ["ลพบุรี", "lopburi", "lop buri"]], ["ลำปาง", ["ลำปาง", "lampang"]],
  ["ลำพูน", ["ลำพูน", "lamphun"]], ["เลย", ["เลย", "loei"]],
  ["ศรีสะเกษ", ["ศรีสะเกษ", "sisaket", "si sa ket"]], ["สกลนคร", ["สกลนคร", "sakon nakhon"]],
  ["สงขลา", ["สงขลา", "songkhla"]], ["สตูล", ["สตูล", "satun"]],
  ["สมุทรปราการ", ["สมุทรปราการ", "samut prakan"]], ["สมุทรสงคราม", ["สมุทรสงคราม", "samut songkhram"]],
  ["สมุทรสาคร", ["สมุทรสาคร", "samut sakhon"]], ["สระแก้ว", ["สระแก้ว", "sa kaeo"]],
  ["สระบุรี", ["สระบุรี", "saraburi"]], ["สิงห์บุรี", ["สิงห์บุรี", "sing buri"]],
  ["สุโขทัย", ["สุโขทัย", "sukhothai"]], ["สุพรรณบุรี", ["สุพรรณบุรี", "suphan buri"]],
  ["สุราษฎร์ธานี", ["สุราษฎร์ธานี", "surat thani"]], ["สุรินทร์", ["สุรินทร์", "surin"]],
  ["หนองคาย", ["หนองคาย", "nong khai"]], ["หนองบัวลำภู", ["หนองบัวลำภู", "nong bua lamphu"]],
  ["อ่างทอง", ["อ่างทอง", "ang thong"]], ["อำนาจเจริญ", ["อำนาจเจริญ", "amnat charoen"]],
  ["อุดรธานี", ["อุดรธานี", "udon thani"]], ["อุตรดิตถ์", ["อุตรดิตถ์", "uttaradit"]],
  ["อุทัยธานี", ["อุทัยธานี", "uthai thani"]], ["อุบลราชธานี", ["อุบลราชธานี", "ubon ratchathani"]],
];

function provinceFromAddress(address?: string | null) {
  const normalized = address?.toLocaleLowerCase("th-TH") ?? "";
  return thaiProvinceAliases.find(([, aliases]) => aliases.some((alias) => normalized.includes(alias)))?.[0] ?? null;
}

const geoNameOverrides: Record<string, string> = {
  กรุงเทพมหานคร: "Bangkok Metropolis",
  บุรีรัมย์: "Buri Ram",
  ชลบุรี: "Chon Buri",
  ลพบุรี: "Lop Buri",
  หนองบัวลำภู: "Nong Bua Lam Phu",
  พังงา: "Phangnga",
  ปราจีนบุรี: "Prachin Buri",
  ศรีสะเกษ: "Si Sa Ket",
};

function provinceGeoName(province: string) {
  return geoNameOverrides[province]
    ?? THAILAND_PROVINCES.find((item) => item.name === province)?.nameEn
    ?? province;
}

export const solarApi = {
  integration: async () => {
    const { data, error } = await db.from("huawei_integrations").select("*").limit(1).single();
    if (error) throw error;
    return data as HuaweiIntegrationView;
  },
  fleetSummary: (filters: Record<string, unknown> = {}) =>
    rpc<FleetSummary>("solar_get_fleet_summary", { p_filters: filters }),

  plants: (
    filters: Record<string, unknown>,
    sort = "name_asc",
    page = 1,
    pageSize = 25,
  ) => rpc<PlantListResponse>("solar_get_plant_list", {
    p_filters: filters,
    p_sort: sort,
    p_page: page,
    p_page_size: pageSize,
  }),

  provinceRanking: async () => {
    const first = await solarApi.plants({}, "name_asc", 1, 100);
    const pageCount = Math.ceil(first.total / 100);
    const remaining = await Promise.all(
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
        solarApi.plants({}, "name_asc", index + 2, 100)),
    );
    const plants = [first, ...remaining].flatMap((page) => page.items);
    const counts = new Map<string, number>();
    let unmatched = 0;
    for (const plant of plants) {
      const province = provinceFromAddress(plant.plant_address);
      if (province) counts.set(province, (counts.get(province) ?? 0) + 1);
      else unmatched += 1;
    }
    return {
      items: [...counts.entries()]
        .map(([province, count]) => ({ province, geoName: provinceGeoName(province), count }))
        .sort((a, b) => b.count - a.count || a.province.localeCompare(b.province, "th")),
      matched: plants.length - unmatched,
      unmatched,
      total: plants.length,
    };
  },

  plantDetail: (plantId: string, from: string, to: string) =>
    rpc<PlantDetailResponse>("solar_get_plant_detail", {
      p_plant_id: plantId,
      p_from: from,
      p_to: to,
    }),

  deviceDetail: (deviceId: string, from: string, to: string) =>
    rpc<DeviceDetailResponse>("solar_get_device_detail", {
      p_device_id: deviceId,
      p_from: from,
      p_to: to,
    }),

  alarms: (filters: Record<string, unknown> = {}) =>
    rpc<AlarmSummary>("solar_get_alarm_summary", { p_filters: filters }),

  dataHealth: (from: string) =>
    rpc<DataHealth>("solar_get_data_health", { p_from: from }),

  mappingCandidates: (plantId: string) =>
    rpc<Array<Record<string, unknown>>>("solar_get_customer_mapping_candidates", {
      p_plant_id: plantId,
    }),

  confirmMapping: (plantId: string, customerServiceId: number) =>
    rpc<boolean>("solar_confirm_customer_mapping", {
      p_plant_id: plantId,
      p_customer_service_id: customerServiceId,
    }),

  setTariff: (input: {
    plantId: string;
    name: string;
    importRate: number;
    exportRate: number | null;
    validFrom: string;
    validTo?: string | null;
  }) => rpc<string>("solar_set_tariff", {
    p_plant_id: input.plantId,
    p_name: input.name,
    p_import_rate: input.importRate,
    p_export_rate: input.exportRate,
    p_valid_from: input.validFrom,
    p_valid_to: input.validTo ?? null,
  }),

  admin: async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("solar-huawei-admin", {
      body: payload,
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error ?? "Solar admin action failed");
    return data;
  },
};
