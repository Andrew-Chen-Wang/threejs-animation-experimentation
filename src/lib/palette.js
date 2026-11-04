import * as THREE from 'three';
// Colour has a job, not a mood:
//   p1   = plane 1 (everything that belongs to the first flyover)
//   p2   = plane 2 (the second flyover, 920 s later)
//   red  = the answer / a match / the thing to look at right now
//   ink, mid, grey = everything else
export const P = {
  paper: '#ebe5d8',
  paper2: '#e2dbcb',
  paperLight: '#f4f0e7',
  sky: '#e8e4da',
  line: '#bdb3a0',
  ink: '#23201c',
  mid: '#8a8378',
  grey: '#a8a194',
  light: '#cfc7b6',
  red: '#c23a2c',
  dark: '#121110',
  p1: '#2f6690',       // slate blue on paper
  p2: '#b4791c',       // ochre on paper
  p1Glow: '#86c0ea',   // the same hues, brightened for dark spectrograms
  p2Glow: '#f2bd5a',
};
export const C = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, new THREE.Color(v)]));
