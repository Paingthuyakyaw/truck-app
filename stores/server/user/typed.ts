export interface UserTeamResponse {
  data: UserTeamData;
  httpStatus: number;
  message: string;
}

export interface UserDetailResponse {
  data: UserDetail;
  httpStatus: number;
  message: string;
}

export interface UserTeamData {
  data: UserTeamItem[];
  page: number;
  pageSize: number;
  totalRecords: number;
  last: boolean;
  totalPages: number;
}

export interface UserTeamItem {
  id: string;
  username: string;
  fullName: string;
  phoneNumber?: string;
  email: string;
  role: string;
  active: boolean;
  notLocked: boolean;
}

export interface UserDetail {
  id: string;
  version: number;
  username: string;
  fullName: string;
  email: string;
  fullIdNo?: string | null;
  phoneNumber?: string;
  dateOfBirth?: string;
  joinDate?: string;
  role: string;
  active: boolean;
  notLocked: boolean;
  parentOwnerId?: string | null;
}

