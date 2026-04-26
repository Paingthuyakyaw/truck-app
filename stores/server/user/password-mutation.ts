import { useMutation } from "@tanstack/react-query";

import { axios } from "../api";

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

const changePassword = async (payload: ChangePasswordPayload) => {
  const { data } = await axios.patch("/user/password", payload);
  return data;
};

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}
