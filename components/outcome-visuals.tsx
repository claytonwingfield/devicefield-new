"use client";

import React from "react";

// Helper for consistent container styling
const VisualContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-full w-full flex items-center justify-center bg-gray-50 overflow-hidden">
    {/* Subtle background pattern */}
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
    {children}
  </div>
);

// --- 1. INSTANT ANALYTICS VISUALS ---
const AnalyticsVisuals = [
  // 1. Unified Data Ecosystem (Central Hub)
  <div key="a1" className="relative w-48 h-48">
    <div className="absolute inset-0 bg-yellow-primary/10 rounded-full animate-pulse"></div>
    <div className="absolute inset-8 border border-gray-200 rounded-full flex items-center justify-center bg-white shadow-lg">
      <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
    </div>
    <div className="absolute top-2 right-4 w-8 h-8 bg-white rounded-lg shadow-md border border-gray-100 flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    </div>
    <div className="absolute bottom-4 left-4 w-10 h-10 bg-white rounded-lg shadow-md border border-gray-100 flex items-center justify-center animate-[float_4s_ease-in-out_infinite_1s]">
      <div className="w-6 h-1 bg-gray-200 rounded-full"></div>
    </div>
  </div>,

  // 2. Real-time Trends (Upward Graph)
  <div
    key="a2"
    className="relative w-56 h-40 bg-white rounded-xl shadow-xl border border-gray-100 p-4 flex items-end justify-between gap-2 transform rotate-2 hover:rotate-0 transition-all duration-500"
  >
    {[30, 50, 40, 70, 60, 90].map((h, i) => (
      <div
        key={i}
        style={{ height: `${h}%` }}
        className={`w-full rounded-t-md ${i === 5 ? "bg-yellow-primary" : "bg-gray-100"}`}
      ></div>
    ))}
    <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
      +12%
    </div>
  </div>,

  // 3. User Behavior (Pie/Donut)
  <div key="a3" className="relative">
    <div className="w-40 h-40 rounded-full border-[16px] border-gray-100 border-t-yellow-primary border-r-gray-900 transform rotate-45 shadow-xl bg-white"></div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-2xl font-bold text-gray-900">360°</div>
    </div>
  </div>,
];

// --- 2. METADATA VISUALS ---
const MetadataVisuals = [
  // 1. The Hidden Tag (Code Block)
  <div
    key="m1"
    className="bg-gray-900 rounded-xl p-6 shadow-2xl transform -rotate-3 hover:rotate-0 transition-all duration-500"
  >
    <div className="flex gap-2 mb-4">
      <div className="w-3 h-3 rounded-full bg-red-500"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
      <div className="w-3 h-3 rounded-full bg-green-500"></div>
    </div>
    <div className="space-y-2">
      <div className="h-2 w-32 bg-gray-700 rounded opacity-50"></div>
      <div className="h-2 w-24 bg-yellow-primary rounded"></div>
      <div className="h-2 w-40 bg-gray-700 rounded opacity-50"></div>
    </div>
  </div>,

  // 2. Social Preview Card
  <div
    key="m2"
    className="bg-white border border-gray-200 rounded-xl w-56 shadow-xl overflow-hidden animate-[float_5s_ease-in-out_infinite]"
  >
    <div className="h-28 bg-gray-100 flex items-center justify-center">
      <div className="w-12 h-12 bg-yellow-primary/20 rounded-full flex items-center justify-center text-yellow-600 font-bold">
        OG
      </div>
    </div>
    <div className="p-4 space-y-2">
      <div className="h-3 w-3/4 bg-gray-800 rounded"></div>
      <div className="h-2 w-full bg-gray-200 rounded"></div>
    </div>
  </div>,

  // 3. Search Result (Snippets)
  <div key="m3" className="flex flex-col gap-3 w-64">
    <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
      <div className="h-2 w-16 bg-blue-500 rounded mb-2"></div>
      <div className="h-3 w-48 bg-gray-800 rounded mb-1"></div>
      <div className="h-2 w-full bg-gray-300 rounded"></div>
    </div>
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 opacity-60 scale-95">
      <div className="h-2 w-16 bg-blue-300 rounded mb-2"></div>
      <div className="h-3 w-32 bg-gray-300 rounded"></div>
    </div>
  </div>,
];

// --- 3. SEO & PERFORMANCE VISUALS ---
const SEOVisuals = [
  // 1. Speedometer
  <div key="s1" className="relative w-48 h-24 overflow-hidden bg-transparent">
    <div className="w-48 h-48 rounded-full border-[20px] border-gray-100 border-t-yellow-primary border-r-yellow-primary rotate-[-45deg] shadow-inner"></div>
    <div className="absolute bottom-0 left-1/2 w-1 h-20 bg-gray-900 origin-bottom transform -rotate-12 rounded-full shadow-lg"></div>
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 rounded-full"></div>
  </div>,

  // 2. Ranking Ladder
  <div key="s2" className="flex items-end gap-3 h-40">
    <div className="w-12 h-20 bg-gray-200 rounded-t-lg"></div>
    <div className="w-12 h-32 bg-gray-300 rounded-t-lg relative">
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shadow-sm font-bold text-gray-400">
        2
      </div>
    </div>
    <div className="w-12 h-40 bg-yellow-primary rounded-t-lg shadow-lg relative">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg font-bold text-gray-900 border-2 border-yellow-primary">
        1
      </div>
    </div>
  </div>,

  // 3. Link Building (Chain)
  <div key="s3" className="relative flex items-center justify-center">
    <div className="w-16 h-8 rounded-full border-4 border-gray-800 transform -rotate-12 translate-x-3 bg-white z-10"></div>
    <div className="w-16 h-8 rounded-full border-4 border-yellow-primary transform -rotate-12 -translate-x-3 bg-white z-0"></div>
    <div className="absolute bg-gray-50 w-2 h-10 transform -rotate-12 z-20"></div>{" "}
    {/* Gap Mask */}
  </div>,
];

// --- 4. WEBSITE DEV VISUALS ---
const WebDevVisuals = [
  // 1. Responsive Devices
  <div key="w1" className="relative flex items-end">
    <div className="w-40 h-28 bg-white border-2 border-gray-200 rounded-lg shadow-xl relative z-0"></div>
    <div className="w-12 h-20 bg-gray-900 border-2 border-gray-900 rounded-md shadow-2xl absolute -right-4 -bottom-2 z-10 border-r-2">
      <div className="w-full h-full bg-white rounded-[4px]"></div>
    </div>
  </div>,

  // 2. Layout Blocks (Wireframe)
  <div
    key="w2"
    className="w-48 h-48 bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-3 grid grid-cols-2 gap-2 transform rotate-6"
  >
    <div className="col-span-2 h-8 bg-gray-900 rounded-md"></div>
    <div className="h-24 bg-yellow-primary/20 rounded-md border border-yellow-primary/30"></div>
    <div className="h-24 bg-gray-100 rounded-md"></div>
    <div className="col-span-2 h-4 bg-gray-100 rounded-md"></div>
  </div>,

  // 3. CMS / Content
  <div
    key="w3"
    className="relative w-40 h-48 bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-3"
  >
    <div className="flex gap-2">
      <div className="w-8 h-8 bg-gray-100 rounded"></div>
      <div className="space-y-1 flex-1">
        <div className="h-2 w-full bg-gray-100 rounded"></div>
        <div className="h-2 w-2/3 bg-gray-100 rounded"></div>
      </div>
    </div>
    <div className="h-20 bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
      +
    </div>
    <div className="absolute -right-4 top-10 bg-yellow-primary px-3 py-1 rounded-full shadow-lg text-xs font-bold">
      Edit
    </div>
  </div>,
];

// --- 5. API DEV VISUALS ---
const ApiDevVisuals = [
  // 1. Connection Nodes
  <div
    key="api1"
    className="relative w-full h-full flex items-center justify-center"
  >
    <div className="absolute w-40 h-[2px] bg-gray-200"></div>
    <div className="w-12 h-12 bg-white border-2 border-gray-900 rounded-full flex items-center justify-center z-10 shadow-lg relative -left-12">
      <div className="w-4 h-4 bg-gray-900 rounded-full"></div>
    </div>
    <div className="w-12 h-12 bg-white border-2 border-yellow-primary rounded-full flex items-center justify-center z-10 shadow-lg relative left-12">
      <div className="w-4 h-4 bg-yellow-primary rounded-full"></div>
    </div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2 text-xs text-gray-400 font-mono">
      JSON
    </div>
  </div>,

  // 2. Data Brackets
  <div
    key="api2"
    className="flex text-8xl font-black text-gray-200 font-mono tracking-tighter"
  >
    <span className="transform -translate-y-4 text-gray-300">{`{`}</span>
    <div className="flex flex-col gap-2 justify-center text-sm px-2">
      <div className="w-12 h-2 bg-yellow-primary rounded"></div>
      <div className="w-16 h-2 bg-gray-800 rounded"></div>
      <div className="w-10 h-2 bg-gray-300 rounded"></div>
    </div>
    <span className="transform translate-y-4 text-gray-300">{`}`}</span>
  </div>,

  // 3. Security / Lock
  <div key="api3" className="relative">
    <div className="w-32 h-32 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-100">
      <div className="w-16 h-16 border-4 border-green-500 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>
    <div className="absolute -top-3 -right-3 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded">
      AUTH
    </div>
  </div>,
];

// --- 6. APP DEV VISUALS ---
const AppDevVisuals = [
  // 1. Mobile Interface
  <div
    key="app1"
    className="w-32 h-56 bg-gray-800 rounded-[2rem] p-2 shadow-2xl transform -rotate-6"
  >
    <div className="w-full h-full bg-white rounded-[1.5rem] overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-b-lg"></div>
      <div className="p-3 mt-4 space-y-2">
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
          <div className="flex-1 h-8 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-20 bg-yellow-primary/20 rounded-lg w-full"></div>
      </div>
    </div>
  </div>,

  // 2. Touch Interaction
  <div
    key="app2"
    className="relative w-40 h-40 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-gray-100"
  >
    <div className="w-12 h-12 bg-blue-500 rounded-xl shadow-lg z-10"></div>
    <div className="absolute w-12 h-12 bg-blue-500 rounded-xl animate-ping opacity-20"></div>
    <div className="absolute bottom-2 right-8 transform translate-y-full">
      <div className="w-8 h-8 bg-gray-900/10 rounded-full blur-sm"></div>
    </div>
  </div>,

  // 3. App Grid
  <div
    key="app3"
    className="grid grid-cols-2 gap-3 p-4 bg-white rounded-2xl shadow-xl rotate-12"
  >
    <div className="w-10 h-10 bg-gray-900 rounded-xl"></div>
    <div className="w-10 h-10 bg-yellow-primary rounded-xl"></div>
    <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
    <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
  </div>,
];

// --- MAIN EXPORT FUNCTION ---
export function getBenefitVisual(serviceTitle: string, index: number) {
  const normalizedTitle = serviceTitle.toLowerCase();

  // Cycle through 3 visuals (0, 1, 2) based on the index
  const visualIndex = index % 3;

  let content = null;

  if (normalizedTitle.includes("analytics")) {
    content = AnalyticsVisuals[visualIndex];
  } else if (normalizedTitle.includes("metadata")) {
    content = MetadataVisuals[visualIndex];
  } else if (
    normalizedTitle.includes("seo") ||
    normalizedTitle.includes("performance")
  ) {
    content = SEOVisuals[visualIndex];
  } else if (normalizedTitle.includes("website")) {
    content = WebDevVisuals[visualIndex];
  } else if (normalizedTitle.includes("api")) {
    content = ApiDevVisuals[visualIndex];
  } else if (normalizedTitle.includes("app")) {
    content = AppDevVisuals[visualIndex];
  } else {
    // Fallback if title doesn't match
    content = WebDevVisuals[visualIndex];
  }

  return <VisualContainer>{content}</VisualContainer>;
}
