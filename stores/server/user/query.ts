import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { axios } from "../api";
import {
  buildUserSearchColumns,
  type TeamListFilters,
  teamListFiltersKey,
} from "./search-columns";
import type { UserTeamResponse } from "./typed";

export interface SearchPayload {
  page: number;
  pageSize: number;
  columns: Column[];
}

export interface Column {
  data: string;
  search: Search;
  searchable: boolean;
  orderable: boolean;
}

export interface Search {
  value: string | boolean;
  type: string;
  matchCase: boolean;
}

const users = async (payload: SearchPayload): Promise<UserTeamResponse> => {
  const { data } = await axios.post("/user/search", payload);
  return data;
};

const TEAM_PAGE_SIZE = 10;

export function useUsersInfinite(
  filters: TeamListFilters,
): UseInfiniteQueryResult<InfiniteData<UserTeamResponse>, Error> {
  const filterKey = teamListFiltersKey(filters);
  return useInfiniteQuery<
    UserTeamResponse,
    Error,
    InfiniteData<UserTeamResponse>,
    (string | number)[],
    number
  >({
    queryKey: ["users", "infinite", TEAM_PAGE_SIZE, filterKey],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      users({
        page: pageParam,
        pageSize: TEAM_PAGE_SIZE,
        columns: buildUserSearchColumns(filters),
      }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage.data;
      if (!meta) return undefined;
      const { totalPages, page } = meta;
      if (typeof totalPages === "number" && totalPages > 0) {
        if (page >= totalPages - 1) return undefined;
      } else if (meta.last) {
        return undefined;
      }
      return page + 1;
    },
    /** Treat server as source of truth: no “fresh for 60s” window; remount refetches. */
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
  });
}

export { TEAM_PAGE_SIZE };

