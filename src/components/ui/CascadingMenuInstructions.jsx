import React from 'react';

const Step = ({ number, children }) => (
  <li className="flex items-start gap-3">
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center mt-0.5">
      {number}
    </span>
    <span className="text-gray-700 text-sm leading-relaxed">{children}</span>
  </li>
);

export const CascadingMenuInstructions = ({ onNext }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center py-10 px-6">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden">

        <div className="bg-gradient-to-r from-violet-600 to-purple-500 px-8 py-6 text-white text-center">
          <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest mb-1">Study 3 · ~4 minutes</p>
          <h1 className="text-2xl font-bold tracking-tight">Cascading Menu Task</h1>
          <p className="text-violet-100 mt-1 text-sm">Read carefully before you begin.</p>
        </div>

        <div className="px-8 py-6 space-y-5">

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">Instructions</p>
            <ol className="space-y-2.5">
              <Step number="1">Click the <strong>green START button</strong> to begin each trial.</Step>
              <Step number="2">Move your cursor <strong>vertically down</strong> the main menu to the <strong>red target item</strong>.</Step>
              <Step number="3">When hovering the red target, a <strong>submenu opens</strong> to the right.</Step>
              <Step number="4">Move into the submenu and click the <strong>red target item</strong> to complete the trial.</Step>
              <Step number="5">Move as smoothly and accurately as you can.</Step>
            </ol>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">Navigation Example</p>
            <div className="rounded-xl bg-green-50 border border-green-200 p-3">
              <div className="rounded-lg overflow-hidden bg-white">
                <img src="/steering-experiment/screenshots/good_cascading_menu_example.png" alt="Good cascading menu navigation" className="w-full object-contain max-h-44" />
              </div>
              <p className="text-xs font-semibold text-green-800 mt-2 text-center">Good — aim for this</p>
              <p className="text-xs text-green-700 text-center">Navigate straight down, then smoothly into the submenu</p>
            </div>
          </section>

          <div className="text-center pt-1">
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-gray-900 px-7 py-3.5 rounded-xl shadow-md shadow-violet-200 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-sm">Begin Menu Trials →</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
