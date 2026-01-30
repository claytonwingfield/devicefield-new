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

export function MetadataVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[500px] py-6">
      {/* Background Layer: The Code (The Input) */}
      <div className="ml-8 overflow-hidden rounded-xl bg-gray-900 p-5 shadow-xl opacity-90 transition-all duration-500 hover:ml-12 hover:rotate-3 hover:scale-105 hover:z-20 hover:opacity-100">
        <div className="flex space-x-2 mb-4">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        <div className="space-y-2 font-mono text-xs sm:text-sm">
          <div className="flex">
            <span className="text-purple-400">&lt;meta</span>
            <span className="text-blue-400 ml-2">property</span>
            <span className="text-white">=</span>
            <span className="text-green-400">"og:title"</span>
          </div>
          <div className="flex pl-4">
            <span className="text-blue-400">content</span>
            <span className="text-white">=</span>
            <span className="text-green-400">"Metadata Services"</span>
            <span className="text-purple-400">/&gt;</span>
          </div>
          <div className="flex">
            <span className="text-purple-400">&lt;meta</span>
            <span className="text-blue-400 ml-2">property</span>
            <span className="text-white">=</span>
            <span className="text-green-400">"og:image"</span>
            <span className="text-purple-400">/&gt;</span>
          </div>
        </div>
      </div>

      {/* Foreground Layer: The Preview (The Output) */}
      <div className="absolute top-10 left-0 w-[280px] sm:w-[320px] rounded-xl border border-gray-100 bg-white p-4 shadow-2xl animate-[float_5s_ease-in-out_infinite]">
        {/* Social Card Preview */}
        <div className="mb-3 h-32 w-full rounded-lg bg-gray-50 border border-gray-100 relative overflow-hidden group flex items-center justify-center">
          {/* Abstract Image Placeholder */}
          <div className="relative h-12 w-12 rounded-full bg-yellow-primary/20 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-yellow-primary shadow-sm"></div>
          </div>
          {/* Corner badge */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black text-white opacity-20">
            IMG
          </div>
        </div>

        {/* Mock Text Lines */}
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-900"></div>
          <div className="h-2 w-full rounded bg-gray-200"></div>
          <div className="h-2 w-1/2 rounded bg-gray-200"></div>
        </div>

        {/* Tag Indicator */}
        <div className="absolute -right-3 -top-3 flex items-center gap-1 rounded-full bg-yellow-primary px-3 py-1 text-xs font-bold shadow-lg text-black">
          <span>PREVIEW</span>
        </div>
      </div>
    </div>
  );
}
// Add this to @/components/service-visuals.tsx

export function IntegrationsVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[500px] h-[350px] flex items-center justify-center">
      {/* Central Hub (DeviceField) */}
      <div className="relative z-20 h-24 w-24 rounded-2xl bg-gray-900 shadow-2xl flex items-center justify-center border border-gray-800">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-primary to-yellow-600 flex items-center justify-center shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-black"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        {/* Pulsing Effect */}
        <div className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-gray-900 opacity-20 duration-1000"></div>
      </div>

      {/* Orbiting Satellite Nodes */}
      {/* Node 1: Top Right */}
      <div className="absolute top-10 right-10 animate-[float_4s_ease-in-out_infinite]">
        <div className="h-14 w-14 rounded-xl bg-white border border-gray-100 shadow-xl flex items-center justify-center">
          <div className="h-8 w-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
            API
          </div>
        </div>
      </div>
      {/* Connecting Line 1 */}
      <svg className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <line
          x1="50%"
          y1="50%"
          x2="75%"
          y2="20%"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeDasharray="4 4"
          className="animate-pulse"
        />
      </svg>

      {/* Node 2: Bottom Right */}
      <div className="absolute bottom-12 right-16 animate-[float_5s_ease-in-out_infinite_1s]">
        <div className="h-14 w-14 rounded-xl bg-white border border-gray-100 shadow-xl flex items-center justify-center">
          <div className="h-8 w-8 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
            DB
          </div>
        </div>
      </div>
      <svg className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <line
          x1="50%"
          y1="50%"
          x2="70%"
          y2="80%"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Node 3: Bottom Left */}
      <div className="absolute bottom-8 left-12 animate-[float_6s_ease-in-out_infinite_0.5s]">
        <div className="h-14 w-14 rounded-xl bg-white border border-gray-100 shadow-xl flex items-center justify-center">
          <div className="h-8 w-8 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
            SaaS
          </div>
        </div>
      </div>
      <svg className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <line
          x1="50%"
          y1="50%"
          x2="25%"
          y2="80%"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Node 4: Top Left */}
      <div className="absolute top-16 left-8 animate-[float_4.5s_ease-in-out_infinite_1.5s]">
        <div className="h-14 w-14 rounded-xl bg-white border border-gray-100 shadow-xl flex items-center justify-center">
          <div className="h-8 w-8 rounded bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
            Pay
          </div>
        </div>
      </div>
      <svg className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <line
          x1="50%"
          y1="50%"
          x2="20%"
          y2="30%"
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Floating Badge */}
      <div className="absolute -bottom-4 bg-white px-4 py-1 rounded-full shadow-lg border border-gray-100 text-xs font-bold text-green-600 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        Systems Online
      </div>
    </div>
  );
}

export function SeoVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[500px]">
      <div className="rounded-xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
        {/* Header / Toolbar */}
        <div className="flex items-center justify-between border-b border-gray-50 bg-gray-50/50 px-5 py-3">
          <div className="flex gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
            <div className="h-2.5 w-2.5 rounded-full bg-green-400"></div>
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Site Health Report
          </div>
        </div>

        <div className="p-8">
          {/* Score Circles Row */}
          <div className="flex justify-between gap-4 mb-10">
            <ScoreCircle score={98} label="Performance" color="green" />
            <ScoreCircle score={100} label="SEO" color="green" />
            <ScoreCircle score={92} label="Practices" color="yellow" />
          </div>

          {/* Checklist Items (Audit List) */}
          <div className="space-y-4">
            <AuditItem width="w-3/4" delay="0" />
            <AuditItem width="w-2/3" delay="100" />
            <AuditItem width="w-5/6" delay="200" />
          </div>
        </div>
      </div>

      {/* Floating Rank Card - Styled like a Search Result */}
    </div>
  );
}

// --- Helper Components for Cleaner Code ---

function ScoreCircle({
  score,
  label,
  color,
}: {
  score: number;
  label: string;
  color: "green" | "yellow";
}) {
  const strokeColor = color === "green" ? "#22c55e" : "#eab308"; // Tailwind green-500 or yellow-500
  const circleRadius = 28;
  const circumference = 2 * Math.PI * circleRadius; // ~175
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-20 w-20 flex items-center justify-center">
        {/* Background Track Ring */}
        <svg className="absolute top-0 left-0 h-full w-full rotate-[-90deg]">
          <circle
            cx="40"
            cy="40"
            r={circleRadius}
            fill="transparent"
            stroke="#f3f4f6" /* gray-100 */
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
        {/* Progress Ring */}
        <svg className="absolute top-0 left-0 h-full w-full rotate-[-90deg]">
          <circle
            cx="40"
            cy="40"
            r={circleRadius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span
          className={`text-2xl font-bold ${color === "green" ? "text-green-600" : "text-yellow-600"}`}
        >
          {score}
        </span>
      </div>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function AuditItem({ width, delay }: { width: string; delay: string }) {
  return (
    <div
      className="flex items-center gap-4 p-3 rounded-lg bg-gray-50/50 border border-gray-100/50 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
        <svg
          className="w-3.5 h-3.5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div className={`h-2.5 bg-gray-200 rounded-full ${width}`}></div>
    </div>
  );
}
