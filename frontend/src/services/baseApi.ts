import axios from "axios";
import { handleDates } from "../hooks/handleDates";

const baseApi = axios.create({
  baseURL: "http://localhost:4000",
  validateStatus: () => true,
});

baseApi.interceptors.response.use((originalResponse) => {
  handleDates(originalResponse.data);
  return originalResponse;
});

export default baseApi;
