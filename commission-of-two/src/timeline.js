// Shot list, cut to the narration's word timings (src/words.json).
import { hall, absent, members, count, vanish, roster, skip, formation, carpet, roundTable, seven, advisers, hero } from './scenes/clay.js';
import { doc, passed, org, cmc, terms } from './scenes/docs.js';

const S = [];
const at = (start, name, build, opts) => S.push({ start, name, build, opts });

at(0, 'hall', hall);
at(5.76, 'absent', absent);
at(7.84, 'members', members);
at(12.72, 'count', count);
at(22.93, 'vanish', vanish);
at(27.96, 'roster', roster);
at(34.96, 'votes', doc, { seed: 3, dim: 0.55, items: [
  { lines: [{ t: '候补委员名单  2022', cls: 'rule' }], y: 560, at: 35.0 },
  { lines: [{ t: '（[[按得票多少为序排列]]，', cls: 'doc lg' }], y: 660, at: 35.2 },
  { lines: [{ t: 'IN ORDER OF VOTES RECEIVED', cls: 'ghost' }], y: 760, at: 35.6 },
] });
at(36.84, 'skip', skip);
at(41.68, 'passed', passed);
at(45.64, 'expelled', doc, { seed: 5, dim: 0.5, items: [
  { lines: [{ t: '五中全会  开除党籍 EXPELLED', cls: 'rule' }], y: 560, at: 45.7 },
  { lines: [{ t: '…金东寒、[[方红卫]]、[[方永祥]]开除党籍处分，', cls: 'doc' }], y: 650, at: 45.9 },
], counters: [{ at: 46.52, val: '33', sub: 'EXPELLED AT ONE MEETING', y: 820 }] });
at(49.2, 'zyx', hero, { military: true, seed: 2, credit: 'ILLUSTRATIVE FIGURE', chips: [
  { lines: ['ZHANG YOUXIA 张又侠'], at: 49.44, y: 1110 },
  { lines: ['GENERAL, BORN 1950'], at: 50.8, y: 1180 },
  { lines: ['中央军委副主席  CMC VICE CHAIRMAN'], at: 52.6, y: 1250 },
] });
at(54.28, 'nyt', doc, { seed: 9, dim: 0.5, items: [
  { lines: [{ t: '中央社  MAY 12th, 2026', cls: 'rule' }], y: 600, at: 54.3 },
  { lines: [{ t: '張又俠遭清洗 [[紐時]]：因反對習近平拔擢張升民', cls: 'doc' }], y: 690, at: 54.5 },
  { lines: [{ t: '紐時 THE NEW YORK TIMES', cls: 'ghost' }], y: 780, at: 55.0 },
  { lines: [{ t: '一次分歧  ONE DISAGREEMENT', cls: 'red' }], y: 880, at: 57.7 },
] });
at(58.56, 'xi', hero, { military: false, podium: true, seed: 4, color: 0x262626, credit: 'ILLUSTRATIVE FIGURE', chips: [
  { lines: ['习近平 XI JINPING'], at: 58.7, y: 1110 },
  { lines: ['中央军委主席  CMC CHAIRMAN'], at: 59.3, y: 1180 },
] });
at(61.0, 'zsm', hero, { military: true, seed: 6, color: 0x333333, credit: 'ILLUSTRATIVE FIGURE', chips: [
  { lines: ['ZHANG SHENGMIN 张升民'], at: 61.0, y: 1110 },
  { lines: ['军委纪委书记  CMC DISCIPLINE CHIEF'], at: 61.8, y: 1180 },
] });
at(63.48, 'org', org, { phase: 'arrive' });
at(66.48, 'ranks', formation, { view: 'low' });
at(67.88, 'objected', org, { phase: 'objected' });
at(69.56, 'carpet', carpet);
at(75.2, 'march', formation, { view: 'march' });
at(78.4, 'quote', doc, { seed: 15, dim: 0.5, items: [
  { lines: [{ t: '中央社  MAY 12th, 2026', cls: 'rule' }], y: 560, at: 78.4 },
  { lines: [{ t: '前美國政府情報官員張克斯（Christopher K. Johnson）', cls: 'doc' }], y: 650, at: 78.5 },
  { lines: [{ t: '「張又俠以為憑自己的[[資歷]]可以說這話，', cls: 'doc' }], y: 740, at: 79.0 },
  { lines: [{ t: '結果證明並非如此」', cls: 'doc' }], y: 820, at: 81.76 },
  { lines: [{ t: '資歷 SENIORITY', cls: 'ghost' }], y: 910, at: 79.5 },
] });
at(82.52, 'filled', org, { phase: 'filled' });
at(84.28, 'probe', doc, { seed: 19, dim: 0.5, items: [
  { lines: [{ t: '国防部  JAN 24th, 2026', cls: 'rule' }], y: 600, at: 84.3 },
  { lines: [{ t: '研究，决定对张又侠、刘振立[[立案审查调查]]。', cls: 'doc' }], y: 690, at: 84.9 },
  { lines: [{ t: 'PLACED UNDER INVESTIGATION', cls: 'ghost' }], y: 790, at: 86.0 },
] });
at(87.36, 'charges', doc, { seed: 21, dim: 0.5, items: [
  { lines: [{ t: '严重违反政治纪律和政治规矩，[[搞团团伙伙]]', cls: 'doc' }], y: 640, at: 87.4 },
  { lines: [{ t: 'CLIQUES', cls: 'ghost' }], y: 720, at: 88.2 },
  { lines: [{ t: '利用职务便利为他人职务晋升提供帮助，[[收受巨额钱款]]', cls: 'doc' }], y: 810, at: 89.3 },
  { lines: [{ t: 'HUGE SUMS FOR PROMOTIONS', cls: 'ghost' }], y: 890, at: 90.0 },
] });
at(92.0, 'plenum5', doc, { seed: 23, dim: 0.5, items: [
  { lines: [{ t: '五中全会公报  OCT 29th, 2026', cls: 'rule' }], y: 560, at: 92.0 },
  { lines: [{ t: '…之前作出的给予马兴瑞、[[张又侠]]、刘振立…', cls: 'doc' }], y: 650, at: 93.3 },
  { lines: [{ t: '全会增选[[张升民]]为中央政治局委员。', cls: 'doc' }], y: 740, at: 95.6 },
  { lines: [{ t: '增选 ADDED TO THE POLITBURO', cls: 'ghost' }], y: 830, at: 96.6 },
] });
at(98.28, 'politburo', roundTable, { view: 'ring' });
at(101.12, 'officer', roundTable, { view: 'officer' });
at(103.96, 'since', roundTable, { view: 'since' });
at(106.32, 'cmc2022', cmc, {});
at(110.4, 'seven', seven);
at(112.88, 'two', cmc, { after: true });
at(115.64, 'short', formation, { view: 'aerial', chips: [
  { lines: ['SHORT TERM'], at: 115.8, y: 260 },
  { lines: ['TAIWAN MOVE  RISKIER'], at: 117.5, y: 340 },
  { lines: [{ t: '“a high command in disarray,”', cls: 'quote' }], at: 119.4, y: 440 },
] });
at(120.93, 'thomas', hero, { military: false, seed: 9, color: 0x2a2a2a, credit: 'ILLUSTRATIVE FIGURE', chips: [
  { lines: ['NEIL THOMAS'], at: 121.0, y: 1110 },
  { lines: ['ASIA SOCIETY POLICY INSTITUTE'], at: 121.6, y: 1180 },
  { lines: [{ t: 'AP  JAN 26th, 2026', cls: 'sm' }], at: 123.3, y: 1250 },
] });
at(124.69, 'long', formation, { view: 'march', chips: [
  { lines: ['LONG TERM'], at: 124.8, y: 260 },
  { lines: [{ t: '“a more loyal and less corrupt leadership', cls: 'quote' }], at: 126.4, y: 340 },
  { lines: [{ t: 'with more military capabilities,”', cls: 'quote' }], at: 128.3, y: 420 },
  { lines: [{ t: 'AP  JAN 26th, 2026', cls: 'sm' }], at: 129.0, y: 500 },
] });
at(129.85, 'terms', terms);
at(132.61, 'advisers', advisers);
at(137.29, 'finale', hall, { finale: true });

export const SHOTS = S.map((s, i) => ({ ...s, end: S[i + 1] ? S[i + 1].start : 139.85 }));
