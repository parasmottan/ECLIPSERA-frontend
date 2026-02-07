import axios from "axios";

export const BASE_URL = axios.create({
  baseURL: "https://veloura.zeabur.app/api",
});
