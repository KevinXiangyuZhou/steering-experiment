import React, { useState } from 'react';

const TOTAL_PAGES = 4;

const PAGE_LABELS = [
  'Continue to mouse settings',
  'Continue to screen setup',
  'Continue to final checklist',
  'Begin the experiment',
];

const PageIndicator = ({ current, total }) => (
  <div className="flex justify-center gap-2">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={`rounded-full transition-all duration-200 ${
          i === current ? 'w-6 h-2 bg-blue-600' : 'w-2 h-2 bg-gray-200'
        }`}
      />
    ))}
  </div>
);

const NavFooter = ({ page, onNext }) => (
  <div className="mt-7 text-center space-y-3">
    <PageIndicator current={page} total={TOTAL_PAGES} />
    <button
      onClick={onNext}
      className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 border border-blue-300 text-gray-900 px-7 py-3.5 rounded-xl mt-3 transition-colors cursor-pointer"
    >
      <span className="font-semibold text-sm">{PAGE_LABELS[page]} →</span>
    </button>
  </div>
);

const PageWrapper = ({ children, page, onNext }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
    <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 px-10 py-7 text-white text-center">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
          Setup · Step {page + 1} of {TOTAL_PAGES}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Environment Setup</h1>
      </div>
      <div className="px-12 py-7">
        {children}
        <NavFooter page={page} onNext={onNext} />
      </div>
    </div>
  </div>
);

/* ── Shared image block ──────────────────────────────────── */
const ImgBlock = ({ src, alt, caption }) => (
  <div>
    <div className="rounded-lg overflow-hidden bg-gray-50">
      <img src={src} alt={alt} className="w-full object-contain max-h-28" />
    </div>
    {caption && <p className="text-xs text-gray-400 mt-1 text-center">{caption}</p>}
  </div>
);

/* ── Page 1: Notice + device requirements ────────────────── */
const Page1 = () => (
  <div className="space-y-5">
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1.5">Important</p>
      <p className="text-gray-800 text-sm leading-relaxed">
        Please configure your setup following the instructions correctly — this takes about <strong>4 minutes</strong>.
      </p>
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">Device Requirements</p>
      <div className="space-y-2.5 max-w-sm mx-auto">
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <span className="text-green-600 font-bold mt-0.5">&#10003;</span>
          <p className="text-gray-700 text-sm leading-relaxed">Use a <strong>desktop computer</strong> with a <strong>physical mouse</strong> on a flat surface.</p>
        </div>
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-600 font-bold mt-0.5">&#10007;</span>
          <p className="text-gray-700 text-sm leading-relaxed">Do <strong>not</strong> use a trackpad, touchscreen, or drawing tablet.</p>
        </div>
      </div>
    </div>
  </div>
);

/* ── Page 2: Combined mouse settings (Windows + Mac tab) ─── */
const Page2 = () => {
  const [os, setOs] = useState('windows');
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Mouse Settings — select your OS</p>
        <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setOs('windows')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              os === 'windows' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Windows
          </button>
          <button
            onClick={() => setOs('mac')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              os === 'mac' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Mac
          </button>
        </div>
      </div>

      {os === 'windows' ? (
        <div className="space-y-3">
          <ol className="space-y-2 text-sm text-gray-700">
            {[
              <>Open <strong>Control Panel</strong> → Hardware and Sound → Devices and Printers → Mouse</>,
              <>Click <strong>"Additional Mouse Settings"</strong> → go to the <strong>"Pointer Options"</strong> tab</>,
              <><strong>Uncheck "Enhance pointer precision"</strong></>,
              <>Set the <strong>pointer speed slider to the middle</strong> position</>,
            ].map((text, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <div className="grid grid-cols-2 gap-3">
            <ImgBlock src="/steering-experiment/screenshots/windows_pointer_acceleration.png" alt="Windows pointer acceleration" caption='Uncheck "Enhance pointer precision"' />
            <ImgBlock src="/steering-experiment/screenshots/windows_tracking_speed_tick.png" alt="Windows tracking speed" caption="Pointer speed at middle" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <ol className="space-y-2 text-sm text-gray-700">
            {[
              <>Open <strong>System Preferences</strong> → <strong>Mouse</strong></>,
              <>Set <strong>Tracking Speed</strong> to the <strong>5th tick</strong> from the left</>,
              <>Click <strong>Advanced</strong> → <strong>Disable Pointer Acceleration</strong></>,
            ].map((text, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <div className="grid grid-cols-2 gap-3">
            <ImgBlock src="/steering-experiment/screenshots/mac_tracking_speed_tick.png" alt="Mac tracking speed" caption="Tracking speed at 5th tick" />
            <ImgBlock src="/steering-experiment/screenshots/mac_pointer_acceleration.png" alt="Mac pointer acceleration" caption="Disable pointer acceleration" />
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Page 3: Screen + positioning ────────────────────────── */
const Page3 = () => (
  <div className="space-y-4">
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-center">Screen &amp; Position</p>
    <div className="space-y-2.5 max-w-sm mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="font-semibold text-gray-800 text-sm mb-0.5">Make your browser full screen</p>
        <p className="text-sm text-gray-600">
          Press <kbd className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono font-bold">F11</kbd> on Windows or <kbd className="bg-gray-200 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono font-bold">⌘⌃F</kbd> on Mac
        </p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="font-semibold text-gray-800 text-sm mb-0.5">Sit at arm's length from your monitor</p>
        <p className="text-sm text-gray-600">Keep the same position throughout and adjust your posture at the start of each trial.</p>
      </div>
    </div>
    <ImgBlock src="/steering-experiment/screenshots/position_your_self.png" alt="Proper sitting position" caption="Sit comfortably at arm's length from the screen" />
  </div>
);

/* ── Page 4: During experiment reminders ─────────────────── */
const Page4 = () => (
  <div className="space-y-4">
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-center">During the Experiment</p>
    <div className="space-y-2.5 max-w-sm mx-auto">
      {[
        { ok: true,  text: 'Follow instructions carefully and try your best on every trial.' },
        { ok: true,  text: 'Adjust your posture at the start of each trial.' },
        { ok: false, text: 'Do not change your mouse settings once the experiment starts.' },
        { ok: false, text: 'Do not switch to other applications during a trial.' },
      ].map(({ ok, text }, i) => (
        <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <span className={`font-bold mt-0.5 ${ok ? 'text-green-600' : 'text-red-500'}`}>{ok ? '✓' : '✕'}</span>
          <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
        </div>
      ))}
    </div>
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 text-center max-w-sm mx-auto">
      <p className="text-indigo-900 font-semibold">All set — ready to begin?</p>
    </div>
  </div>
);

/* ── Consent page ────────────────────────────────────────── */
const ConsentPage = ({ onAgree }) => {
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-10 px-6">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl text-center px-12 py-14">
          <p className="text-2xl font-bold text-gray-800 mb-3">Thank you for your time.</p>
          <p className="text-gray-500 text-sm">You chose not to participate. You may close this tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen py-10 px-6 flex items-start justify-center">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden">

        <div className="bg-gradient-to-r from-blue-600 to-indigo-500 px-10 py-7 text-white text-center">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Research Study</p>
          <h1 className="text-2xl font-bold tracking-tight">Participant Information &amp; Consent</h1>
          <p className="text-blue-100 text-xs mt-2">Please read carefully before proceeding.</p>
        </div>

        <div className="px-12 py-7 space-y-5">

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest"><strong>Please Read the Following Carefully</strong></p>
            <p className="text-sm text-gray-700 leading-relaxed"><strong>Task:</strong> You will use a physical mouse to steer a cursor through digital "tunnels" of varying widths and shapes.</p>
            <p className="text-sm text-gray-700 leading-relaxed"><strong>Requirements:</strong> You must use a desktop computer with a physical mouse (no trackpads, tablets, or touchscreens).</p>
            <p className="text-sm text-gray-700 leading-relaxed"><strong>Duration:</strong> The study will take approximately 25–35 minutes.</p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Data Collection &amp; Privacy</p>
            <p className="text-sm text-gray-700 leading-relaxed">We will record your cursor coordinates (<em>x, y</em>), movement speed, and timing. No personally identifiable information (such as your name or IP address) will be linked to your performance data. Your data will be identified only by your Prolific ID to ensure payment.</p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Participation &amp; Withdrawal</p>
            <p className="text-sm text-gray-700 leading-relaxed">Your participation is entirely voluntary. You may stop the study and return the submission on Prolific at any time for any reason without penalty. However, to receive the full payment listed on Prolific, you must complete the study and reach the completion page to receive your completion code.</p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Risks &amp; Benefits</p>
            <p className="text-sm text-gray-700 leading-relaxed">There are no known risks associated with this study beyond those encountered in everyday computer use (e.g., minor wrist fatigue). While there is no direct benefit to you, your participation helps us design more accessible and user-friendly digital interfaces.</p>
          </section>

          <hr className="border-gray-100" />

          <section className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Consent Statement</p>
            <p className="text-sm text-gray-700 leading-relaxed">By clicking <strong>"I Agree"</strong> below, you acknowledge that:</p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-start gap-2"><span className="text-indigo-500 mt-0.5">·</span>You are at least 18 years of age.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-500 mt-0.5">·</span>You are using a desktop computer and a physical mouse.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-500 mt-0.5">·</span>You have read the above information and voluntarily agree to participate.</li>
            </ul>
          </section>

        </div>

        <div className="px-12 py-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onAgree}
            className="flex-1 bg-blue-100 hover:bg-blue-200 border border-blue-300 text-gray-900 font-semibold text-sm py-3.5 rounded-xl transition-colors"
          >
            I Agree — Start Study
          </button>
          <button
            onClick={() => setDeclined(true)}
            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-sm py-3.5 rounded-xl transition-colors"
          >
            I Do Not Agree — Exit
          </button>
        </div>

      </div>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────── */
export const EnvironmentSetup = ({ onComplete }) => {
  const [consented, setConsented] = useState(false);
  const [page, setPage] = useState(0);
  const pages = [Page1, Page2, Page3, Page4];
  const CurrentPage = pages[page];

  React.useEffect(() => {
    if (!consented) return;
    const handleKeyPress = (event) => {
      if (event.key === ' ') {
        event.preventDefault();
        if (page < TOTAL_PAGES - 1) {
          setPage(p => p + 1);
        } else if (onComplete) {
          onComplete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [consented, page, onComplete]);

  if (!consented) {
    return <ConsentPage onAgree={() => setConsented(true)} />;
  }

  const handleNext = () => {
    if (page < TOTAL_PAGES - 1) {
      setPage(p => p + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <PageWrapper page={page} onNext={handleNext}>
      <CurrentPage />
    </PageWrapper>
  );
};
