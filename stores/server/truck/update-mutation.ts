import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axios } from "../api";

export interface UpdateTruckPayload {
  id: string;
  version: number;
  model: string;
  modelYear: number;
  feet: number;
  fuelType: string;
  frontTire: string;
  backTire: string;
  chassisNo?: string;
  engineNo?: string;
}

const updateTruck = async (payload: UpdateTruckPayload) => {
  const { id, ...rest } = payload;
  const body: Record<string, unknown> = { ...rest };
  if (!String(payload.chassisNo ?? "").trim()) {
    delete body.chassisNo;
  }
  if (!String(payload.engineNo ?? "").trim()) {
    delete body.engineNo;
  }
  const { data } = await axios.put(`/truck/update/${id}`, body);
  return data;
};

export function useUpdateTruck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTruck,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["trucks"] });
      qc.invalidateQueries({ queryKey: ["truck", "detail", variables.id] });
    },
  });
}
