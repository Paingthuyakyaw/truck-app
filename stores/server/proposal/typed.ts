export interface ProposalListResponse {
  data: ProposalPageData;
  httpStatus: number;
  message: string;
}

export interface ProposalPageData {
  data: ProposalItem[];
  page: number;
  pageSize: number;
  totalRecords: number;
  last: boolean;
  totalPages: number;
}

export interface ProposalItem {
  ownershipId: string;
  proposalNo: string;
  plateNo: string;
  proposalAmount: number;
  proposalDate: string;
  status: string;
  serviceType: string;
  serviceDate: string;
  createdBy: string;
  serviceShop: string;
}
