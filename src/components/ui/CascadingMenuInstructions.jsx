import React from 'react';

const Step = ({ number, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center mt-0.5">
      {number}
    </span>
    <span className="text-gray-700 leading-relaxed">{children}</span>
  </li>
);

export const CascadingMenuInstructions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center py-12 px-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-500 px-10 py-8 text-white">
          <p className="text-violet-200 text-sm font-medium uppercase tracking-widest mb-1">Study 3 · ~4 minutes</p>
          <h1 className="text-3xl font-bold tracking-tight">Cascading Menu Task</h1>
          <p className="text-violet-100 mt-2 text-base">Read all instructions before you begin.</p>
        </div>

        <div className="px-10 py-8 space-y-8">

          {/* Steps */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Instructions</h2>
            <ol className="space-y-3.5">
              <Step number="1">Click the <strong>green START button</strong> to begin each trial.</Step>
              <Step number="2">Move your cursor <strong>vertically down</strong> the main menu to the <strong>red target item</strong>.</Step>
              <Step number="3">When hovering the red target, a <strong>submenu opens</strong> to the right.</Step>
              <Step number="4">Move your cursor into the submenu and click the <strong>red target item</strong> to complete the trial.</Step>
              <Step number="5">Move as smoothly and accurately as you can.</Step>
            </ol>
          </section>

          <hr className="border-gray-100" />

          {/* Example */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Navigation Example</h2>
            <div className="rounded-2xl border border-green-200 bg-green-50 overflow-hidden">
              <div className="px-5 py-3 border-b border-green-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-sm font-semibold text-green-800">Good — aim for this</span>
              </div>
              <div className="p-5">
                <img
                  src="/steering-experiment/screenshots/good_cascading_menu_example.png"
                  alt="Good cascading menu navigation"
                  className="w-full rounded-xl object-contain max-h-56 mx-auto"
                />
                <p className="text-xs text-green-700 mt-3 text-center">
                  Navigate straight down to the target item, then move smoothly into the submenu
                </p>
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <div className="pt-2 text-center">
            <div className="inline-flex items-center gap-3 bg-violet-600 text-white px-8 py-4 rounded-2xl shadow-md shadow-violet-200">
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
