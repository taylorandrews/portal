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
  82: {score:[3,2], aet:true},             // Belgium 3-2 Senegal
};
