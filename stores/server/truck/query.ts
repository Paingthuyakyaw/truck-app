import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { axios } from "../api";
import type { Column } from "../user/query";
import type { TruckDetailResponse, TruckListResponse } from "./typed";

export interface TruckSearchPayload {
  page: number;
  pageSize: number;
  columns: Column[];
}

const searchTrucks = async (payload: TruckSearchPayload): Promise<TruckListResponse> => {
  const { data } = await axios.post("/truck/search", payload);
  return data;
};

const TRUCK_PAGE_SIZE = 10;

export function useTrucksInfinite(
  columns: Column[],
): UseInfiniteQueryResult<InfiniteData<TruckListResponse>, Error> {
  return useInfiniteQuery<
    TruckListResponse,
    Error,
    InfiniteData<TruckListResponse>,
    (string | number | Column[])[],
    number
  >({
    queryKey: ["trucks", "infinite", TRUCK_PAGE_SIZE, columns],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      searchTrucks({
        page: pageParam,
        pageSize: TRUCK_PAGE_SIZE,
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

export { TRUCK_PAGE_SIZE };

const fetchTruckById = async (id: string): Promise<TruckDetailResponse> => {
  const { data } = await axios.get(`/truck/find/${id}`);
  return data;
};

export function useTruckDetail(id: string) {
  return useQuery({
    queryKey: ["truck", "detail", id],
    queryFn: () => fetchTruckById(id),
    enabled: !!id,
  });
}
