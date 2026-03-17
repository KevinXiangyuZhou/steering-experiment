import React from 'react';

const Step = ({ number, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center mt-0.5">
      {number}
    </span>
    <span className="text-gray-700 text-sm leading-relaxed">{children}</span>
  </li>
);

export const LassoInstructions = ({ onNext }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center py-10 px-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden">

        <div className="bg-gradient-to-r from-cyan-600 to-teal-500 px-8 py-6 text-white text-center">
          <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest mb-1">Study 2 · ~4 minutes</p>
          <h1 className="text-2xl font-bold tracking-tight">Lasso Selection Task</h1>
          <p className="text-cyan-100 mt-1 text-sm">Read carefully before you begin.</p>
        </div>

        <div className="px-8 py-6 space-y-5">

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">Instructions</p>
            <ol className="space-y-2.5">
              <Step number="1">Click the <strong>green START button</strong> to begin each trial.</Step>
              <Step number="2">Draw a clockwise loop around <strong>all yellow targets</strong>, then stop at the red dot.</Step>
              <Step number="3">A <strong>light blue corridor</strong> shows the path — stay inside it.</Step>
              <Step number="4">Going too close to targets or distractors fails the trial.</Step>
              <Step number="5">Move as smoothly and accurately as you can.</Step>
            </ol>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">Visual Guide &amp; Example</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-cyan-50 border border-cyan-200 p-3">
                <div className="rounded-lg overflow-hidden bg-white">
                  <img src="/steering-experiment/screenshots/lasso_selection_try_keep_your_cursor_within_light_blue_tunnel.png" alt="Lasso corridor" className="w-full object-contain max-h-32" />
                </div>
                <p className="text-xs font-semibold text-cyan-800 mt-2 text-center">Stay within the blue corridor</p>
              </div>
              <div className="rounded-xl bg-green-50 border border-green-200 p-3">
                <div className="rounded-lg overflow-hidden bg-white">
                  <img src="/steering-experiment/screenshots/good_lasso_selection_example.png" alt="Good lasso selection" className="w-full object-contain max-h-32" />
                </div>
                <p className="text-xs font-semibold text-green-800 mt-2 text-center">Good — aim for this</p>
                <p className="text-xs text-green-700 text-center">Smooth loop following the corridor</p>
              </div>
            </div>
          </section>

          <div className="text-center pt-1">
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-gray-900 px-7 py-3.5 rounded-xl shadow-md shadow-cyan-200 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-sm">Begin Lasso Trials →</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
