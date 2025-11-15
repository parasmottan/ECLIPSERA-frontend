import axios from "axios";

export const BASE_URL = axios.create({
  baseURL: "https://eclipsera.zeabur.app/api/createroom",
});
