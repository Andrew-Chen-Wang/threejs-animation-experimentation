import * as THREE from 'three';
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
};
export const C = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, new THREE.Color(v)]));
