import { useEffect, useState } from "react";
import api from "../api/axios";

export default function useLeaderboard(params) {
  const [data, setData] = useState({
    leaderboard: [],
    top3: [],
    currentUser: null,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/leaderboard", { params });
        setData(res.data);
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      }
    };

    fetch();
  }, [params]);

  return data;
}