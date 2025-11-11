import axios from "axios";

export const BASE_URL = axios.create({
  baseURL: "https://eclipsera-backend.onrender.com/api/createroom",
});
