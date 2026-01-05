"use client";

import Instructions from "../../tada/components/Instructions";

export default function DashboardHome() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-extrabold text-black mb-6 text-center">
        Panel de control
      </h1>
      <div className="w-full">
        <Instructions />
      </div>
    </div>
  );
}
