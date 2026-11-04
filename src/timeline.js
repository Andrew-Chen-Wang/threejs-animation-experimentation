import intro from './scenes/intro.js';
import america from './scenes/america.js';
import pole from './scenes/pole.js';
import cctv from './scenes/cctv.js';
import doppler from './scenes/doppler.js';
import map from './scenes/map.js';
import shape from './scenes/shape.js';
import trap from './scenes/trap.js';
import match from './scenes/match.js';
import harder from './scenes/harder.js';
import country from './scenes/country.js';
import squares from './scenes/squares.js';
import street from './scenes/street.js';
import hide from './scenes/hide.js';
import voice from './scenes/voice.js';
import phone from './scenes/phone.js';
import colsto from './scenes/colsto.js';
import { sky, globe, finale } from './scenes/outro.js';

// Scene windows in narration seconds. `trans` = transition INTO the scene (centered on `start`).
const D = (dur = 0.6) => ({ dur, type: 'dissolve' });
const SL = (dur = 0.7) => ({ dur, type: 'slide' });
export const SCENES = [
  { name: 'intro', start: 0, end: 9.0, build: intro },
  { name: 'america', start: 9.0, end: 14.9, build: america, trans: D(0.7) },
  { name: 'pole', start: 14.9, end: 18.6, build: pole, trans: D(0.5) },
  { name: 'cctv', start: 18.6, end: 36.4, build: cctv, trans: D(0.5) },
  { name: 'doppler', start: 36.4, end: 52.9, build: doppler, trans: D(0.6) },
  { name: 'map', start: 52.9, end: 92.2, build: map, trans: D(0.6) },
  { name: 'shape', start: 92.2, end: 104.2, build: shape, trans: D(0.6) },
  { name: 'trap', start: 104.2, end: 112.9, build: trap, trans: D(0.6) },
  { name: 'match', start: 112.9, end: 120.7, build: match, trans: D(0.6) },
  { name: 'harder', start: 120.7, end: 126.4, build: harder, trans: D(0.5) },
  { name: 'country', start: 126.4, end: 130.0, build: country, trans: D(0.5) },
  { name: 'squares', start: 130.0, end: 138.3, build: squares, trans: D(0.6) },
  { name: 'street', start: 138.3, end: 143.6, build: street, trans: D(0.6) },
  { name: 'hide', start: 143.6, end: 151.1, build: hide, trans: SL(0.7) },
  { name: 'voice', start: 151.1, end: 156.2, build: voice, trans: D(0.4) },
  { name: 'phone', start: 156.2, end: 158.9, build: phone, trans: D(0.4) },
  { name: 'colsto', start: 158.9, end: 170.2, build: colsto, trans: SL(0.7) },
  { name: 'sky', start: 170.2, end: 172.9, build: sky, trans: D(0.7) },
  { name: 'globe', start: 172.9, end: 175.5, build: globe, trans: D(0.6) },
  { name: 'finale', start: 175.5, end: 200, build: finale, trans: D(0.5) },
];
