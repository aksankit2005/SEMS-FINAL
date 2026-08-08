import React, { useState } from 'react';
import { ShieldAlert, Info, CheckCircle2, ChevronDown, ChevronUp, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import { CricketRulesDisplay } from './CricketRulesDisplay';

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

/* ♟️ CHESS 10-MINUTE RAPID RULES DATA & DISPLAY */
export const CHESS_10MIN_RULES_DATA = [
  { num: 1, title: "Time Control", text: "Each player gets **10 minutes** for the entire game (10+0 unless increment is specified)." },
  { num: 2, title: "Clock", text: "The chess clock starts when White makes the first move. Press the clock after every move." },
  { num: 3, title: "Touch-Move Rule", text: "If you touch one of your own pieces, you must move it if a legal move exists." },
  { num: 4, title: "Illegal Moves", text: "An illegal move must be corrected. If a player makes **two illegal moves**, they lose the game (common rapid rule)." },
  { num: 5, title: "Win Conditions", text: "• **Checkmate**\n• **Opponent's time runs out**\n• **Opponent resigns**" },
  { num: 6, title: "Draw Conditions", text: "• **Stalemate**\n• **Threefold repetition** (if claimed)\n• **50-move rule** (if claimed)\n• **Insufficient mating material**\n• **Mutual agreement**" },
  { num: 7, title: "Spectators", text: "No talking or giving advice during the game." },
  { num: 8, title: "Electronic Devices", text: "Mobile phones and other electronic devices must remain silent and unused." },
  { num: 9, title: "Result Reporting", text: "Both players must report the result to the organizer immediately after the game." },
  { num: 10, title: "Organizer's Decision", text: "The tournament arbiter/organizer's decision is final in case of disputes." }
];

export const ChessRulesDisplay = () => {
  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">♟️</span>
          <div>
            <h4 className="font-black text-base uppercase tracking-wider text-purple-400">
              Chess Rules (10-Minute Rapid)
            </h4>
            <p className="text-xs text-slate-400">Standard 10-Minute Rapid Chess tournament rules for college or club events</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
          10-Min Rapid
        </span>
      </div>

      <div className="space-y-3">
        <h5 className="font-black text-sm sm:text-base text-purple-300 flex items-center gap-2">
          <span>♟️</span>
          <span>10-Minute Rapid Tournament Regulations</span>
        </h5>
        <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm bg-slate-950/80 p-5 rounded-2xl border border-purple-500/20 shadow-inner">
          {CHESS_10MIN_RULES_DATA.map((rule) => (
            <div key={rule.num} className="flex items-start gap-3 leading-relaxed">
              <span className="font-mono font-black text-purple-400 shrink-0 text-sm bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                {rule.num}.
              </span>
              <div>
                <strong className="font-bold text-white block text-xs uppercase tracking-wider text-purple-300">{rule.title}</strong>
                <span className="text-slate-300 whitespace-pre-line">{renderFormattedText(rule.text)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* 🏀 BASKETBALL RULES DATA & DISPLAY */
export const BASKETBALL_RULES_DATA = [
  { title: "Team Composition", text: "Each team consists of **5 players on the court**. Substitutions are allowed as per the tournament rules." },
  { title: "Match Duration", text: "The game consists of **4 quarters of 10 minutes each** with a **2-minute break** after the 1st and 3rd quarters and a **10-minute halftime** after the 2nd quarter." },
  { title: "Scoring System", text: "• **Free Throw** = 1 Point\n• **Field Goal** (inside the 3-point line) = 2 Points\n• **Beyond the 3-point line** = 3 Points" },
  { title: "Game Start", text: "The game begins with a **jump ball** at the center circle." },
  { title: "Shot Clock", text: "A team must attempt a shot within **24 seconds** of gaining possession." },
  { title: "Player Fouls", text: "A player who commits **5 personal fouls** is disqualified from the game." },
  { title: "Team Fouls", text: "After a team reaches the foul limit in a quarter, the opposing team is awarded free throws according to the applicable rules." },
  { title: "Timeouts", text: "Teams may request timeouts as permitted by the tournament regulations." },
  { title: "Overtime", text: "If the score is tied at the end of regulation, **5-minute overtime periods** will be played until a winner is decided." },
  { title: "Sportsmanship", text: "• Respect referees, opponents, and officials.\n• Unsportsmanlike behavior or abusive language may result in **technical fouls or disqualification**." },
  { title: "Uniforms", text: "All players must wear **matching jerseys with clearly visible numbers** and appropriate basketball shoes." },
  { title: "Organizer's Decision", text: "The referee's and tournament organizer's decisions are **final and binding**." }
];

export const BASKETBALL_GUIDELINES_DATA = [
  "Teams should report **15 minutes before** their scheduled match.",
  "Carry a valid **college ID card**.",
  "Late arrival may result in a **walkover**.",
  "Only **registered players** are allowed to participate.",
  "Fair play and discipline are mandatory throughout the tournament."
];

export const BasketballRulesDisplay = () => {
  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-orange-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🏀</span>
          <div>
            <h4 className="font-black text-base uppercase tracking-wider text-orange-400">
              Official Basketball Tournament Rules
            </h4>
            <p className="text-xs text-slate-400">FIBA Standard Regulations for College & Inter-University Championships</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
          FIBA Standard
        </span>
      </div>

      <div className="space-y-3">
        <h5 className="font-black text-sm sm:text-base text-orange-300 flex items-center gap-2">
          <span>🏀</span>
          <span>Tournament Regulations</span>
        </h5>
        <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm bg-slate-950/80 p-5 rounded-2xl border border-orange-500/20 shadow-inner">
          {BASKETBALL_RULES_DATA.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-3 leading-relaxed">
              <span className="font-mono font-black text-orange-400 shrink-0 text-sm bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                {idx + 1}.
              </span>
              <div>
                <strong className="font-bold text-white block text-xs uppercase tracking-wider text-orange-300">{rule.title}</strong>
                <span className="text-slate-300 whitespace-pre-line">{renderFormattedText(rule.text)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="font-black text-sm sm:text-base text-amber-300 flex items-center gap-2">
          <span>📌</span>
          <span>Additional Guidelines</span>
        </h5>
        <div className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
          {BASKETBALL_GUIDELINES_DATA.map((guide, idx) => (
            <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="font-bold text-amber-400 shrink-0">•</span>
              <span className="text-slate-200">{renderFormattedText(guide)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* 🏓 TABLE TENNIS OFFICIAL TOURNAMENT RULES DATA & DISPLAY */
export const TABLE_TENNIS_RULES_DATA = [
  { num: 1, title: "Games are played to 11 points", text: "A Game is played to **11 points**. A Game must be won by **two points**. A Match is generally the best **three of five Games**." },
  { num: 2, title: "Alternate serves every two points", text: "Each side of the table alternates serving **two points at a time**. EXCEPTION: After tied **10-10 (“deuce”)**, service alternates at **every point**. There is no separate rule for serving on Game Point (you CAN lose on a serve)." },
  { num: 3, title: "Toss the ball straight up when serving", text: "Hold the ball in your open palm, behind your end of the table. Toss at least **6 inches straight up**, and strike it on the way down. It must hit your side of the table and then the opponent's side. NOTE: Once the ball leaves the server’s hand it is in play, and counts as receiver’s point if missed or mis-hit." },
  { num: 4, title: "The serve can land anywhere in singles", text: "There is no restriction on where the ball lands on your side or your opponent’s side of the table. It can bounce two or more times on your opponent’s side, bounce over the side, or even hit the edge." },
  { num: 5, title: "Doubles serves must go right court to right court", text: "The serve must bounce in the **server’s right court**, and **receiver’s right court** (landing on center line is fair). Doubles partners switch places after their team serves twice." },
  { num: 6, title: "A serve that touches the net on the way over is a “LET”", text: "During a RALLY, if the ball touches the top of the net and lands in play, it is a legitimate hit. BUT not when serving. If a served ball hits the net on the way over and bounces in play, it’s a **“let” serve and is replayed**. There is no limit on how many times this can happen." },
  { num: 7, title: "Alternate hitting in a doubles rally", text: "Doubles partners must **alternate hitting balls in a rally**, no matter where the ball lands on the table." },
  { num: 8, title: "Volleys are NOT allowed", text: "You cannot hit the ball before it bounces on your side of the table. In table tennis, **volleying results in a point for your opponent**. NOTE: When your opponent hits a ball that sails over your end of the table without touching it and then hits you or your paddle, that is still your point." },
  { num: 9, title: "If your hit bounces back over the net by itself it is your point", text: "If you hit the ball in a rally or on a serve and it bounces back over the net after hitting your opponent’s side of the table (due to extreme spin), without your opponent touching it, that is **your point**." },
  { num: 10, title: "Touching the ball with your paddle hand is allowed", text: "If the ball touches your **PADDLE hand** (fingers and hand area below the wrist) and results in a legal hit, play continues normally. You may NOT touch the ball with your non-paddle hand. BUT if opponent’s hit sails over your table without touching and hits you/paddle, it is still your point." },
  { num: 11, title: "You may not touch the table with your non-paddle hand", text: "You may touch the ball or table with your paddle hand or body. NOTE: If the table moves at all from your touching it during a rally, that is **your opponent’s point**." },
  { num: 12, title: "An “edge” ball bouncing off the horizontal table top surface is good", text: "An otherwise legal serve or hit contacting the **top edge of the horizontal table top surface** is valid, even if it bounces sidewise. Vertical sides of the table are NOT part of the legal playing surface." },
  { num: 13, title: "Honor system applies to disagreements", text: "If no referee is present during a match and players disagree on a call, the **“honor system”** applies and players should agree or replay the point. Table tennis carries a tradition of fierce but fair play!" }
];

export const TableTennisRulesDisplay = () => {
  return (
    <div className="space-y-6 text-slate-100 font-sans">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🏓</span>
          <div>
            <h4 className="font-black text-base uppercase tracking-wider text-cyan-400">
              Official ITTF Table Tennis Rules & Regulations
            </h4>
            <p className="text-xs text-slate-400">13 Official Rules of Table Tennis (ITTF Standard)</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          ITTF Standard
        </span>
      </div>

      <div className="space-y-3">
        <h5 className="font-black text-sm sm:text-base text-cyan-300 flex items-center gap-2">
          <span>🏓</span>
          <span>13 Official Table Tennis Match Rules</span>
        </h5>
        <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm bg-slate-950/80 p-5 rounded-2xl border border-cyan-500/20 shadow-inner">
          {TABLE_TENNIS_RULES_DATA.map((rule) => (
            <div key={rule.num} className="flex items-start gap-3 leading-relaxed">
              <span className="font-mono font-black text-cyan-400 shrink-0 text-sm bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                {rule.num}.
              </span>
              <div>
                <strong className="font-bold text-white block text-xs uppercase tracking-wider text-cyan-300 mb-0.5">{rule.title}</strong>
                <span className="text-slate-300 whitespace-pre-line">{renderFormattedText(rule.text)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const FOOTBALL_5V5_RULES_DATA = [
  { num: 1, title: "1. Team Composition", text: "5 players on the field at a time (1 Goalkeeper + 4 Outfield players). Substitutes: Up to 3 rolling/flying substitutes. A team must have at least 4 players to start or continue a match." },
  { num: 2, title: "2. Match Duration & Knockouts", text: "2 halves × 10 minutes each with a 5-minute half-time interval. Clock stopped for serious injuries. Tied knockout matches go directly to Penalty Shootout (3 penalties per team initially, then sudden death)." },
  { num: 3, title: "3. Kick-Off", text: "The match starts with a kick-off from the center circle. Opponents must remain outside the required distance. A goal can be scored directly from a kick-off." },
  { num: 4, title: "4. Ball Out of Play", text: "Sideline: Restart with a kick-in or throw-in depending on pitch rules. Goal line: Goal kick or corner kick. The ball must completely cross the boundary line to be out of play." },
  { num: 5, title: "5. Goalkeeper Rules", text: "Only the goalkeeper can use hands inside their own penalty area. Goalkeepers cannot deliberately handle a ball kicked back to them by a teammate's foot. Must release the ball within tournament time limit." },
  { num: 6, title: "6. Fouls & Penalty Kicks", text: "Includes kicking, tripping, pushing, holding, dangerous tackles, handball, or unsporting behavior. Direct fouls inside defending penalty area result in a Penalty Kick." },
  { num: 7, title: "7. Cards & Discipline", text: "🟨 Yellow Card: Warning / Caution.\n🟥 Red Card: Player sent off and cannot return to the match. 2 Yellow Cards in a match auto-convert to a Red Card." },
  { num: 8, title: "8. Offside Rule", text: "❌ No Offside Rule in 5v5 mini-football format. This keeps gameplay fast, dynamic, and easy to manage on small turfs." },
  { num: 9, title: "9. Free Kicks", text: "Free kicks can be direct or indirect depending on the nature of the foul. Opponents must maintain the required wall distance." },
  { num: 10, title: "10. Corner Kick", text: "Awarded when the defending team is last to touch the ball before it completely crosses their goal line. Taken from the designated corner arc." },
  { num: 11, title: "11. Penalty Kick", text: "Awarded for direct-free-kick offences inside the defending team's penalty area. Only the goalkeeper defends. All other players stay outside the penalty line." },
  { num: 12, title: "12. Equipment & Fair Play", text: "Proper sports shoes and team jerseys mandatory. No jewelry or dangerous accessories. Abusive behavior or fighting results in immediate player/team disqualification." }
];

export const FootballRulesDisplay = () => {
  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">⚽</span>
          <div>
            <h4 className="font-black text-base uppercase tracking-wider text-emerald-400">
              Official 5v5 Football Tournament Rulebook
            </h4>
            <p className="text-xs text-slate-400">12 Official Rules of 5-a-Side Mini Football</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          5v5 Format
        </span>
      </div>

      <div className="space-y-3">
        <h5 className="font-black text-sm sm:text-base text-emerald-300 flex items-center gap-2">
          <span>⚽</span>
          <span>12 Official Football 5v5 Tournament Rules</span>
        </h5>
        <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm bg-slate-950/80 p-5 rounded-2xl border border-emerald-500/20 shadow-inner">
          {FOOTBALL_5V5_RULES_DATA.map((rule) => (
            <div key={rule.num} className="flex items-start gap-3 leading-relaxed">
              <span className="font-mono font-black text-emerald-400 shrink-0 text-sm bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {rule.num}.
              </span>
              <div>
                <strong className="font-bold text-white block text-xs uppercase tracking-wider text-emerald-300 mb-0.5">{rule.title}</strong>
                <span className="text-slate-300 whitespace-pre-line">{renderFormattedText(rule.text)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* FULL SCREEN RULEBOOK MODAL WITH GO BACK BUTTON */
export const BadmintonRulesModal = ({ isOpen, onClose, sportName = "Badminton" }) => {
  if (!isOpen) return null;

  const sName = (sportName || '').toLowerCase();
  const isCricket = sName.includes('cricket');
  const isChess = sName.includes('chess');
  const isBasketball = sName.includes('basketball');
  const isTableTennis = sName.includes('table') || sName.includes('tt') || sName.includes('ping pong');
  const isFootball = sName.includes('football') || sName.includes('soccer');

  const themeColorClass = isCricket 
    ? 'text-emerald-400' 
    : isChess 
    ? 'text-purple-400' 
    : isBasketball 
    ? 'text-orange-400'
    : isTableTennis
    ? 'text-cyan-400'
    : isFootball
    ? 'text-emerald-400' 
    : 'text-amber-400';

  const themeBtnClass = isCricket 
    ? 'bg-emerald-600 hover:bg-emerald-500' 
    : isChess 
    ? 'bg-purple-600 hover:bg-purple-500' 
    : isBasketball 
    ? 'bg-orange-600 hover:bg-orange-500'
    : isTableTennis
    ? 'bg-cyan-600 hover:bg-cyan-500'
    : isFootball
    ? 'bg-emerald-600 hover:bg-emerald-500' 
    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-xl p-3 sm:p-6 animate-fade-in flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Sticky Header with Go Back Button */}
        <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition border border-slate-700 active:scale-95 shadow-md shrink-0 cursor-pointer"
          >
            <ArrowLeft className={`w-4 h-4 ${themeColorClass}`} />
            <span>Go Back</span>
          </button>

          <div className="text-center truncate">
            <span className={`text-[10px] font-mono uppercase tracking-widest block font-bold ${themeColorClass}`}>
              {isCricket ? 'Official Cricket Tournament Rulebook' : isChess ? '10-Minute Rapid Chess Rulebook' : isBasketball ? 'FIBA Basketball Rulebook' : isTableTennis ? 'Official ITTF Table Tennis Rulebook' : isFootball ? 'Official 5v5 Football Tournament Rulebook' : 'Official BWF Rulebook'}
            </span>
            <h2 className="text-sm sm:text-lg font-black text-white flex items-center gap-1.5 justify-center truncate">
              <span>{isCricket ? '🏏' : isChess ? '♟️' : isBasketball ? '🏀' : isTableTennis ? '🏓' : isFootball ? '⚽' : '🏸'}</span> {sportName} Tournament Rules
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition shrink-0 cursor-pointer"
            title="Close Rules"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 space-y-6 overflow-y-auto">
          {isCricket ? (
            <CricketRulesDisplay />
          ) : isChess ? (
            <ChessRulesDisplay />
          ) : isBasketball ? (
            <BasketballRulesDisplay />
          ) : isTableTennis ? (
            <TableTennisRulesDisplay />
          ) : isFootball ? (
            <FootballRulesDisplay />
          ) : (
            <BadmintonRulesDisplay />
          )}
        </div>

        {/* Sticky Footer with Go Back Button */}
        <div className="bg-slate-950 px-5 py-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400 italic hidden sm:inline">
            {isCricket ? 'Official 8-Over & 10-Over Cricket Regulations' : isChess ? '10-Minute Rapid Chess Regulations' : isBasketball ? 'FIBA Official Basketball Regulations' : isTableTennis ? 'ITTF Official 13 Table Tennis Tournament Rules' : isFootball ? 'Official 12 Football 5v5 Tournament Rules' : 'BWF Standard Tournament Rules'}
          </span>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center gap-2 transition shadow-md active:scale-95 ml-auto cursor-pointer ${themeBtnClass}`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back to Registration</span>
          </button>
        </div>

      </div>
    </div>
  );
};
