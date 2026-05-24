import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { axios } from "../api";
import type { Column } from "../user/query";
import type { ServiceTypeListResponse } from "./typed";

export interface ServiceTypeSearchPayload {
  page: number;
  pageSize: number;
  columns: Column[];
}

const searchServiceTypes = async (
  payload: ServiceTypeSearchPayload,
): Promise<ServiceTypeListResponse> => {
  const { data } = await axios.post("/service-type/search", payload);
  return data;
};

const SERVICE_TYPE_PAGE_SIZE = 10;

export function useServiceTypesInfinite(
  columns: Column[] = [],
): UseInfiniteQueryResult<InfiniteData<ServiceTypeListResponse>, Error> {
  return useInfiniteQuery<
    ServiceTypeListResponse,
    Error,
    InfiniteData<ServiceTypeListResponse>,
    (string | number | Column[])[],
    number
  >({
    queryKey: ["service-types", "infinite", SERVICE_TYPE_PAGE_SIZE, columns],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      searchServiceTypes({
        page: pageParam,
        pageSize: SERVICE_TYPE_PAGE_SIZE,
        columns,
      }),
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const meta = lastPage.data;
      if (!meta) return undefined;
      const { totalPages, page } = meta;
      if (typeof totalPages === "number" && totalPages > 0) {
        if (page >= totalPages - 1) return undefined;
      } else if (meta.last) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    refetchOnWindowFocus: false,
  });
}
