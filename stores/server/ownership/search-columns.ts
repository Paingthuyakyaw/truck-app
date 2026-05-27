export type OwnershipTruckStatus = "ACTIVE" | "SOLD_OUT";

export type OwnershipAdvancedFilters = {
  plateNo: string;
  licenseCity: string;
  licenseEndDate: string;
  profit: string;
  ownerIdCsv: string;
};

export type OwnershipListFilters = OwnershipAdvancedFilters & {
  quickQuery: string;
};

type OwnershipSearchValue = string | number | (string | null)[];

type OwnershipSearch = {
  value: OwnershipSearchValue;
  type: string;
  matchCase: boolean;
};

export type OwnershipColumn = {
  data: string;
  search: OwnershipSearch;
  searchable: boolean;
  orderable: boolean;
};

const column = (
  data: string,
  value: OwnershipSearchValue,
  type: string,
  matchCase: boolean,
  searchable = true,
): OwnershipColumn => ({
  data,
  search: {
    value,
    type,
    matchCase,
  },
  searchable,
  orderable: false,
});

const dmyToIsoDate = (value: string): string | null => {
  const raw = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd)
  ) {
    return null;
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const normalizeDate = (value: string): string => {
  const raw = value.trim();
  if (!raw) return "";
  return dmyToIsoDate(raw) ?? raw;
};

const parseOwnerIds = (value: string): (string | null)[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.toLowerCase() === "null" ? null : item));

export function ownershipFiltersKey(
  status: OwnershipTruckStatus,
  f: OwnershipListFilters,
  allowOwnerId: boolean,
): string {
  return JSON.stringify({
    status,
    quickQuery: f.quickQuery.trim(),
    plateNo: f.plateNo.trim(),
    licenseCity: f.licenseCity.trim(),
    licenseEndDate: f.licenseEndDate.trim(),
    profit: f.profit.trim(),
    ownerIdCsv: allowOwnerId ? f.ownerIdCsv.trim() : "",
  });
}

export function buildOwnershipSearchColumns(
  status: OwnershipTruckStatus,
  f: OwnershipListFilters,
  allowOwnerId: boolean,
): OwnershipColumn[] {
  const columns: OwnershipColumn[] = [
    column("truckStatus", status, "eq", true, true),
  ];

  const plateNo = f.plateNo.trim();
  const quickQuery = f.quickQuery.trim();
  if (plateNo) {
    columns.push(column("plateNo", plateNo, "eq", false));
  } else if (quickQuery) {
    columns.push(column("plateNo", quickQuery, "eq", false));
  }

  const licenseCity = f.licenseCity.trim();
  if (licenseCity) {
    columns.push(column("licenseCity", licenseCity, "contains", false));
  }

  const licenseEndDate = normalizeDate(f.licenseEndDate);
  if (licenseEndDate) {
    columns.push(column("licenseEndDate", licenseEndDate, "lte", false));
  }

  const profit = Number(f.profit.trim());
  if (Number.isFinite(profit) && f.profit.trim()) {
    columns.push(column("profit", profit, "lte", false));
  }

  const ownerIds = allowOwnerId ? parseOwnerIds(f.ownerIdCsv) : [];
  if (ownerIds.length > 0) {
    columns.push(column("owner.id", ownerIds, "in", false));
  }

  return columns;
}
