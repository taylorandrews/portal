/* ============================================================
   EDIT HERE TO UPDATE.
   For each match, add  score:[home,away]  once it's played.
   Leave score out (or null) for a fixture not yet played.
   kc:true  marks a Kansas City (Arrowhead) match.
   t:"H:MM"  kick-off time in Central Time.
   v:"City"  venue city / short location.
   ============================================================ */
export const AS_OF = "Updated June 24, 2026 — through June 23 matches";

export const DATA = [
 {g:"A", teams:{MEX:"Mexico", RSA:"South Africa", KOR:"South Korea", CZE:"Czechia"}, matches:[
   {md:"Jun 11", h:"MEX", a:"RSA", score:[2,0], t:"2:00", v:"Mexico City"},
   {md:"Jun 11", h:"KOR", a:"CZE", score:[2,1], t:"9:00", v:"Guadalajara"},
   {md:"Jun 18", h:"CZE", a:"RSA", score:[1,1], t:"11am", v:"Atlanta"},
   {md:"Jun 18", h:"MEX", a:"KOR", score:[1,0], t:"8:00", v:"Guadalajara"},
   {md:"Jun 24", h:"CZE", a:"MEX", t:"8:00", v:"Mexico City"},
   {md:"Jun 24", h:"RSA", a:"KOR", t:"8:00", v:"Guadalajara"},
 ]},
 {g:"B", teams:{CAN:"Canada", BIH:"Bosnia & Herz.", QAT:"Qatar", SUI:"Switzerland"}, matches:[
   {md:"Jun 12", h:"CAN", a:"BIH", score:[1,1], t:"2:00", v:"Toronto"},
   {md:"Jun 13", h:"QAT", a:"SUI", score:[1,1], t:"2:00", v:"Santa Clara"},
   {md:"Jun 18", h:"SUI", a:"BIH", score:[4,1], t:"2:00", v:"Los Angeles"},
   {md:"Jun 18", h:"CAN", a:"QAT", score:[6,0], t:"5:00", v:"Vancouver"},
   {md:"Jun 24", h:"SUI", a:"CAN", t:"2:00", v:"Vancouver"},
   {md:"Jun 24", h:"BIH", a:"QAT", t:"2:00", v:"Seattle"},
 ]},
 {g:"C", teams:{BRA:"Brazil", MAR:"Morocco", HAI:"Haiti", SCO:"Scotland"}, matches:[
   {md:"Jun 13", h:"BRA", a:"MAR", score:[1,1], t:"5:00", v:"East Rutherford"},
   {md:"Jun 13", h:"SCO", a:"HAI", score:[1,0], t:"8:00", v:"Foxborough"},
   {md:"Jun 19", h:"SCO", a:"MAR", score:[0,1], t:"5:00", v:"Foxborough"},
   {md:"Jun 19", h:"BRA", a:"HAI", score:[3,0], t:"7:30", v:"Philadelphia"},
   {md:"Jun 24", h:"SCO", a:"BRA", t:"5:00", v:"Miami"},
   {md:"Jun 24", h:"MAR", a:"HAI", t:"5:00", v:"Atlanta"},
 ]},
 {g:"D", teams:{USA:"United States", PAR:"Paraguay", AUS:"Australia", TUR:"Türkiye"}, tag:"USA's group", matches:[
   {md:"Jun 12", h:"USA", a:"PAR", score:[4,1], t:"8:00", v:"Los Angeles"},
   {md:"Jun 13", h:"AUS", a:"TUR", score:[2,0], t:"8:00", v:"Vancouver"},
   {md:"Jun 19", h:"USA", a:"AUS", score:[2,0], t:"2:00", v:"Seattle"},
   {md:"Jun 19", h:"TUR", a:"PAR", score:[0,1], t:"8:00", v:"Santa Clara"},
   {md:"Jun 25", h:"TUR", a:"USA", t:"9:00", v:"Los Angeles"},
   {md:"Jun 25", h:"PAR", a:"AUS", t:"9:00", v:"Santa Clara"},
 ]},
 {g:"E", teams:{GER:"Germany", CUW:"Curaçao", CIV:"Ivory Coast", ECU:"Ecuador"}, kcNote:"1× in KC", matches:[
   {md:"Jun 14", h:"GER", a:"CUW", score:[7,1], t:"12:00", v:"Houston"},
   {md:"Jun 14", h:"CIV", a:"ECU", score:[1,0], t:"6:00", v:"Philadelphia"},
   {md:"Jun 20", h:"GER", a:"CIV", score:[2,1], t:"3:00", v:"Toronto"},
   {md:"Jun 20", h:"ECU", a:"CUW", score:[0,0], kc:true, t:"7:00", v:"Kansas City"},
   {md:"Jun 25", h:"ECU", a:"GER", t:"3:00", v:"East Rutherford"},
   {md:"Jun 25", h:"CUW", a:"CIV", t:"3:00", v:"Philadelphia"},
 ]},
 {g:"F", teams:{NED:"Netherlands", JPN:"Japan", SWE:"Sweden", TUN:"Tunisia"}, kcNote:"1× in KC", matches:[
   {md:"Jun 14", h:"NED", a:"JPN", score:[2,2], t:"2:00", v:"Arlington"},
   {md:"Jun 14", h:"SWE", a:"TUN", score:[5,1], t:"9:00", v:"Monterrey"},
   {md:"Jun 20", h:"NED", a:"SWE", score:[5,1], t:"12:00", v:"Houston"},
   {md:"Jun 20", h:"TUN", a:"JPN", score:[0,4], t:"9:00", v:"Monterrey"},
   {md:"Jun 25", h:"JPN", a:"SWE", t:"6:00", v:"Arlington"},
   {md:"Jun 25", h:"TUN", a:"NED", kc:true, t:"6:00", v:"Kansas City"},
 ]},
 {g:"G", teams:{BEL:"Belgium", EGY:"Egypt", IRN:"Iran", NZL:"New Zealand"}, matches:[
   {md:"Jun 15", h:"BEL", a:"EGY", score:[1,1], t:"2:00", v:"Seattle"},
   {md:"Jun 15", h:"IRN", a:"NZL", score:[2,2], t:"8:00", v:"Los Angeles"},
   {md:"Jun 21", h:"BEL", a:"IRN", score:[0,0], t:"2:00", v:"Los Angeles"},
   {md:"Jun 21", h:"NZL", a:"EGY", score:[1,3], t:"8:00", v:"Vancouver"},
   {md:"Jun 26", h:"EGY", a:"IRN", t:"10:00", v:"Seattle"},
   {md:"Jun 26", h:"NZL", a:"BEL", t:"10:00", v:"Vancouver"},
 ]},
 {g:"H", teams:{ESP:"Spain", CPV:"Cabo Verde", KSA:"Saudi Arabia", URU:"Uruguay"}, matches:[
   {md:"Jun 15", h:"ESP", a:"CPV", score:[0,0], t:"11am", v:"Atlanta"},
   {md:"Jun 15", h:"KSA", a:"URU", score:[1,1], t:"5:00", v:"Miami"},
   {md:"Jun 21", h:"ESP", a:"KSA", score:[4,0], t:"11am", v:"Atlanta"},
   {md:"Jun 21", h:"URU", a:"CPV", score:[2,2], t:"5:00", v:"Miami"},
   {md:"Jun 26", h:"CPV", a:"KSA", t:"7:00", v:"Houston"},
   {md:"Jun 26", h:"URU", a:"ESP", t:"7:00", v:"Guadalajara"},
 ]},
 {g:"I", teams:{FRA:"France", SEN:"Senegal", IRQ:"Iraq", NOR:"Norway"}, matches:[
   {md:"Jun 16", h:"FRA", a:"SEN", score:[3,1], t:"2:00", v:"East Rutherford"},
   {md:"Jun 16", h:"NOR", a:"IRQ", score:[4,1], t:"5:00", v:"Foxborough"},
   {md:"Jun 22", h:"FRA", a:"IRQ", score:[3,0], t:"4:00", v:"Philadelphia"},
   {md:"Jun 22", h:"NOR", a:"SEN", score:[3,2], t:"7:00", v:"East Rutherford"},
   {md:"Jun 26", h:"NOR", a:"FRA", t:"2:00", v:"Foxborough"},
   {md:"Jun 26", h:"SEN", a:"IRQ", t:"2:00", v:"Toronto"},
 ]},
 {g:"J", teams:{ARG:"Argentina", ALG:"Algeria", AUT:"Austria", JOR:"Jordan"}, kcNote:"2× in KC", matches:[
   {md:"Jun 16", h:"ARG", a:"ALG", score:[3,0], kc:true, t:"8:00", v:"Kansas City"},
   {md:"Jun 17", h:"AUT", a:"JOR", score:[3,1], t:"11:00", v:"Santa Clara"},
   {md:"Jun 22", h:"ARG", a:"AUT", score:[2,0], t:"12:00", v:"Arlington"},
   {md:"Jun 22", h:"JOR", a:"ALG", score:[1,0], t:"10:00", v:"Santa Clara"},
   {md:"Jun 27", h:"ALG", a:"AUT", kc:true, t:"9:00", v:"Kansas City"},
   {md:"Jun 27", h:"JOR", a:"ARG", t:"9:00", v:"Arlington"},
 ]},
 {g:"K", teams:{POR:"Portugal", COD:"DR Congo", UZB:"Uzbekistan", COL:"Colombia"}, matches:[
   {md:"Jun 17", h:"POR", a:"COD", score:[1,1], t:"12:00", v:"Houston"},
   {md:"Jun 17", h:"COL", a:"UZB", score:[3,1], t:"8:00", v:"Mexico City"},
   {md:"Jun 23", h:"POR", a:"UZB", score:[5,0], t:"12:00", v:"Houston"},
   {md:"Jun 23", h:"COL", a:"COD", score:[0,0], t:"9:00", v:"Guadalajara"},
   {md:"Jun 27", h:"COL", a:"POR", t:"6:30", v:"Miami"},
   {md:"Jun 27", h:"COD", a:"UZB", t:"6:30", v:"Atlanta"},
 ]},
 {g:"L", teams:{ENG:"England", CRO:"Croatia", GHA:"Ghana", PAN:"Panama"}, tag:"England's group", matches:[
   {md:"Jun 17", h:"ENG", a:"CRO", score:[4,2], t:"3:00", v:"Arlington"},
   {md:"Jun 17", h:"GHA", a:"PAN", score:[1,0], t:"6:00", v:"Toronto"},
   {md:"Jun 23", h:"ENG", a:"GHA", score:[0,0], t:"3:00", v:"Foxborough"},
   {md:"Jun 23", h:"PAN", a:"CRO", score:[0,1], t:"6:00", v:"Toronto"},
   {md:"Jun 27", h:"PAN", a:"ENG", t:"4:00", v:"East Rutherford"},
   {md:"Jun 27", h:"CRO", a:"GHA", t:"4:00", v:"Philadelphia"},
 ]},
];
