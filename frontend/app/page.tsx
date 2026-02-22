"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBrand } from "@/components/AppBrand";
import Image from "next/image";

export default function Home() {
  const [topic, setTopic] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      sessionStorage.setItem("quizTopic", topic);
    }
  };

  const handleTryIt = (mode: "text" | "audio") => {
    if (topic.trim()) {
      sessionStorage.setItem("quizTopic", topic);
      router.push(`/${mode}-quiz`);
    }
  };

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        background: "radial-gradient(circle at center, #FFFBF0 0%, #FAF0D0 40%, #F0E4B8 70%, #E0D0A0 100%)",
        minHeight: "100vh"
      }}
    >
      {/* Header with logo and title on same line */}
      <div className="relative flex items-center justify-between px-4 md:px-8 pt-0 pb-0">
        {/* Logo on left */}
        <div className="flex-shrink-0 -ml-14 md:-ml-18 -mt-2 md:-mt-4">
          <Image
            src="/logo_3.png"
            alt="Recall"
            width={360}
            height={360}
            className="inline-block"
          />
        </div>
        
        {/* Heading centered */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold" style={{ color: "var(--brown)", textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1), 4px 4px 8px rgba(0, 0, 0, 0.08)" }}>
            Recall
          </h1>
        </div>
        
        {/* Spacer to balance layout */}
        <div className="flex-shrink-0 w-[360px]"></div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 pt-0 pb-8">
        {/* Subtitle */}
        <div className="text-center mb-4">
          <p className="text-xl md:text-2xl lg:text-3xl" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif", fontWeight: 400 }}>
            Turn what you read into what you remember.
          </p>
        </div>

        {/* Main Form Card */}
        <div
          className="rounded-3xl shadow-xl p-6 md:p-8"
          style={{ backgroundColor: "#ffffff" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="topic"
                className="block mb-3 font-medium"
                style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}
              >
                What topic would you like to be quizzed on?
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your topic or question here... (from the pages you web-scraped using our tool!)"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: "var(--carolina-blue)",
                  backgroundColor: "#ffffff",
                  color: "var(--brown)",
                  fontFamily: "var(--font-lora), serif",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--peach)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 176, 136, 0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--carolina-blue)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleTryIt("text")}
                disabled={!topic.trim()}
                className="flex-1 py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 font-medium"
                style={{
                  backgroundColor: "var(--carolina-blue)",
                  color: "#ffffff",
                  fontFamily: "var(--font-lora), serif",
                }}
              >
                Try It - Text Mode
              </button>

              <button
                type="button"
                onClick={() => handleTryIt("audio")}
                disabled={!topic.trim()}
                className="flex-1 py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 font-medium"
                style={{
                  backgroundColor: "var(--peach)",
                  color: "#ffffff",
                }}
              >
                Try It - Audio Mode
              </button>
            </div>
          </form>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "var(--beige)" }}
            >
              <h3 style={{ color: "var(--carolina-blue)", fontFamily: "var(--font-lora), serif", fontSize: "16px" }} className="mb-2 font-semibold">
                📝 Text Mode
              </h3>
              <p className="text-sm" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
                Read questions and type your answers. Perfect for detailed responses.
              </p>
            </div>
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "var(--beige)" }}
            >
              <h3 style={{ color: "var(--peach)", fontFamily: "var(--font-lora), serif", fontSize: "16px" }} className="mb-2 font-semibold">
                🎤 Audio Mode
              </h3>
              <p className="text-sm" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
                Listen to questions and speak your answers. Great for on-the-go learning!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-sm" style={{ color: "var(--brown)", fontFamily: "var(--font-lora), serif" }}>
            Make learning fun and memorable!
          </p>
        </div>
      </div>
    </div>
  );
}
