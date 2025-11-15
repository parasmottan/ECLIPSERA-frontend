"use client";
import React, { useEffect, useState } from "react";
import { Cinzel, Inter } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@/utils/api";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });

function Page() {
  const [roomCode, setRoomCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const createRoomCode = async () => {
    setLoading(true);
    try {
      const res = await BASE_URL.post("/createroom");
      setRoomCode(res.data.roomId);
    } catch {
      alert("Room creation failed");
    }
    setLoading(false);
  };

  useEffect(() => {
    createRoomCode();
  }, []);

  const handleEnterCinema = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return alert("Enter your name");
    if (!roomCode) return;

    // 1️⃣ JOIN ROOM
    const join = await fetch(
      `https://eclipsera.zeabur.app/api/joinroom/${roomCode}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName }),
      }
    );

    const data = await join.json();

    if (!join.ok) {
      alert(data.message);
      return;
    }

    // 2️⃣ store verified room
    localStorage.setItem("verifiedRoom", roomCode);

    // 3️⃣ redirect to join page
    router.push(`/join/${roomCode}`);
  };

  return (
    <div className="w-full min-h-screen bg-[#0D0D0E] text-white flex flex-col items-center justify-center">
      <h1>VELOURA</h1>

      <div className="mt-10 p-5 bg-[#161616] rounded-2xl">
        <p>Your Room Code:</p>
        <h1>{loading ? "Loading..." : roomCode}</h1>

        <form onSubmit={handleEnterCinema} className="mt-5 flex flex-col gap-4">
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="p-3 rounded-xl bg-[#1C1B1C]"
          />
          <button className="px-5 py-3 bg-red-600 rounded-xl text-white">
            ENTER CINEMA
          </button>
        </form>
      </div>
    </div>
  );
}

export default Page;
