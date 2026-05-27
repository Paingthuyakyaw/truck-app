export interface OwnershipListResponse {
  data: OwnershipData;
  httpStatus: number;
  message: string;
}

export interface OwnershipData {
  data: OwnershipItem[];
  page: number;
  pageSize: number;
  totalRecords: number;
  last: boolean;
  totalPages: number;
}

export interface OwnershipItem {
  id: string;
  equipmentName?: string;
  truckPlateNo?: string;
  estimatedSellAmt?: string;
  buyDate?: string;
  licenseEndDate?: string;
  licenseCity?: string;
  purchasePlace?: string;
  notes?: string;
  totalOwnershipDays?: number;
  totalLicenseValidityDays?: number;
  profit?: number;
  totalCost?: number;
  totalIncome?: number;
  sellDate?: string | null;
  soldPlace?: string | null;
  version?: number;
}
