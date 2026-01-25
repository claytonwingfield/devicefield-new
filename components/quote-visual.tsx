"use client";

export default function QuoteVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[500px] pr-12">
      {/* Removed overflow-hidden so the tooltip can stick out */}
      <div className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-400"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
            <div className="h-3 w-3 rounded-full bg-green-400"></div>
          </div>
          <div className="h-2 w-20 rounded-full bg-gray-100"></div>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
          {/* Item 1: Completed */}
          <div className="flex items-center gap-4 rounded-lg bg-green-50 p-3 border border-green-100 animate-[fade-up_1s_ease-out]">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
              <svg
                className="h-4 w-4"
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
            <div className="h-2 w-32 rounded bg-green-200"></div>
          </div>

          {/* Item 2: Active */}
          <div className="flex items-center gap-4 rounded-lg bg-yellow-50 p-3 border border-yellow-100 shadow-sm animate-[fade-up_1.5s_ease-out]">
            <div className="h-6 w-6 rounded-full border-2 border-yellow-primary flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-yellow-primary animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-48 rounded bg-yellow-200"></div>
              <div className="h-2 w-24 rounded bg-yellow-100"></div>
            </div>
          </div>

          {/* Item 3: Pending */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-3 border border-gray-100 opacity-60 animate-[fade-up_2s_ease-out]">
            <div className="h-6 w-6 rounded-full border-2 border-gray-300"></div>
            <div className="h-2 w-40 rounded bg-gray-200"></div>
          </div>

          {/* Footer - Replaced black box with Timeline Estimate */}
          <div className="mt-6 flex justify-between items-center border-t border-gray-100 pt-4">
            <div className="h-2 w-16 bg-gray-100 rounded"></div>

            {/* New Bottom Right Content */}
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                Est. Delivery
              </div>
              <div className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                3 - 5 Weeks
              </div>
            </div>
          </div>
        </div>

        {/* Floating Tooltip - Positioned outside right edge */}
        <div className="absolute top-1/2 -right-3 sm:-right-8 translate-x-full -translate-y-1/2 z-10">
          <div className="relative rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-xl animate-[float_4s_ease-in-out_infinite] whitespace-nowrap">
            Estimate Ready
            {/* Little triangle pointer pointing left towards the card */}
            <div className="absolute top-1/2 -left-1 -mt-1 h-2 w-2 -rotate-45 bg-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
