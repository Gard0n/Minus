export const cricketNumbers = [
  { key: "20", label: "20", value: 20 },
  { key: "19", label: "19", value: 19 },
  { key: "18", label: "18", value: 18 },
  { key: "17", label: "17", value: 17 },
  { key: "16", label: "16", value: 16 },
  { key: "15", label: "15", value: 15 },
  { key: "bull", label: "Bull", value: 25 },
];

export const dartValues = [
  20, 19, 18, 17, 16, 15, 14, 13, 12, 11,
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
  25, 0,
];

export const SUPABASE_URL = "https://qhpwwjogxawnxbvjsddt.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFocHd3am9neGF3bnhidmpzZGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTQ1OTIsImV4cCI6MjA4OTY5MDU5Mn0.jK_9ari6-WkA8yc3hXTyLmLUWIxGHlaNyFUIOl6viPU";
export const STORAGE_KEY = "minus_darts_v1";
export const THEME_KEY = "minus_theme";

export const defaultSettings = {
  defaultMode: "501",
  scoringMode: "live",
  doubleIn: false,
  doubleOut: true,
  bust: true,
  legsToWin: 1,
  setsToWin: 1,
  rankingWeights: { wins: 1, winrate: 1, avgTurn: 1, avgDart: 1 },
};

export const defaultGroupState = {
  players: [],
  matches: [],
  settings: defaultSettings,
  activeMatch: null,
  lastSetup: null,
  lastSummaryId: null,
  cloudGroupId: null,
};

export const CHECKOUT_TABLE = {
  170:"T20 T20 Bull", 167:"T20 T19 Bull", 164:"T20 T18 Bull",
  161:"T20 T17 Bull", 160:"T20 T20 D20", 158:"T20 T20 D19",
  157:"T20 T19 D20",  156:"T20 T20 D18", 155:"T20 T19 D19",
  154:"T20 T18 D20",  153:"T20 T19 D18", 152:"T20 T20 D16",
  151:"T20 T17 D20",  150:"T20 T18 D18", 149:"T20 T19 D16",
  148:"T20 T20 D14",  147:"T20 T17 D18", 146:"T20 T18 D16",
  145:"T20 T15 D20",  144:"T20 T20 D12", 143:"T20 T17 D16",
  142:"T20 T14 D20",  141:"T20 T19 D12", 140:"T20 T20 D10",
  139:"T20 T13 D20",  138:"T20 T18 D12", 137:"T20 T15 D16",
  136:"T20 T20 D8",   135:"T20 T15 D15", 134:"T20 T14 D16",
  133:"T20 T19 D8",   132:"T20 T16 D12", 131:"T20 T13 D16",
  130:"T20 T20 D5",   129:"T19 T16 D12", 128:"T20 T16 D10",
  127:"T20 T17 D8",   126:"T19 T19 D6",  125:"T20 T15 D10",
  124:"T20 T16 D8",   123:"T19 T16 D9",  122:"T18 T18 D7",
  121:"T20 T11 D14",  120:"T20 20 D20",  119:"T19 12 D20",
  118:"T20 18 D20",   117:"T20 17 D20",  116:"T20 16 D20",
  115:"T20 15 D20",   114:"T20 14 D20",  113:"T20 13 D20",
  112:"T20 12 D20",   111:"T20 11 D20",  110:"T20 D25",
  109:"T19 12 D20",   108:"T20 16 D16",  107:"T19 10 D20",
  106:"T20 14 D16",   105:"T20 13 D16",  104:"T18 18 D16",
  103:"T19 10 D18",   102:"T20 10 D16",  101:"T17 18 D16",
  100:"T20 D20",       99:"T19 10 D16",   98:"T20 D19",
   97:"T19 D20",       96:"T20 D18",      95:"T19 D19",
   94:"T18 D20",       93:"T19 D18",      92:"T20 D16",
   91:"T17 D20",       90:"T18 D18",      89:"T19 D16",
   88:"T20 D14",       87:"T17 D18",      86:"T18 D16",
   85:"T15 D20",       84:"T20 D12",      83:"T17 D16",
   82:"T14 D20",       81:"T19 D12",      80:"T20 D10",
   79:"T13 D20",       78:"T18 D12",      77:"T15 D16",
   76:"T20 D8",        75:"T15 D15",      74:"T14 D16",
   73:"T19 D8",        72:"T16 D12",      71:"T13 D16",
   70:"T10 D20",       69:"T19 D6",       68:"T20 D4",
   67:"T9 D20",        66:"T10 D18",      65:"T11 D16",
   64:"T16 D8",        63:"T13 D12",      62:"T10 D16",
   61:"T15 D8",        60:"20 D20",       59:"19 D20",
   58:"18 D20",        57:"17 D20",       56:"16 D20",
   55:"15 D20",        54:"14 D20",       53:"13 D20",
   52:"12 D20",        51:"11 D20",       50:"D25",
   49:"9 D20",         48:"16 D16",       47:"15 D16",
   46:"6 D20",         45:"13 D16",       44:"4 D20",
   43:"3 D20",         42:"10 D16",       41:"9 D16",
   40:"D20",           38:"D19",          36:"D18",
   34:"D17",           32:"D16",          30:"D15",
   28:"D14",           26:"D13",          24:"D12",
   22:"D11",           20:"D10",          18:"D9",
   16:"D8",            14:"D7",           12:"D6",
   10:"D5",             8:"D4",            6:"D3",
    4:"D2",             2:"D1",
};
