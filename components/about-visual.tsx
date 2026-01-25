"use client";

export default function AboutVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[500px]">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl">
        {/* Abstract "Global Network" Visualization */}
        <div className="relative h-[300px] w-full flex items-center justify-center">
          {/* Central Hub */}
          <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-gray-900 shadow-xl animate-[breath_4s_ease-in-out_infinite]">
            <span className="text-3xl font-bold text-white">DF</span>

            {/* Orbiting Particles */}
            <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
              <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-yellow-primary"></div>
            </div>
          </div>

          {/* Connected Nodes */}
          {[0, 72, 144, 216, 288].map((deg, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 h-[120px] w-[2px] origin-top bg-gradient-to-b from-gray-200 to-transparent"
              style={{ transform: `rotate(${deg}deg)` }}
            >
              <div
                className="absolute bottom-0 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm animate-[pulse_3s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 0.5}s` }}
              >
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
              </div>
            </div>
          ))}

          {/* Background Pulse */}
          <div className="absolute inset-0 z-0 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-yellow-primary/30 opacity-20 scale-50"></div>
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between rounded-xl bg-gray-50 p-4 border border-gray-100">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Founded
            </div>
            <div className="font-bold text-gray-900">2020</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Projects
            </div>
            <div className="font-bold text-gray-900">500+</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Global
            </div>
            <div className="font-bold text-gray-900">24/7</div>
          </div>
        </div>
      </div>
    </div>
  );
}
