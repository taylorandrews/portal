/* ============================================================
   EDIT HERE TO UPDATE.
   For each match, add  score:[home,away]  once it's played.
   Leave score out (or null) for a fixture not yet played.
   kc:true  marks a Kansas City (Arrowhead) match.
   ============================================================ */
export const AS_OF = "Updated June 20, 2026 — through June 19 matches";

export const DATA = [
 {g:"A", teams:{MEX:"Mexico", RSA:"South Africa", KOR:"South Korea", CZE:"Czechia"}, matches:[
   {md:"Jun 11", h:"MEX", a:"RSA", score:[2,0]},
   {md:"Jun 11", h:"KOR", a:"CZE", score:[2,1]},
   {md:"Jun 18", h:"CZE", a:"RSA", score:[1,1]},
   {md:"Jun 18", h:"MEX", a:"KOR", score:[1,0]},
   {md:"Jun 24", h:"CZE", a:"MEX"},
   {md:"Jun 24", h:"RSA", a:"KOR"},
 ]},
 {g:"B", teams:{CAN:"Canada", BIH:"Bosnia & Herz.", QAT:"Qatar", SUI:"Switzerland"}, matches:[
   {md:"Jun 12", h:"CAN", a:"BIH", score:[1,1]},
   {md:"Jun 13", h:"QAT", a:"SUI", score:[1,1]},
   {md:"Jun 18", h:"SUI", a:"BIH", score:[4,1]},
   {md:"Jun 18", h:"CAN", a:"QAT", score:[6,0]},
   {md:"Jun 24", h:"SUI", a:"CAN"},
   {md:"Jun 24", h:"BIH", a:"QAT"},
 ]},
 {g:"C", teams:{BRA:"Brazil", MAR:"Morocco", HAI:"Haiti", SCO:"Scotland"}, matches:[
   {md:"Jun 13", h:"BRA", a:"MAR", score:[1,1]},
   {md:"Jun 13", h:"SCO", a:"HAI", score:[1,0]},
   {md:"Jun 19", h:"SCO", a:"MAR", score:[0,1]},
   {md:"Jun 19", h:"BRA", a:"HAI", score:[3,0]},
   {md:"Jun 24", h:"SCO", a:"BRA"},
   {md:"Jun 24", h:"MAR", a:"HAI"},
 ]},
 {g:"D", teams:{USA:"United States", PAR:"Paraguay", AUS:"Australia", TUR:"Türkiye"}, tag:"USA's group", matches:[
   {md:"Jun 12", h:"USA", a:"PAR", score:[4,1]},
   {md:"Jun 13", h:"AUS", a:"TUR", score:[2,0]},
   {md:"Jun 19", h:"USA", a:"AUS", score:[2,0]},
   {md:"Jun 19", h:"TUR", a:"PAR", score:[0,1]},
   {md:"Jun 25", h:"TUR", a:"USA"},
   {md:"Jun 25", h:"PAR", a:"AUS"},
 ]},
 {g:"E", teams:{GER:"Germany", CUW:"Curaçao", CIV:"Ivory Coast", ECU:"Ecuador"}, kcNote:"1× in KC", matches:[
   {md:"Jun 14", h:"GER", a:"CUW", score:[7,1]},
   {md:"Jun 14", h:"CIV", a:"ECU", score:[1,0]},
   {md:"Jun 20", h:"GER", a:"CIV"},
   {md:"Jun 20", h:"ECU", a:"CUW", kc:true},
   {md:"Jun 25", h:"ECU", a:"GER"},
   {md:"Jun 25", h:"CUW", a:"CIV"},
 ]},
 {g:"F", teams:{NED:"Netherlands", JPN:"Japan", SWE:"Sweden", TUN:"Tunisia"}, kcNote:"1× in KC", matches:[
   {md:"Jun 14", h:"NED", a:"JPN", score:[2,2]},
   {md:"Jun 14", h:"SWE", a:"TUN", score:[5,1]},
   {md:"Jun 20", h:"NED", a:"SWE"},
   {md:"Jun 20", h:"TUN", a:"JPN"},
   {md:"Jun 25", h:"JPN", a:"SWE"},
   {md:"Jun 25", h:"TUN", a:"NED", kc:true},
 ]},
 {g:"G", teams:{BEL:"Belgium", EGY:"Egypt", IRN:"Iran", NZL:"New Zealand"}, matches:[
   {md:"Jun 15", h:"BEL", a:"EGY", score:[1,1]},
   {md:"Jun 15", h:"IRN", a:"NZL", score:[2,2]},
   {md:"Jun 21", h:"BEL", a:"IRN"},
   {md:"Jun 21", h:"NZL", a:"EGY"},
   {md:"Jun 26", h:"EGY", a:"IRN"},
   {md:"Jun 26", h:"NZL", a:"BEL"},
 ]},
 {g:"H", teams:{ESP:"Spain", CPV:"Cabo Verde", KSA:"Saudi Arabia", URU:"Uruguay"}, matches:[
   {md:"Jun 15", h:"ESP", a:"CPV", score:[0,0]},
   {md:"Jun 15", h:"KSA", a:"URU", score:[1,1]},
   {md:"Jun 21", h:"ESP", a:"KSA"},
   {md:"Jun 21", h:"URU", a:"CPV"},
   {md:"Jun 26", h:"CPV", a:"KSA"},
   {md:"Jun 26", h:"URU", a:"ESP"},
 ]},
 {g:"I", teams:{FRA:"France", SEN:"Senegal", IRQ:"Iraq", NOR:"Norway"}, matches:[
   {md:"Jun 16", h:"FRA", a:"SEN", score:[3,1]},
   {md:"Jun 16", h:"NOR", a:"IRQ", score:[4,1]},
   {md:"Jun 22", h:"FRA", a:"IRQ"},
   {md:"Jun 22", h:"NOR", a:"SEN"},
   {md:"Jun 26", h:"NOR", a:"FRA"},
   {md:"Jun 26", h:"SEN", a:"IRQ"},
 ]},
 {g:"J", teams:{ARG:"Argentina", ALG:"Algeria", AUT:"Austria", JOR:"Jordan"}, kcNote:"2× in KC", matches:[
   {md:"Jun 16", h:"ARG", a:"ALG", score:[3,0], kc:true},
   {md:"Jun 17", h:"AUT", a:"JOR", score:[3,1]},
   {md:"Jun 22", h:"ARG", a:"AUT"},
   {md:"Jun 22", h:"JOR", a:"ALG"},
   {md:"Jun 27", h:"ALG", a:"AUT", kc:true},
   {md:"Jun 27", h:"JOR", a:"ARG"},
 ]},
 {g:"K", teams:{POR:"Portugal", COD:"DR Congo", UZB:"Uzbekistan", COL:"Colombia"}, matches:[
   {md:"Jun 17", h:"POR", a:"COD", score:[1,1]},
   {md:"Jun 17", h:"COL", a:"UZB", score:[3,1]},
   {md:"Jun 23", h:"POR", a:"UZB"},
   {md:"Jun 23", h:"COL", a:"COD"},
   {md:"Jun 27", h:"COL", a:"POR"},
   {md:"Jun 27", h:"COD", a:"UZB"},
 ]},
 {g:"L", teams:{ENG:"England", CRO:"Croatia", GHA:"Ghana", PAN:"Panama"}, tag:"England's group", matches:[
   {md:"Jun 17", h:"ENG", a:"CRO", score:[4,2]},
   {md:"Jun 17", h:"GHA", a:"PAN", score:[1,0]},
   {md:"Jun 23", h:"ENG", a:"GHA"},
   {md:"Jun 23", h:"PAN", a:"CRO"},
   {md:"Jun 27", h:"PAN", a:"ENG"},
   {md:"Jun 27", h:"CRO", a:"GHA"},
 ]},
];
