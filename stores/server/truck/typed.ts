export interface TruckListResponse {
  data: TruckData;
  httpStatus: number;
  message: string;
}

export interface TruckData {
  data: TruckItem[];
  page: number;
  pageSize: number;
  totalRecords: number;
  last: boolean;
  totalPages: number;
}

export interface TruckItem {
  id: string;
  version?: number;
  plateNo: string;
  model: string;
  make?: string;
  modelYear: string | number;
  feet: string | number;
  engineNo?: string;
  chassisNo?: string;
  fuelType?: string;
  frontTire?: string;
  backTire?: string;
}

export interface TruckDetailResponse {
  data: TruckItem;
  httpStatus: number;
  message: string;
}
