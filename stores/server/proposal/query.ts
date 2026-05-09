import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { axios } from "../api";
import {
  buildProposalSearchColumns,
  proposalFiltersKey,
  type ProposalColumn,
  type ProposalListFilters,
  type ProposalTabStatus,
} from "./search-columns";
import type { ProposalListResponse } from "./typed";

const PROPOSAL_PAGE_SIZE = 10;

type ProposalSearchPayload = {
  page: number;
  pageSize: number;
  columns: ProposalColumn[];
};

const searchProposals = async (
  payload: ProposalSearchPayload,
): Promise<ProposalListResponse> => {
  const { data } = await axios.post("/proposal/search", payload);
  return data;
};

const initialProposalFilters: ProposalListFilters = {
  quickQuery: "",
  proposalNo: "",
  ownerId: "",
  plateNo: "",
  proposalDateFrom: "",
  proposalDateTo: "",
  serviceTypeCsv: "",
  serviceDateFrom: "",
  serviceDateTo: "",
  createdByCsv: "",
};

export function useProposalsInfinite(
  status: ProposalTabStatus,
  filters: ProposalListFilters = initialProposalFilters,
  role: string | null,
  enabled = true,
): UseInfiniteQueryResult<InfiniteData<ProposalListResponse>, Error> {
  const upperRole = (role || "").toUpperCase();
  const allowOwnerId = upperRole === "ADMIN";
  const allowCreatedBy = upperRole === "ADMIN" || upperRole === "OWNER";
  const columns = buildProposalSearchColumns(
    status,
    filters,
    allowOwnerId,
    allowCreatedBy,
  );
  const filterKey = proposalFiltersKey(status, filters);

  return useInfiniteQuery<
    ProposalListResponse,
    Error,
    InfiniteData<ProposalListResponse>,
    (string | number)[],
    number
  >({
    queryKey: ["proposal", "infinite", status, PROPOSAL_PAGE_SIZE, filterKey],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      searchProposals({
        page: pageParam,
        pageSize: PROPOSAL_PAGE_SIZE,
        columns,
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
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
  });
}
