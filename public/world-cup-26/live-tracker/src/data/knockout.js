/* ============================================================
   EDIT HERE TO RECORD KNOCKOUT RESULTS.
   Keyed by FIFA match number (see R32/LATER in bracket.js).
   score:[x,y] — for an R32 match, x=home goals, y=away goals
   (same home/away order as that match's slot in the R32 array).
   For an R16+ match, x=goals for the winner of the lower-numbered
   feeder match ("a"), y=goals for the winner of the higher one ("b").
   aet:true   — went to extra time.
   pens:[x,y] — penalty shootout score, if scores were level after
                90'/120'. Winner is whichever side has more goals,
                falling back to pens when scores are tied.
   Leave a match out entirely until it's been played.
   ============================================================ */
export const RESULTS = {
  73: {score:[0,1]},                       // South Africa 0-1 Canada
  74: {score:[1,1], aet:true, pens:[3,4]}, // Germany 1-1 Paraguay (pens)
  75: {score:[1,1], aet:true, pens:[2,3]}, // Netherlands 1-1 Morocco (pens)
  76: {score:[2,1]},                       // Brazil 2-1 Japan
  77: {score:[3,0]},                       // France 3-0 Sweden
  78: {score:[1,2]},                       // Ivory Coast 1-2 Norway
  79: {score:[2,0]},                       // Mexico 2-0 Ecuador
  80: {score:[2,1]},                       // England 2-1 DR Congo
  81: {score:[2,0]},                       // USA 2-0 Bosnia & Herzegovina
  82: {score:[3,2], aet:true},             // Belgium 3-2 Senegal
  83: {score:[2,1]},                       // Portugal 2-1 Croatia
  84: {score:[3,0]},                       // Spain 3-0 Austria
  85: {score:[2,0]},                       // Switzerland 2-0 Algeria
  86: {score:[3,2], aet:true},             // Argentina 3-2 Cabo Verde (AET)
  87: {score:[1,0]},                       // Colombia 1-0 Ghana
  88: {score:[1,1], aet:true, pens:[2,4]}, // Australia 1-1 Egypt (Egypt wins on pens)

  // Round of 16
  89: {score:[0,1]},                       // Paraguay 0-1 France
  90: {score:[0,3]},                       // Canada 0-3 Morocco
  91: {score:[1,2]},                       // Brazil 1-2 Norway
  92: {score:[2,3]},                       // Mexico 2-3 England
  93: {score:[0,1]},                       // Portugal 0-1 Spain
  94: {score:[1,4]},                       // USA 1-4 Belgium
  95: {score:[3,2]},                       // Argentina 3-2 Egypt
  96: {score:[0,0], aet:true, pens:[4,3]}, // Switzerland 0-0 Colombia (Switzerland wins on pens)
};
