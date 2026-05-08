import axios from "axios";

const BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

console.log("API URL:", BASE);

const API = axios.create({
  baseURL: BASE,
  timeout: 30000,
});

export const otpSend = (email, name) => API.post("/otp/send", { email, name });
export const otpVerify = (email, otp) => API.post("/otp/verify", { email, otp });

export const saveDraft = (formData) => API.post("/resume/draft", formData);
export const getDraft = (email) => API.get(`/resume/draft/${email}`);
export const getPaid = (email) => API.get(`/resume/paid/${email}`);

export const createOrder = (data) => API.post("/payment/create-order", data);
export const verifyPayment = (data) => API.post("/payment/verify", data);
export const getFee = () => API.get("/payment/fee");

export default API;