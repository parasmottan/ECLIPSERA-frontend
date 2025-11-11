"use client";
import React, { use, useEffect, useState } from "react";
import { Cinzel, Inter } from "next/font/google";
import Link from "next/link";
import axios from "axios";
import { BASE_URL } from "@/utils/api";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "700"],
});

function Page() {
  const [roomCode, setRoomCode] = useState(null);
    const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [copied, setCopied] = useState(false);

  const createRoomCode = async () => {
    setLoading(true);
    try {
      const res = await BASE_URL.post("/createroom");
      setRoomCode(res.data.roomId);
      console.log("Room code created:", res.data.roomId);
    } catch (error) {
      console.error("Error creating room code:", error);
    }
    finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    createRoomCode();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }

  

  return (
    <div className="w-full h-screen bg-[#0D0D0E] text-white flex flex-col">
      <div className="w-full h-20 absolute flex justify-between items-center top-0 px-9">
        <h1 className={`text-md text-center cursor-pointer ${cinzel.variable} font-serif`}>
          ECLIPSERA
        </h1>
      </div>

      <div className="w-full h-screen flex justify-center items-center">
        <div className="w-[50%] h-[80%] flex flex-col mt-25 gap-5 items-center">
          <h1 className={`text-4xl text-center font-semibold ${inter.variable}`}>
            Welcome to Your Cinema
          </h1>
          <h2 className="text-sm text-white/45 text-center">
            Share your room code and enter your name to begin
          </h2>

          <div className="w-[55%] h-[15vh] rounded-2xl border flex flex-col justify-center items-start border-white/10 bg-[#161616]">
            <h1 className="text-[0.8vw] text-white/45 uppercase px-6 pb-2">
              Your Room Code
            </h1>
            <div className="w-full flex items-center justify-between px-6">
              <h1 className="text-2xl text-[#E4E4E4] font-semibold text-center">
                {roomCode}
              </h1>
              <div
                className="relative w-10 h-10 cursor-pointer bg-[#1B1B1B] rounded-xl flex justify-center items-center active:bg-gray-800"
                onClick={handleCopy}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E5E5E5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
                </svg>
                {copied && (
                  <span className="absolute top-[-30px] text-[10px] text-green-400">
                    Copied!
                  </span>
                )}
              </div>
            </div>
          </div>

          <form className="w-[55%] h-[25vh] flex flex-col gap-3 ">
            <h1 className="font-semibold text-[0.9vw]">Your Name</h1>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full h-15 px-3 rounded-xl border-none outline-none bg-[#1C1B1C]"
            />
            <Link href={`/room/${roomCode}`}>
              <button
                type="submit"
                className="w-full mt-3 h-15 px-3 flex justify-center items-center cursor-pointer gap-4 rounded-xl bg-[#E50B16]"
              >
                ENTER CINEMA
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-arrow-right text-lg"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </button>
            </Link>
          </form>

          <Link href="/">
            <button className="mt-3 text-sm text-white/45 text-start cursor-pointer mr-[24vw]">
              Back
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Page;
