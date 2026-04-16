import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axios } from "../api";
import type { CreateUserRole } from "./create-mutation";

export interface UpdateUserPayload {
  id: string;
  version: number;
  fullName: string;
  email: string;
  role: CreateUserRole;
  joinDate: string;
  phoneNumber: string;
  dateOfBirth: string;
  fullIdNo?: string;
  parentOwnerId?: string;
}

const updateUser = async ({ id, ...payload }: UpdateUserPayload) => {
  const body: Record<string, unknown> = { ...payload };

  if (!String(payload.fullIdNo ?? "").trim()) {
    delete body.fullIdNo;
  }
  if (payload.role !== "VIEWER") {
    delete body.parentOwnerId;
  }

  const { data } = await axios.put(`/user/update/${id}`, body);
  return data;
};

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
