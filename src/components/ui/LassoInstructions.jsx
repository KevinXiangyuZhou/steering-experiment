import React from 'react';

const Step = ({ number, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center mt-0.5">
      {number}
    </span>
    <span className="text-gray-700 leading-relaxed">{children}</span>
  </li>
);

export const LassoInstructions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center py-12 px-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-teal-500 px-10 py-8 text-white">
          <p className="text-cyan-200 text-sm font-medium uppercase tracking-widest mb-1">Study 2 · ~4 minutes</p>
          <h1 className="text-3xl font-bold tracking-tight">Lasso Selection Task</h1>
          <p className="text-cyan-100 mt-2 text-base">Read all instructions before you begin.</p>
        </div>

        <div className="px-10 py-8 space-y-8">

          {/* Steps */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Instructions</h2>
            <ol className="space-y-3.5">
              <Step number="1">Click the <strong>green START button</strong> to begin each trial.</Step>
              <Step number="2">Draw a clockwise loop around <strong>all yellow targets</strong> to select them, then stop at the red dot.</Step>
              <Step number="3">A <strong>light blue corridor</strong> marks the path you should follow — stay inside it.</Step>
              <Step number="4">Going too close to targets or distractors will fail the trial.</Step>
              <Step number="5">Move as smoothly and accurately as you can.</Step>
            </ol>
          </section>

          <hr className="border-gray-100" />

          {/* Examples */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Visual Guide &amp; Example</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-cyan-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  <span className="text-sm font-semibold text-cyan-800">Stay within the blue corridor</span>
                </div>
                <div className="p-4">
                  <img
                    src="/steering-experiment/screenshots/lasso_selection_try_keep_your_cursor_within_light_blue_tunnel.png"
                    alt="Lasso corridor guide"
                    className="w-full rounded-lg object-contain max-h-44"
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-green-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-sm font-semibold text-green-800">Good — aim for this</span>
                </div>
                <div className="p-4">
                  <img
                    src="/steering-experiment/screenshots/good_lasso_selection_example.png"
                    alt="Good lasso selection"
                    className="w-full rounded-lg object-contain max-h-44"
                  />
                  <p className="text-xs text-green-700 mt-3 text-center">Smooth, continuous loop following the corridor</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <div className="pt-2 text-center">
            <div className="inline-flex items-center gap-3 bg-cyan-600 text-white px-8 py-4 rounded-2xl shadow-md shadow-cyan-200">
              <span className="font-semibold text-base">Press</span>
              <kbd className="bg-white/20 text-white px-3 py-1 rounded-lg font-mono font-bold text-base tracking-wider">SPACE</kbd>
              <span className="font-semibold text-base">to begin</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
