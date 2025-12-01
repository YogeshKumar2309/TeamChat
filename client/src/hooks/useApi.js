import { useState } from "react";
import apiClient from "../config/apiClient";

export const useApi = () => {
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false); 

  const request = async (method, url, data = null) => {
    setLoading(true); // request start
    try {
      const response = await apiClient({ method, url, data });

      setErrorMsg(null);
      setSuccessMsg(response.data.message || "Success ");
      return { success: true, data: response.data };
    } catch (err) {
      setSuccessMsg(null);
      setErrorMsg(err.response?.data?.message || "Failed ");
      return { success: false, data: null };
    } finally {
      setLoading(false); // request end
    }
  };

  return {
    successMsg,
    errorMsg,
    loading, 
    get: (url) => request("GET", url),
    post: (url, data) => request("POST", url, data),
    put: (url, data) => request("PUT", url, data),
    del: (url) => request("DELETE", url),
  };
};
