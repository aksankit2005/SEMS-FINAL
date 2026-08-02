import React, { useState } from 'react';
import { ShieldAlert, Info, CheckCircle2, ChevronDown, ChevronUp, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';

export const BADMINTON_RULES_DATA = {
  singles: [
    { num: 1, text: "Each side has **1 player**." },
    { num: 2, text: "A match is usually **Best of 3 games**, with each game played to **21 points**." },
    { num: 3, text: "A player must win by **2 points**. If the score reaches **29-29**, the first player to **30 points** wins." },
    { num: 4, text: "At the start of the game and when the server's score is even, serve from the **right service court**." },
    { num: 5, text: "When the server's score is odd, serve from the **left service court**." },
    { num: 6, text: "The shuttle must land within the **singles court boundaries** (long and narrow court)." },
    { num: 7, text: "A point is scored on every rally (Rally Point System)." },
    { num: 8, text: "Players change ends after each game and during the third game when one player reaches **11 points**." }
  ],
  doubles: [
    { num: 1, text: "Each side has **2 players**." },
    { num: 2, text: "A match is usually **Best of 3 games**, each game to **21 points**." },
    { num: 3, text: "A team must win by **2 points**. At **29-29**, the first team to **30 points** wins." },
    { num: 4, text: "Service alternates between partners according to the score." },
    { num: 5, text: "When the serving side's score is even, the player in the **right service court** serves." },
    { num: 6, text: "When the score is odd, the player in the **left service court** serves." },
    { num: 7, text: "The shuttle must land within the **doubles court boundaries** (short and wide for service, full width court during rallies)." },
    { num: 8, text: "Only the receiving player can return the serve." },
    { num: 9, text: "Players switch service courts after winning a point while serving." },
    { num: 10, text: "Teams change ends after each game and during the third game when a team reaches **11 points**." }
  ],
  images: [
    "https://images.openai.com/static-rsc-4/t-xrr9jhHF54kUBkS-3mbeSLTnGy1R3QupHPo8qmeGEt-e-EVVg7sqqdJaejazb68WA7Mc-bjZhui22wWn6sWGdYljt4I1W4p-mSfIxXXFiZnF71jFMK2ME_EFP6b0JGC3x9xotQ2ya-JpQDSnuN_7zuc20w7hS4uC3nJePqU5No1UGDDPmFbxVqK3izdAbp?purpose=fullsize",
    "https://images.openai.com/static-rsc-4/TRPIBz8au9tP5IffrylouO89WgAkAaweCMKNQfXaw7Ryhhba71Q1NHv3IfNniTTJid5QjLEnUrCUknmpKqQsfwWVnUH5NbMIJTY7aXg0onDevl8O3eis_r3xChAnvtSqlCWEj72KEAe8M-rwZ1-PC4KZJPTW8WlypxxHH488ozIRkZEOfs_c2TZHi2dwf3Yd?purpose=fullsize",
    "https://images.openai.com/static-rsc-4/U65A7OR0Oz4kNR2wpoQmwv8MzQVFqVBqbvjd9RzJ2NAGONoJj52jyZ9hxElYj9Vr_cyGT-umj3X59GaWDLkFRBoYyGK6SoyQww1kvT4G8TgcISi1-ltBbPIcgLzACcqSzehzCd4AZUQb64aEazRBSTbkvCwXAPq-axcbnJADqafpvLoHLEW02COcmDXu4TyZ?purpose=fullsize",
    "https://images.openai.com/static-rsc-4/cCmZjLJZadr5l8A8q7h-D9Qd-mVStgKV2Z0fAKHRVN3xwMyBQJ1vY4Dv85Ycd1SM9koLUQd9cFtdG7_bhj83t2B-QqXSlrfh-GCeOnHlMweWAv_6EgiPpSnjP47fYRomsRfRmEP0VmvsxzXqgu0hvEQs2jGRXFK1UpQuQRfpeQ10qFvmH0aVQSkcXLlWA-pC?purpose=fullsize",
    "https://images.openai.com/static-rsc-4/i-d78THoHWrtCY5UICgapdDB5Z34l59Qo6fR-wFbV6Kyvx0Jay0WPoVvAxZsbaPEaShUj5fVd8heNnbulAJK4FCXt2IaC5hHStbbPR4cObAjzn_OJmVSv3awN20UVVl2B3wH1NQgort77HzpvpLUBfrThTaTX4njy0G98qJ-XZHO6cjS6xqKwRxtOwHkTfmI?purpose=fullsize"
  ],
  faults: [
    "Shuttle lands outside the court.",
    "Shuttle hits the net and does not cross.",
    "Player touches the net with racket or body.",
    "Shuttle is hit twice by the same side.",
    "Feet are not stationary during service.",
    "Shuttle is struck above the server's waist during service."
  ],
  footnote: "These are the standard rules used by the Badminton World Federation (BWF) for official tournaments."
};

const renderFormattedText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-blue-600 dark:text-amber-400">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

export const BadmintonRulesDisplay = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🏸</span>
          <div>
            <h4 className="font-black text-base uppercase tracking-wider text-amber-400">
              Official BWF Badminton Rulebook
            </h4>
            <p className="text-xs text-slate-400">Standard rules for Singles, Doubles, and Court Boundaries</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
          BWF Standard
        </span>
      </div>

      {/* 1. Badminton Singles Rules */}
      <div className="space-y-3">
        <h5 className="font-black text-sm sm:text-base text-amber-300 flex items-center gap-2">
          <span>🏸</span>
          <span>Badminton Singles Rules</span>
        </h5>
        <div className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
          {BADMINTON_RULES_DATA.singles.map((rule) => (
            <div key={rule.num} className="flex items-start gap-2.5 leading-relaxed">
              <span className="font-bold text-amber-400 shrink-0">{rule.num}.</span>
              <span className="text-slate-200">{renderFormattedText(rule.text)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Badminton Doubles Rules */}
      <div className="space-y-3">
        <h5 className="font-black text-sm sm:text-base text-amber-300 flex items-center gap-2">
          <span>🏸</span>
          <span>Badminton Doubles Rules</span>
        </h5>
        <div className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
          {BADMINTON_RULES_DATA.doubles.map((rule) => (
            <div key={rule.num} className="flex items-start gap-2.5 leading-relaxed">
              <span className="font-bold text-amber-400 shrink-0">{rule.num}.</span>
              <span className="text-slate-200">{renderFormattedText(rule.text)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Visual Court & Rules Diagrams (5 Images) */}
      <div className="space-y-3">
        <h5 className="font-black text-xs sm:text-sm text-indigo-300 flex items-center gap-2 uppercase tracking-wide">
          <ImageIcon className="w-4 h-4 text-indigo-400" />
          <span>Court & Service Boundary Diagrams ({BADMINTON_RULES_DATA.images.length} Guides)</span>
        </h5>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BADMINTON_RULES_DATA.images.map((imgUrl, index) => (
            <div
              key={index}
              onClick={() => setSelectedImage(imgUrl)}
              className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group cursor-pointer hover:border-amber-400 transition shadow-md"
            >
              <img
                src={imgUrl}
                alt={`Badminton Rule Diagram ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition" />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/90 text-[10px] font-mono font-bold text-amber-400 border border-slate-700">
                Rule Diagram #{index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Common Faults */}
      <div className="space-y-3">
        <h5 className="font-black text-xs sm:text-sm text-rose-400 flex items-center gap-2 uppercase tracking-wide">
          <ShieldAlert className="w-4 h-4" />
          <span>Common Faults</span>
        </h5>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm bg-rose-950/30 p-4 rounded-2xl border border-rose-500/30">
          {BADMINTON_RULES_DATA.faults.map((fault, index) => (
            <li key={index} className="flex items-start gap-2 text-rose-200">
              <span className="text-rose-400 font-bold">•</span>
              <span>{fault}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Footnote */}
      <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 italic text-center">
        {BADMINTON_RULES_DATA.footnote}
      </div>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full bg-slate-900 p-2 rounded-2xl border border-slate-700 shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="Badminton Diagram Fullview"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};

/* FULL SCREEN RULEBOOK MODAL WITH GO BACK BUTTON */
export const BadmintonRulesModal = ({ isOpen, onClose, sportName = "Badminton" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-xl p-3 sm:p-6 animate-fade-in flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Sticky Header with Go Back Button */}
        <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition border border-slate-700 active:scale-95 shadow-md shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Go Back</span>
          </button>

          <div className="text-center truncate">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block font-bold">
              Official BWF Rulebook
            </span>
            <h2 className="text-sm sm:text-lg font-black text-white flex items-center gap-1.5 justify-center truncate">
              <span>🏸</span> {sportName} Full Tournament Rules
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition shrink-0"
            title="Close Rules"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto">
          <BadmintonRulesDisplay />
        </div>

        {/* Sticky Footer with Go Back Button */}
        <div className="bg-slate-950 px-5 py-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400 italic hidden sm:inline">
            Badminton World Federation (BWF) Standard Tournament Rules
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md active:scale-95 ml-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back to Registration</span>
          </button>
        </div>

      </div>
    </div>
  );
};
