import React from 'react';

const Step = ({ number, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
      {number}
    </span>
    <span className="text-gray-700 leading-relaxed">{children}</span>
  </li>
);

export const Instructions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center py-12 px-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-10 py-8 text-white">
          <p className="text-indigo-200 text-sm font-medium uppercase tracking-widest mb-1">Study 1 · ~3 minutes</p>
          <h1 className="text-3xl font-bold tracking-tight">Tunnel Steering Task</h1>
          <p className="text-indigo-100 mt-2 text-base">Read all instructions before you begin.</p>
        </div>

        <div className="px-10 py-8 space-y-8">

          {/* Steps */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Instructions</h2>
            <ol className="space-y-3.5">
              <Step number="1">Click the <strong>green START button</strong> to begin each trial.</Step>
              <Step number="2">Navigate your cursor through the tunnel to reach the <strong>red target</strong>.</Step>
              <Step number="3"><strong>Keep moving</strong> continuously — do not stop after clicking Start.</Step>
              <Step number="4">Press <kbd className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm font-mono">R</kbd> to restart a trial if you stop or get interrupted.</Step>
              <Step number="5">Move as smoothly and accurately as you can.</Step>
            </ol>
          </section>

          <hr className="border-gray-100" />

          {/* Examples */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Trajectory Examples</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-green-200 bg-green-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-green-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-sm font-semibold text-green-800">Good — aim for this</span>
                </div>
                <div className="p-4">
                  <img
                    src="/steering-experiment/screenshots/good_trajectory_example.png"
                    alt="Good trajectory"
                    className="w-full rounded-lg object-contain max-h-44"
                  />
                  <p className="text-xs text-green-700 mt-3 text-center">Smooth, continuous movement through the tunnel</p>
                </div>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-red-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-sm font-semibold text-red-800">Bad — avoid this</span>
                </div>
                <div className="p-4">
                  <img
                    src="/steering-experiment/screenshots/bad_trajectory_example.png"
                    alt="Bad trajectory"
                    className="w-full rounded-lg object-contain max-h-44"
                  />
                  <p className="text-xs text-red-700 mt-3 text-center">Stopping, loops, or jerky movements</p>
                </div>
              </div>
            </div>
          </section>

          {/* Excursion hint */}
          <section className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <img
              src="/steering-experiment/screenshots/excursion_hint.png"
              alt="Excursion marker"
              className="w-14 h-14 object-contain flex-shrink-0"
            />
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">Boundary Excursion</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                If your cursor leaves the tunnel, a <strong>red marker</strong> appears at the boundary. Stay within the tunnel walls to minimise excursions.
              </p>
            </div>
          </section>

          {/* Footer CTA */}
          <div className="pt-2 text-center">
            <p className="text-gray-500 text-sm mb-3">You will begin with a short practice trial.</p>
            <div className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-md shadow-indigo-200">
              <span className="font-semibold text-base">Press</span>
              <kbd className="bg-white/20 text-white px-3 py-1 rounded-lg font-mono font-bold text-base tracking-wider">SPACE</kbd>
              <span className="font-semibold text-base">to start practice</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
