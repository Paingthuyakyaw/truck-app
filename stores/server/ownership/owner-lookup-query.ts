import { useQuery } from "@tanstack/react-query";
import { axios } from "../api";

type OwnerLookupResponse = {
  data?: {
    data?: Array<Record<string, unknown>>;
  };
};

export type OwnerLookupOption = {
  value: string;
  label: string;
};


const lookupOwners = async (query: string): Promise<OwnerLookupResponse> => {
  const { data } = await axios.get("/user/get-all-owners");
  return data;
};

const toString = (value: unknown): string => String(value ?? "").trim();

const normalizeOwnerOptions = (
  response: OwnerLookupResponse,
): OwnerLookupOption[] => {

  const items = Array.isArray(response?.data) ? response.data : [];

  if (items.length === 0) return [];

  const uniqueOptionsMap = items.reduce((map, item) => {
    const value = toString(item?.id);
    const label = toString(item?.fullName);

    if (!value || map.has(value)) return map;

    return map.set(value, { value, label });
  }, new Map<string, OwnerLookupOption>());

  return Array.from(uniqueOptionsMap.values());

};

export function useOwnerLookupOptions(query: string) {
  return useQuery({
    queryKey: ["owner-lookup", query.trim()],
    queryFn: () => lookupOwners(query),
    select: normalizeOwnerOptions,
    staleTime: 0,
  });
}
