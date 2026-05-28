import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axios } from "../api";

export interface CreateTruckPayload {
  plateNo: string;
  model: string;
  modelYear: number;
  feet:number;
  fuelType: string;
  frontTire: string;
  backTire: string;
  chassisNo?: string;
  engineNo?: string;
}

const createTruck = async (payload: CreateTruckPayload) => {
  const body: Record<string, unknown> = { ...payload };
  if (!String(payload.chassisNo ?? "").trim()) {
    delete body.chassisNo;
  }
  if (!String(payload.engineNo ?? "").trim()) {
    delete body.engineNo;
  }
  const { data } = await axios.post("/truck/create", body);
  return data;
};

export function useCreateTruck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTruck,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trucks"] });
    },
  });
}
