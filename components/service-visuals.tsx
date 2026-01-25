"use client";

// 1. Website Visual: A Mock Browser Window
export function WebsiteVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[500px]">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Browser Toolbar */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-400"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
          <div className="h-3 w-3 rounded-full bg-green-400"></div>
          <div className="ml-4 h-6 flex-1 rounded-md bg-white border border-gray-200"></div>
        </div>
        {/* Browser Content */}
        <div className="relative h-[300px] w-full bg-gray-50 p-4">
          {/* Skeleton Layout Animation */}
          <div className="space-y-4 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            </div>
            {/* Hero */}
            <div className="h-32 w-full bg-gray-200 rounded-lg"></div>
            {/* Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          </div>

          {/* Floating UI Card Overlay */}
          <div className="absolute bottom-8 right-8 w-40 rounded-lg bg-white p-3 shadow-xl border border-gray-100 animate-[float_4s_ease-in-out_infinite]">
            <div className="h-2 w-12 bg-yellow-primary rounded mb-2"></div>
            <div className="h-12 w-full bg-gray-100 rounded mb-2"></div>
            <div className="h-2 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. App Visual: A Mobile Phone Mockup
export function AppVisual() {
  return (
    <div className="relative mx-auto flex justify-center">
      <div className="relative h-[450px] w-[260px] rounded-[3rem] border-[8px] border-gray-900 bg-gray-800 shadow-2xl">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 h-6 w-24 -translate-x-1/2 rounded-b-xl bg-gray-900"></div>

        {/* Screen */}
        <div className="h-full w-full overflow-hidden rounded-[2.5rem] bg-white pt-8 relative">
          {/* App UI Elements */}
          <div className="p-4 space-y-4">
            <div className="flex gap-3 overflow-hidden">
              <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-yellow-primary/20"></div>
              <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-blue-100"></div>
              <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-purple-100"></div>
            </div>

            <div className="h-32 rounded-2xl bg-gray-100 p-3">
              <div className="h-2 w-1/3 bg-gray-300 rounded mb-2"></div>
              <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
            </div>

            {/* Notification Pop-up Animation */}
            <div className="absolute top-20 left-4 right-4 rounded-xl bg-white/90 backdrop-blur shadow-lg p-3 border border-gray-100 animate-[fade-up_3s_ease-in-out_infinite]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <div className="h-2 w-20 bg-gray-300 rounded mb-1"></div>
                  <div className="h-2 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="absolute bottom-4 left-0 right-0 px-6 flex justify-between text-gray-300">
            <div className="h-8 w-8 rounded-full bg-gray-100"></div>
            <div className="h-8 w-8 rounded-full bg-gray-100"></div>
            <div className="h-8 w-8 rounded-full bg-gray-100"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. API Visual: A Terminal/Code Block
export function ApiVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[500px]">
      <div className="overflow-hidden rounded-xl bg-gray-900 shadow-2xl font-mono text-sm">
        {/* Terminal Bar */}
        <div className="flex items-center gap-1.5 border-b border-gray-800 bg-gray-900 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <div className="ml-2 text-xs text-gray-500">server.ts</div>
        </div>
        {/* Code Content */}
        <div className="p-6 text-gray-300">
          <div className="flex">
            <span className="text-purple-400 mr-2">const</span>
            <span className="text-blue-400">response</span>
            <span className="text-white mx-2">=</span>
            <span className="text-purple-400">await</span>
            <span className="text-yellow-300 ml-2">fetch</span>
            <span className="text-gray-400">('.../api')</span>
          </div>
          <div className="mt-2 text-gray-500">// Processing data...</div>
          <div className="mt-2">
            <span className="text-purple-400">if</span>
            <span className="text-white mx-2">(</span>
            <span className="text-blue-400">data.success</span>
            <span className="text-white">)</span>
            <span className="text-white mx-2">{`{`}</span>
          </div>
          <div className="ml-4 mt-1 text-green-400 animate-pulse">
            return "Integration Successful";
          </div>
          <div className="mt-1 text-white">{`}`}</div>

          <div className="mt-4 pt-4 border-t border-gray-800 flex items-center">
            <span className="text-green-500 mr-2">➜</span>
            <span className="animate-[code-1_2s_infinite]">_</span>
          </div>
        </div>
      </div>
      {/* Connecting Badge */}
      <div className="absolute -right-4 top-10 rounded-full bg-yellow-primary px-4 py-1 text-xs font-bold text-black shadow-lg">
        JSON READY
      </div>
    </div>
  );
}

// 4. Analytics Visual: Charts
export function AnalyticsVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[500px]">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="text-sm text-gray-500">Total Visitors</div>
            <div className="text-3xl font-bold text-gray-900">12,453</div>
          </div>
          <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
            +24%
          </div>
        </div>

        {/* Bar Chart Mockup */}
        <div className="flex h-40 items-end justify-between gap-2">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className="w-full rounded-t-sm bg-gray-900 opacity-80 hover:opacity-100 hover:bg-yellow-primary transition-all duration-500"
            ></div>
          ))}
        </div>

        {/* Floating Pie Chart */}
        <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center">
          <svg viewBox="0 0 32 32" className="h-full w-full rotate-[-90deg]">
            <circle cx="16" cy="16" r="16" fill="#f3f4f6" />
            <circle
              cx="16"
              cy="16"
              r="16"
              fill="transparent"
              stroke="#ffeb3b"
              strokeWidth="32"
              strokeDasharray="70 100"
            />
          </svg>
          <span className="absolute text-xs font-bold">85%</span>
        </div>
      </div>
    </div>
  );
}
