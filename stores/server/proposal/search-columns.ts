export type ProposalTabStatus = "INFORM" | "APPROVED" | "TERMINATED";

export type ProposalAdvancedFilters = {
  proposalNo: string;
  ownerId: string;
  plateNo: string;
  proposalDateFrom: string;
  proposalDateTo: string;
  serviceTypeCsv: string;
  serviceDateFrom: string;
  serviceDateTo: string;
  createdByCsv: string;
};

export type ProposalListFilters = ProposalAdvancedFilters & {
  quickQuery: string;
};

type ProposalSearchValue = string | boolean | string[];

type ProposalSearch = {
  value: ProposalSearchValue;
  valueTo?: string;
  type: string;
  matchCase: boolean;
};

export type ProposalColumn = {
  data: string;
  search: ProposalSearch;
  searchable: boolean;
  orderable: boolean;
};

const column = (
  data: string,
  search: ProposalSearch,
  searchable = true,
): ProposalColumn => ({
  data,
  search,
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

const dmyToIsoDateTime = (value: string, endOfDay: boolean): string | null => {
  const isoDate = dmyToIsoDate(value);
  if (!isoDate) return null;
  return `${isoDate} ${endOfDay ? "23:59:59" : "00:00:00"}`;
};

const parseCsvValues = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeDate = (value: string): string => {
  const raw = value.trim();
  if (!raw) return "";
  return dmyToIsoDate(raw) ?? raw;
};

const normalizeDateTime = (value: string, endOfDay: boolean): string => {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.includes("-") && raw.includes(":")) return raw;
  return dmyToIsoDateTime(raw, endOfDay) ?? raw;
};

export function proposalFiltersKey(
  status: ProposalTabStatus,
  f: ProposalListFilters,
): string {
  return JSON.stringify({
    status,
    quickQuery: f.quickQuery.trim(),
    proposalNo: f.proposalNo.trim(),
    ownerId: f.ownerId.trim(),
    plateNo: f.plateNo.trim(),
    proposalDateFrom: f.proposalDateFrom.trim(),
    proposalDateTo: f.proposalDateTo.trim(),
    serviceTypeCsv: f.serviceTypeCsv.trim(),
    serviceDateFrom: f.serviceDateFrom.trim(),
    serviceDateTo: f.serviceDateTo.trim(),
    createdByCsv: f.createdByCsv.trim(),
  });
}

export function buildProposalSearchColumns(
  status: ProposalTabStatus,
  f: ProposalListFilters,
  allowOwnerId: boolean,
  allowCreatedBy: boolean,
): ProposalColumn[] {
  const columns: ProposalColumn[] = [];

  // Keep initial default request unfiltered (no columns).
  if (status !== "INFORM") {
    columns.push(
      column("status", { value: status, type: "eq", matchCase: true }),
    );
  }

  const proposalNo = f.proposalNo.trim();
  const quickQuery = f.quickQuery.trim();
  if (proposalNo) {
    columns.push(
      column("proposalNo", {
        value: proposalNo,
        type: "eq",
        matchCase: true,
      }),
    );
  } else if (quickQuery) {
    columns.push(
      column("proposalNo", {
        value: quickQuery,
        type: "contains",
        matchCase: false,
      }),
    );
  }

  const ownerId = f.ownerId.trim();
  if (allowOwnerId && ownerId) {
    columns.push(
      column("ownerId", { value: ownerId, type: "eq", matchCase: true }),
    );
  }

  const plateNo = f.plateNo.trim();
  if (plateNo) {
    columns.push(
      column("plateNo", { value: plateNo, type: "eq", matchCase: true }),
    );
  }

  const proposalDateFrom = normalizeDate(f.proposalDateFrom);
  const proposalDateTo = normalizeDate(f.proposalDateTo);
  if (proposalDateFrom || proposalDateTo) {
    columns.push(
      column("proposalDate", {
        value: proposalDateFrom || proposalDateTo,
        valueTo: proposalDateTo || proposalDateFrom,
        type: "between",
        matchCase: false,
      }),
    );
  }

  const serviceTypes = parseCsvValues(f.serviceTypeCsv);
  if (serviceTypes.length > 0) {
    columns.push(
      column("serviceType", {
        value: serviceTypes,
        type: "in",
        matchCase: true,
      }),
    );
  }

  const serviceDateFrom = normalizeDateTime(f.serviceDateFrom, false);
  const serviceDateTo = normalizeDateTime(f.serviceDateTo, true);
  if (serviceDateFrom || serviceDateTo) {
    columns.push(
      column("serviceDate", {
        value: serviceDateFrom || serviceDateTo,
        valueTo: serviceDateTo || serviceDateFrom,
        type: "between",
        matchCase: true,
      }),
    );
  }

  if (allowCreatedBy) {
    const createdBy = parseCsvValues(f.createdByCsv);
    if (createdBy.length > 0) {
      columns.push(
        column("createdBy", {
          value: createdBy,
          type: "in",
          matchCase: true,
        }),
      );
    }
  }

  return columns;
}
