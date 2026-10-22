// Original color computations, extracted without changing the classroom formulas.
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

export const CVD_MATRICES = {
  protanopia:   [[0.567, 0.433, 0.000], [0.558, 0.442, 0.000], [0.000, 0.242, 0.758]],
  deuteranopia: [[0.625, 0.375, 0.000], [0.700, 0.300, 0.000], [0.000, 0.300, 0.700]],
  tritanopia:   [[0.950, 0.050, 0.000], [0.000, 0.433, 0.567], [0.000, 0.475, 0.525]]
};

export function simulateCVD(rgb, type) {
  const m = CVD_MATRICES[type];
  const [r, g, b] = rgb;
  return [
    Math.round(Math.max(0, Math.min(255, r * m[0][0] + g * m[0][1] + b * m[0][2]))),
    Math.round(Math.max(0, Math.min(255, r * m[1][0] + g * m[1][1] + b * m[1][2]))),
    Math.round(Math.max(0, Math.min(255, r * m[2][0] + g * m[2][1] + b * m[2][2])))
  ];
}

const rgbStr = ([r, g, b]) => `rgb(${r},${g},${b})`;

// 5 大科研经典配色（7 色以内）
export const CLASSIC_PALETTES = {
  'Wong 2011':         ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'],
  'Paul Tol bright':   ['#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB'],
  'Paul Tol muted':    ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#CC6677', '#882255'],
  'Okabe-Ito':         ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'],
  'Tableau 10':        ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'],
  'Paired (12)':       ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#FFFF99', '#B15928'],
  'Viridis (seq)':     ['#440154', '#3B528B', '#21918C', '#5EC962', '#FDE725'],
  'Cividis (seq)':     ['#00224E', '#2C3F75', '#61678A', '#938B9A', '#C1AB80', '#E6CC65'],
  'RdBu (div)':        ['#67001F', '#D6604D', '#F4A582', '#FDFDFF', '#92C5DE', '#4393C3', '#053061']
};

