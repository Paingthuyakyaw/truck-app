import { useQuery } from "@tanstack/react-query";
import { axios } from "../api";

type OwnerLookupColumn = {
  data: string;
  search: {
    value: string;
    type: string;
    matchCase: boolean;
  };
  searchable: boolean;
  orderable: boolean;
};

type OwnerLookupResponse = {
  data?: {
    data?: Array<Record<string, unknown>>;
  };
};

export type OwnerLookupOption = {
  value: string;
  label: string;
};

const OWNER_LOOKUP_PAGE_SIZE = 10;

const buildColumn = (
  data: string,
  value: string,
  type: string,
  matchCase: boolean,
  searchable = false,
): OwnerLookupColumn => ({
  data,
  search: { value, type, matchCase },
  searchable,
  orderable: false,
});

const buildOwnerLookupColumns = (query: string): OwnerLookupColumn[] => {
  const columns: OwnerLookupColumn[] = [
    buildColumn("truckStatus", "ACTIVE", "eq", true, true),
  ];
  const q = query.trim();
  if (q) {
    columns.push(buildColumn("plateNo", q, "contains", false));
  }
  return columns;
};

const lookupOwners = async (query: string): Promise<OwnerLookupResponse> => {
  const { data } = await axios.post("/ownership/search", {
    page: 1,
    pageSize: OWNER_LOOKUP_PAGE_SIZE,
    columns: buildOwnerLookupColumns(query),
  });
  return data;
};

const toString = (value: unknown): string => String(value ?? "").trim();

const normalizeOwnerOptions = (
  response: OwnerLookupResponse,
): OwnerLookupOption[] => {
  const items = response.data?.data ?? [];
  const unique = new Map<string, OwnerLookupOption>();

  for (const item of items) {
    const owner = (item.owner ?? null) as Record<string, unknown> | null;
    const optionValue =
      toString(owner?.id) ||
      toString(item.ownerId) ||
      toString(item.userId) ||
      toString(item.id);
    if (!optionValue || unique.has(optionValue)) continue;

    const ownerName = toString(owner?.fullName);
    const plateNo = toString(item.truckPlateNo) || toString(item.plateNo);
    const equipmentName = toString(item.equipmentName);
    const label = [ownerName, plateNo, equipmentName].filter(Boolean).join(" - ") || optionValue;

    unique.set(optionValue, { value: optionValue, label });
  }

  return Array.from(unique.values());
};

export function useOwnerLookupOptions(query: string) {
  return useQuery({
    queryKey: ["owner-lookup", query.trim()],
    queryFn: () => lookupOwners(query),
    select: normalizeOwnerOptions,
    staleTime: 0,
  });
}
