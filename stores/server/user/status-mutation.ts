import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axios } from "../api";

type UserStatusPayload = {
  id: string;
  status: boolean;
};

const updateUserActiveStatus = async ({ id, status }: UserStatusPayload) => {
  const { data } = await axios.patch(`/user/${id}/active`, undefined, {
    params: { status },
  });
  return data;
};

const updateUserLockStatus = async ({ id, status }: UserStatusPayload) => {
  const { data } = await axios.patch(`/user/${id}/notLocked`, undefined, {
    params: { status },
  });
  return data;
};

export function useUpdateUserActiveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUserActiveStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserLockStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUserLockStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
