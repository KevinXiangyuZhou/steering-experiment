import React from 'react';

const Step = ({ number, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
      {number}
    </span>
    <span className="text-gray-700 text-sm leading-relaxed">{children}</span>
  </li>
);

export const Instructions = ({ onNext }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center py-10 px-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden">

        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-8 py-6 text-white text-center">
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">Study 1 · ~3 minutes</p>
          <h1 className="text-2xl font-bold tracking-tight">Tunnel Steering Task</h1>
          <p className="text-indigo-100 mt-1 text-sm">Read carefully before you begin.</p>
        </div>

        <div className="px-8 py-6 space-y-5">

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">Instructions</p>
            <ol className="space-y-2.5">
              <Step number="1">Click the <strong>green START button</strong> to begin each trial.</Step>
              <Step number="2">Navigate your cursor through the tunnel to reach the <strong>red target</strong>.</Step>
              <Step number="3"><strong>Keep moving</strong> continuously — do not stop after clicking Start.</Step>
              <Step number="4">Press <kbd className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">R</kbd> to restart if you stop or get interrupted.</Step>
              <Step number="5">Move as smoothly and accurately as you can.</Step>
            </ol>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">Trajectory Examples</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-green-50 border border-green-200 p-3">
                <div className="rounded-lg overflow-hidden bg-white">
                  <img src="/steering-experiment/screenshots/good_trajectory_example.png" alt="Good trajectory" className="w-full object-contain max-h-32" />
                </div>
                <p className="text-xs font-semibold text-green-800 mt-2 text-center">Good — aim for this</p>
                <p className="text-xs text-green-700 text-center">Smooth, continuous movement</p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <div className="rounded-lg overflow-hidden bg-white">
                  <img src="/steering-experiment/screenshots/bad_trajectory_example.png" alt="Bad trajectory" className="w-full object-contain max-h-32" />
                </div>
                <p className="text-xs font-semibold text-red-800 mt-2 text-center">Bad — avoid this</p>
                <p className="text-xs text-red-700 text-center">Stopping, loops, jerky moves</p>
              </div>
            </div>
          </section>

          <section className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <img src="/steering-experiment/screenshots/excursion_hint.png" alt="Excursion marker" className="w-10 h-10 object-contain flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-900 mb-0.5">Boundary Excursion</p>
              <p className="text-xs text-amber-800 leading-relaxed">If your cursor leaves the tunnel, a <strong>red marker</strong> appears. Stay within the walls.</p>
            </div>
          </section>

          <div className="text-center pt-1">
            <p className="text-gray-400 text-xs mb-3">You will start with a short practice trial.</p>
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-gray-900 px-7 py-3.5 rounded-xl shadow-md shadow-indigo-200 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-sm">Begin Practice Trial →</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
