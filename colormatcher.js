// Color conversion utilities
function hexToHsl(hex) {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  h = h % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

// Color scheme generators
function generateComplementary(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [hslToHex((h + 180) % 360, s, l)];
}

function generateAnalogous(hex, numberOfColors = 5, angleStep = 30) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const half = Math.floor(numberOfColors / 2);
  for(let i = -half; i <= half; i++) {
    if(i === 0) continue;
    const hue = (h + i * angleStep + 360) % 360;
    colors.push(hslToHex(hue, s, l));
  }
  return colors;
}

function generateTriadic(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [
    hslToHex((h + 120) % 360, s, l),
    hslToHex((h + 240) % 360, s, l)
  ];
}

function generateSplitComplementary(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [
    hslToHex((h + 150) % 360, s, l),
    hslToHex((h + 210) % 360, s, l)
  ];
}

function generateTetradic(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [
    hslToHex((h + 90) % 360, s, l),
    hslToHex((h + 180) % 360, s, l),
    hslToHex((h + 270) % 360, s, l)
  ];
}

function generateSquare(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [
    hslToHex((h + 90) % 360, s, l),
    hslToHex((h + 180) % 360, s, l),
    hslToHex((h + 270) % 360, s, l)
  ];
}

function generateMonochromatic(hex, variations = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const step = 100 / (variations + 1);
  for(let i = 1; i <= variations; i++) {
    let newL = (l + step * i) % 100;
    colors.push(hslToHex(h, s, newL));
  }
  return colors;
}

function generatePastel(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const colors = [];
  for(let i = 0; i < variations; i++) {
    colors.push(hslToHex((h + i * (360 / variations)) % 360, 40, 85));
  }
  return colors;
}

function generateEarthTones(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const earthSaturation = [30, 35, 40, 25, 20];
  const earthLightness = [25, 30, 35, 40, 45];
  const colors = [];
  for(let i = 0; i < variations; i++) {
    colors.push(hslToHex((h + i * 30) % 360, earthSaturation[i % earthSaturation.length], earthLightness[i % earthLightness.length]));
  }
  return colors;
}

function generateWarm(hex, variations = 5) {
  const [h, , l] = hexToHsl(hex);
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (h + i * 10 + 10) % 60; // Keep hues in red-orange-yellow
    colors.push(hslToHex(hue, 80, l));
  }
  return colors;
}

function generateCool(hex, variations = 5) {
  const [h, , l] = hexToHsl(hex);
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (h + 180 + i * 10) % 360; // Rotate toward blue/green/purple range
    colors.push(hslToHex(hue, 70, l));
  }
  return colors;
}

function generateHighKey(hex, variations = 5) {
  const [h, s, ] = hexToHsl(hex);
  const colors = [];
  const startL = 75;
  const endL = 95;
  for(let i = 0; i < variations; i++) {
    const l = startL + (i * (endL - startL)) / (variations - 1);
    colors.push(hslToHex(h, s, l));
  }
  return colors;
}

function generateLowKey(hex, variations = 5) {
  const [h, s, ] = hexToHsl(hex);
  const colors = [];
  const startL = 5;
  const endL = 25;
  for(let i = 0; i < variations; i++) {
    const l = startL + (i * (endL - startL)) / (variations - 1);
    colors.push(hslToHex(h, s, l));
  }
  return colors;
}

function generateGradient(hex, endOffset = 120, steps = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const endHue = (h + endOffset) % 360;
  for(let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const interpHue = (h * (1 - t) + endHue * t) % 360;
    const interpL = l * (1 - t) + (90 * t);
    colors.push(hslToHex(interpHue, s, interpL));
  }
  return colors;
}

function generateAchromatic(variations = 5) {
  const colors = [];
  const step = 100 / (variations + 1);
  for(let i = 1; i <= variations; i++) {
    colors.push(hslToHex(0, 0, step * i));
  }
  return colors;
}

function generateAccentedNeutral(hex, neutrals = 4) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const step = 70 / (neutrals + 1);
  for(let i = 1; i <= neutrals; i++) {
    colors.push(hslToHex(h, 5, step * i + 15));
  }
  colors.push(hex);
  return colors;
}

function generateCompound(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [
    hslToHex((h - 30 + 360) % 360, s, l),
    hslToHex((h + 30) % 360, s, l),
    hslToHex((h + 180) % 360, s, l),
    hslToHex((h + 150) % 360, s, l),
    hslToHex((h + 210) % 360, s, l)
  ];
}

function generateFauvist(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const colors = [];
  for(let i = 0; i < variations; i++) {
    colors.push(hslToHex((h + i * 72) % 360, 100, 60));
  }
  return colors;
}

function generateAutumnColors(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const sat = 60;
  const light = 45;
  const hues = [h, h + 10, h + 20, h - 10, h - 20].map(v => (v + 360) % 360);
  return hues.slice(0, variations).map(hue => hslToHex(hue, sat, light));
}

function generateSpringColors(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (h + i * 30) % 360;
    colors.push(hslToHex(hue, 60, 80)); // medium saturation, high light
  }
  return colors;
}

function generateSummerColors(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (h + i * 25) % 360;
    colors.push(hslToHex(hue, 40, 70)); // lower saturation, soft light
  }
  return colors;
}

function generateWinterColors(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (h + i * 72) % 360;
    colors.push(hslToHex(hue, 85, 45)); // bold saturation, darker tones
  }
  return colors;
}

function generateRetro50s(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const retroSaturation = [60, 65, 70, 55, 60];
  const retroLightness = [70, 65, 80, 75, 70];
  const retroOffsets = [0, 30, -45, 60, -30];
  const colors = [];
  for(let i = 0; i < variations; i++) {
    const hue = (h + retroOffsets[i % retroOffsets.length] + 360) % 360;
    colors.push(hslToHex(hue, retroSaturation[i % retroSaturation.length], retroLightness[i % retroLightness.length]));
  }
  return colors;
}

function generateDiscordant(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [
    hslToHex((h + 165) % 360, s, l),
    hslToHex((h + 195) % 360, s, l)
  ];
}

function generateMetallic(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [
    hex, // user input
    hslToHex((h + 45) % 360, 30, 50), // gold-ish
    hslToHex((h + 90) % 360, 5, 70),  // silver-ish
    hslToHex((h + 25) % 360, 40, 35)  // bronze-ish
  ];
}

function generateGradientExtended(hex, steps = 7) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const endHue = (h + 180) % 360;
  for(let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    colors.push(hslToHex((h * (1 - t) + endHue * t) % 360, s, l));
  }
  return colors;
}

function generateOpticalMix(hex) {
  const [h, s, l] = hexToHsl(hex);
  return [
    hex,
    hslToHex((h + 180) % 360, s, l)
  ];
}

function generateAccessible(hex) {
  const [h, , l] = hexToHsl(hex);
  const highContrastL = l < 50 ? 95 : 5;
  return [
    hex,
    hslToHex(h, 10, highContrastL)
  ];
}

function generatePsychologyCalm(hex) {
  const [h, , ] = hexToHsl(hex);
  return [
    hslToHex(h, 40, 80),
    hslToHex(h, 30, 70),
    hslToHex((h + 30) % 360, 35, 65)
  ];
}

function generateRelaxingColors(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const baseHue = (h + 180) % 360; // shift toward cool hues
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (baseHue + i * 15) % 360;
    colors.push(hslToHex(hue, 30, 75)); // soft light and saturation
  }
  return colors;
}

function generateEnergeticColors(hex, variations = 5) {
  const [h, , ] = hexToHsl(hex);
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (h + i * 60) % 360;
    colors.push(hslToHex(hue, 100, 60)); // high sat, balanced light
  }
  return colors;
}

function generatePolychromatic(hex, variations = 6) {
  const [, s, l] = hexToHsl(hex);
  const colors = [];
  for(let i = 1; i <= variations; i++) {
    colors.push(hslToHex((i * 360 / variations) % 360, s, l));
  }
  return colors;
}

// Event handlers and UI updates
function showReferenceSwatch(hex) {
  const referenceRow = document.getElementById('referenceRow');
  referenceRow.innerHTML = '';
  const swatch = document.createElement('div');
  swatch.className = 'swatch';
  swatch.innerHTML = `<div class="swatch-color" style="background:${hex}"></div><span class="swatch-hex">${hex}</span>`;
  swatch.onclick = function() {
    navigator.clipboard.writeText(hex);
    const hexSpan = swatch.querySelector('.swatch-hex');
    hexSpan.textContent = hex + ' ✓';
    setTimeout(() => { hexSpan.textContent = hex; }, 1000);
  };
  referenceRow.appendChild(swatch);
}

function updateSwatches(hex, scheme) {
  const swatchRow = document.getElementById('swatchRow');
  swatchRow.innerHTML = '';
  let n = colorCount[scheme] || 5;
  let colors = [];
  
  switch (scheme) {
    case 'complementary':
      colors = generateComplementary(hex);
      break;
    case 'analogous':
      colors = generateAnalogous(hex, n);
      break;
    case 'triadic':
      colors = generateTriadic(hex);
      break;
    case 'split-complementary':
      colors = generateSplitComplementary(hex);
      break;
    case 'tetradic':
      colors = generateTetradic(hex);
      break;
    case 'square':
      colors = generateSquare(hex);
      break;
    case 'monochromatic':
      colors = generateMonochromatic(hex, n);
      break;
    case 'pastel':
      colors = generatePastel(hex, n);
      break;
    case 'earth':
      colors = generateEarthTones(hex, n);
      break;
    case 'warm':
      colors = generateWarm(hex, n);
      break;
    case 'cool':
      colors = generateCool(hex, n);
      break;
    case 'highkey':
      colors = generateHighKey(hex, n);
      break;
    case 'lowkey':
      colors = generateLowKey(hex, n);
      break;
    case 'gradient':
      colors = generateGradient(hex, 120, n);
      break;
    case 'achromatic':
      colors = generateAchromatic(n);
      break;
    case 'accented-neutral':
      colors = generateAccentedNeutral(hex);
      break;
    case 'compound':
      colors = generateCompound(hex);
      break;
    case 'fauvist':
      colors = generateFauvist(hex, n);
      break;
    case 'autumn':
      colors = generateAutumnColors(hex, n);
      break;
    case 'spring':
      colors = generateSpringColors(hex, n);
      break;
    case 'summer':
      colors = generateSummerColors(hex, n);
      break;
    case 'winter':
      colors = generateWinterColors(hex, n);
      break;
    case 'retro50s':
      colors = generateRetro50s(hex, n);
      break;
    case 'discordant':
      colors = generateDiscordant(hex);
      break;
    case 'metallic':
      colors = generateMetallic(hex);
      break;
    case 'gradient-extended':
      colors = generateGradientExtended(hex);
      break;
    case 'optical-mix':
      colors = generateOpticalMix(hex);
      break;
    case 'accessible':
      colors = generateAccessible(hex);
      break;
    case 'psychology-calm':
      colors = generatePsychologyCalm(hex);
      break;
    case 'relaxing':
      colors = generateRelaxingColors(hex, n);
      break;
    case 'energetic':
      colors = generateEnergeticColors(hex, n);
      break;
    case 'polychromatic':
      colors = generatePolychromatic(hex, n);
      break;
    default:
      colors = [hex];
  }

  colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.innerHTML = `<div class="swatch-color" style="background:${color}"></div><span class="swatch-hex">${color}</span>`;
    swatch.onclick = function() {
      navigator.clipboard.writeText(color);
      const hexSpan = swatch.querySelector('.swatch-hex');
      hexSpan.textContent = color + ' ✓';
      setTimeout(() => { hexSpan.textContent = color; }, 1000);
    };
    swatchRow.appendChild(swatch);
  });
}

// Number of colors to generate for each scheme
const colorCount = {
  'complementary': 2,
  'analogous': 5,
  'triadic': 3,
  'split-complementary': 3,
  'tetradic': 4,
  'square': 4,
  'monochromatic': 5,
  'pastel': 5,
  'earth': 5,
  'warm': 5,
  'cool': 5,
  'highkey': 5,
  'lowkey': 5,
  'gradient': 5,
  'achromatic': 5,
  'accented-neutral': 5,
  'compound': 5,
  'fauvist': 5,
  'autumn': 5,
  'spring': 5,
  'summer': 5,
  'winter': 5,
  'retro50s': 5,
  'discordant': 2,
  'metallic': 4,
  'gradient-extended': 7,
  'optical-mix': 2,
  'accessible': 2,
  'psychology-calm': 3,
  'relaxing': 5,
  'energetic': 5,
  'polychromatic': 6
};

// Initialize the color matcher
function initColorMatcher() {
  const colorPicker = document.getElementById('colorPicker');
  const hexInput = document.getElementById('hexInput');
  const schemeSelect = document.getElementById('schemeSelect');
  
  function updateAll() {
    const hex = colorPicker.value;
    hexInput.value = hex;
    showReferenceSwatch(hex);
    updateSwatches(hex, schemeSelect.value);
  }
  
  colorPicker.addEventListener('input', updateAll);
  hexInput.addEventListener('input', function() {
    const hex = this.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      colorPicker.value = hex;
      updateAll();
    }
  });
  schemeSelect.addEventListener('change', updateAll);
  
  // Initial update
  updateAll();
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initColorMatcher); 