import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axios } from "../api";

export interface CreateProposalPayload {
  truckId: string;
  proposalAmount: number;
  serviceType: string;
  serviceShop: string;
  serviceDate: string;
  description?: string;
}

const createProposal = async (payload: CreateProposalPayload) => {
  const body: Record<string, unknown> = {
    truckId: payload.truckId,
    proposalAmount: payload.proposalAmount,
    serviceType: payload.serviceType,
    serviceShop: payload.serviceShop,
    serviceDate: payload.serviceDate,
  };

  if (payload.description?.trim()) {
    body.description = payload.description.trim();
  }

  const { data } = await axios.post("/proposal/inform-truck-cost", body);
  return data;
};

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProposal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proposal"] });
    },
  });
}
