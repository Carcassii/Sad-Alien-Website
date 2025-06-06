// === CONFIGURE THIS: paste your Apps Script web app URL inside the quotes ===
const GOOGLE_SHEET_LOGGING_URL = "https://script.google.com/macros/s/AKfycbzuHGkySv9i6roLqw2RaWgkoCZ0AphdcTF7yTMQ8C5HfeiFJWaAI2ICpSO2uAWcHZ1-/exec";

// In-memory log array (optional fallback)
let hexCopyLog = [];

// On page load, try to restore any previously saved log from localStorage
(function loadExistingLog() {
  try {
    const json = localStorage.getItem("hexCopyLog");
    if (json) {
      hexCopyLog = JSON.parse(json);
    }
  } catch(e) {
    console.warn("Could not parse existing hexCopyLog:", e);
    hexCopyLog = [];
  }
})();

/**
 * Call this function whenever someone copies a hex code.
 * It does two things:
 *   1) pushes { hex, timestamp } into a local array + localStorage
 *   2) sends a POST to your Google Sheet's Apps Script endpoint
 */
function recordCopy(hex) {
  const entry = {
    hex: hex.toLowerCase(),
    timestamp: new Date().toISOString()
  };

  // === 1) Persist locally in case the network is offline ===
  hexCopyLog.push(entry);
  try {
    localStorage.setItem("hexCopyLog", JSON.stringify(hexCopyLog));
  } catch (ignore) {}

  // === 2) Send it to your Google Sheet via Apps Script ===
  fetch(GOOGLE_SHEET_LOGGING_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry)
  }).catch(err => {
    console.error("Failed to POST to Google Sheet:", err);
  });
}

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

// Color theory validation utilities
function validateComplementary(h1, h2) {
  // Complementary colors should be 180° apart
  return Math.abs((h1 - h2 + 360) % 360 - 180) < 1;
}

function validateAnalogous(hues) {
  // Analogous colors should be within 30° of each other
  const sorted = [...hues].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i] - sorted[i-1]) > 30) return false;
  }
  return true;
}

function validateTriadic(hues) {
  // Triadic colors should be 120° apart
  const sorted = [...hues].sort((a, b) => a - b);
  return Math.abs(sorted[1] - sorted[0] - 120) < 1 && 
         Math.abs(sorted[2] - sorted[1] - 120) < 1;
}

function validateSplitComplementary(h1, h2, h3) {
  // Split complementary should be base color and two colors 150° and 210° from it
  const angles = [150, 210];
  return angles.some(angle => 
    Math.abs((h2 - h1 + 360) % 360 - angle) < 1 &&
    Math.abs((h3 - h1 + 360) % 360 - (360 - angle)) < 1
  );
}

function validateTetradic(hues) {
  // Tetradic (rectangle) should have two pairs of complementary colors
  const sorted = [...hues].sort((a, b) => a - b);
  return validateComplementary(sorted[0], sorted[2]) && 
         validateComplementary(sorted[1], sorted[3]);
}

function validateSquare(hues) {
  // Square colors should be 90° apart
  const sorted = [...hues].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i] - sorted[i-1] - 90) > 1) return false;
  }
  return true;
}

// Additional validation utilities
function validateMonochromatic(hues, saturations, lightnesses) {
  // All hues should be the same
  const baseHue = hues[0];
  if (!hues.every(h => Math.abs(h - baseHue) < 1)) return false;
  
  // Saturation should be the same
  const baseSat = saturations[0];
  if (!saturations.every(s => Math.abs(s - baseSat) < 1)) return false;
  
  // Lightness should be different
  return lightnesses.some((l, i) => 
    lightnesses.some((l2, j) => i !== j && Math.abs(l - l2) > 5)
  );
}

function validatePastel(saturations, lightnesses) {
  // Pastels should have low saturation and high lightness
  return saturations.every(s => s <= 40) && 
         lightnesses.every(l => l >= 75);
}

function validateWarm(hues) {
  // Warm colors should be in the red-orange-yellow range (0-60°)
  return hues.every(h => h >= 0 && h <= 60);
}

function validateCool(hues) {
  // Cool colors should be in the green-blue-purple range (120-300°)
  return hues.every(h => h >= 120 && h <= 300);
}

// Additional validation utilities for seasonal and mood-based schemes
function validateAutumn(hues, saturations, lightnesses) {
  // Autumn colors should be in warm earth tones (0-60°)
  return hues.every(h => h >= 0 && h <= 60) &&
         saturations.every(s => s >= 40 && s <= 80) &&
         lightnesses.every(l => l >= 30 && l <= 70);
}

function validateSpring(hues, saturations, lightnesses) {
  // Spring colors should be fresh and light (60-180°)
  return hues.every(h => h >= 60 && h <= 180) &&
         saturations.every(s => s >= 50 && s <= 90) &&
         lightnesses.every(l => l >= 60 && l <= 90);
}

function validateSummer(hues, saturations, lightnesses) {
  // Summer colors should be cool and muted (180-300°)
  return hues.every(h => h >= 180 && h <= 300) &&
         saturations.every(s => s >= 30 && s <= 70) &&
         lightnesses.every(l => l >= 50 && l <= 80);
}

function validateWinter(hues, saturations, lightnesses) {
  // Winter colors should be cool and intense (240-360°)
  return hues.every(h => h >= 240 || h <= 60) &&
         saturations.every(s => s >= 60 && s <= 100) &&
         lightnesses.every(l => l >= 20 && l <= 60);
}

function validateHighKey(hues, saturations, lightnesses) {
  // High key colors should be light and bright
  return lightnesses.every(l => l >= 70) &&
         saturations.every(s => s >= 40);
}

function validateLowKey(hues, saturations, lightnesses) {
  // Low key colors should be dark and muted
  return lightnesses.every(l => l <= 40) &&
         saturations.every(s => s <= 60);
}

function validateNeon(hues, saturations, lightnesses) {
  // Neon colors should be highly saturated and bright
  return saturations.every(s => s >= 80) &&
         lightnesses.every(l => l >= 50 && l <= 70);
}

function validateRetro50s(hues, saturations, lightnesses) {
  // 50s retro colors should be pastel-like
  return saturations.every(s => s >= 30 && s <= 60) &&
         lightnesses.every(l => l >= 70 && l <= 90);
}

// Additional validation utilities for accessibility and remaining schemes
function validateAccessible(hues, saturations, lightnesses) {
  // Accessible colors should have good contrast
  // Check if any pair of colors has sufficient contrast (4.5:1 for normal text)
  for (let i = 0; i < lightnesses.length; i++) {
    for (let j = i + 1; j < lightnesses.length; j++) {
      const contrast = Math.abs(lightnesses[i] - lightnesses[j]);
      if (contrast < 30) return false; // Minimum contrast ratio
    }
  }
  return true;
}

function validateColorBlind(hues, saturations, lightnesses) {
  // Color blind friendly colors should be distinguishable by lightness
  // Check if each color has a unique lightness value
  const uniqueLightnesses = new Set(lightnesses.map(l => Math.round(l / 5) * 5));
  return uniqueLightnesses.size === lightnesses.length;
}

function validateDuotone(hues, saturations, lightnesses) {
  // Duotone should have two distinct colors with variations
  const baseHues = new Set(hues.map(h => Math.round(h / 30) * 30));
  return baseHues.size === 2;
}

function validateGradient(hues, saturations, lightnesses) {
  // Gradient should have smooth transitions
  // Check if adjacent colors have similar properties
  for (let i = 1; i < hues.length; i++) {
    const hueDiff = Math.abs(hues[i] - hues[i-1]);
    const satDiff = Math.abs(saturations[i] - saturations[i-1]);
    const lightDiff = Math.abs(lightnesses[i] - lightnesses[i-1]);
    
    if (hueDiff > 30 || satDiff > 20 || lightDiff > 20) return false;
  }
  return true;
}

function validateMetallic(hues, saturations, lightnesses) {
  // Metallic colors should have moderate saturation and varying lightness
  return saturations.every(s => s >= 20 && s <= 60) &&
         lightnesses.some((l, i) => lightnesses.some((l2, j) => 
           i !== j && Math.abs(l - l2) > 20
         ));
}

function validateVintage(hues, saturations, lightnesses) {
  // Vintage colors should be muted and warm
  return saturations.every(s => s <= 60) &&
         lightnesses.every(l => l >= 40 && l <= 80) &&
         hues.every(h => h >= 0 && h <= 60);
}

// Color scheme generators
function generateComplementary(hex) {
  const [h, s, l] = hexToHsl(hex);
  const complementary = hslToHex((h + 180) % 360, s, l);
  // Validate
  const [h2] = hexToHsl(complementary);
  if (!validateComplementary(h, h2)) {
    console.warn('Complementary color validation failed');
  }
  return [complementary];
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
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  if (!validateAnalogous([h, ...hues])) {
    console.warn('Analogous colors validation failed');
  }
  return colors;
}

function generateTriadic(hex) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [
    hslToHex((h + 120) % 360, s, l),
    hslToHex((h + 240) % 360, s, l)
  ];
  // Validate
  const hues = [h, ...colors.map(color => hexToHsl(color)[0])];
  if (!validateTriadic(hues)) {
    console.warn('Triadic colors validation failed');
  }
  return colors;
}

function generateSplitComplementary(hex) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [
    hslToHex((h + 150) % 360, s, l),
    hslToHex((h + 210) % 360, s, l)
  ];
  // Validate
  const hues = [h, ...colors.map(color => hexToHsl(color)[0])];
  if (!validateSplitComplementary(...hues)) {
    console.warn('Split complementary colors validation failed');
  }
  return colors;
}

function generateTetradic(hex) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [
    hslToHex((h + 60) % 360, s, l),
    hslToHex((h + 180) % 360, s, l),
    hslToHex((h + 240) % 360, s, l)
  ];
  // Validate
  const hues = [h, ...colors.map(color => hexToHsl(color)[0])];
  if (!validateTetradic(hues)) {
    console.warn('Tetradic colors validation failed');
  }
  return colors;
}

function generateSquare(hex) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [
    hslToHex((h + 90) % 360, s, l),
    hslToHex((h + 180) % 360, s, l),
    hslToHex((h + 270) % 360, s, l)
  ];
  // Validate
  const hues = [h, ...colors.map(color => hexToHsl(color)[0])];
  if (!validateSquare(hues)) {
    console.warn('Square colors validation failed');
  }
  return colors;
}

function generateMonochromatic(hex, variations = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const half = Math.floor(variations / 2);
  for (let i = -half; i <= half; i++) {
    const newL = Math.max(0, Math.min(100, l + i * 20));
    colors.push(hslToHex(h, s, newL));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateMonochromatic(hues, saturations, lightnesses)) {
    console.warn('Monochromatic colors validation failed');
  }
  return colors;
}

function generatePastel(hex, variations = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const pastelSaturation = Math.min(40, s * 0.6);
  const baseLightness = Math.max(80, l + 15);
  
  for (let i = 0; i < variations; i++) {
    const hueOffset = (i - (variations - 1) / 2) * 15;
    const hue = (h + hueOffset + 360) % 360;
    const lightness = baseLightness + (Math.random() * 10 - 5);
    const saturation = pastelSaturation + (Math.random() * 10 - 5);
    colors.push(hslToHex(hue, saturation, lightness));
  }
  // Validate
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validatePastel(saturations, lightnesses)) {
    console.warn('Pastel colors validation failed');
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
    const hue = (h + i * 10 + 10) % 60;
    colors.push(hslToHex(hue, 80, l));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  if (!validateWarm(hues)) {
    console.warn('Warm colors validation failed');
  }
  return colors;
}

function generateCool(hex, variations = 5) {
  const [h, , l] = hexToHsl(hex);
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (h + 180 + i * 10) % 360;
    colors.push(hslToHex(hue, 70, l));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  if (!validateCool(hues)) {
    console.warn('Cool colors validation failed');
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

function generateAutumn(hex, variations = 5) {
  const baseHue = 30; // Classic autumn orange
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (baseHue + i * 10) % 60;
    const saturation = 60 + (Math.random() * 20 - 10);
    const lightness = 50 + (Math.random() * 20 - 10);
    colors.push(hslToHex(hue, saturation, lightness));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateAutumn(hues, saturations, lightnesses)) {
    console.warn('Autumn colors validation failed');
  }
  return colors;
}

function generateSpring(hex, variations = 5) {
  const baseHue = 120; // Fresh green
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (baseHue + i * 20) % 120;
    const saturation = 70 + (Math.random() * 20 - 10);
    const lightness = 75 + (Math.random() * 15 - 5);
    colors.push(hslToHex(hue, saturation, lightness));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateSpring(hues, saturations, lightnesses)) {
    console.warn('Spring colors validation failed');
  }
  return colors;
}

function generateSummer(hex, variations = 5) {
  const baseHue = 200; // Cool blue
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (baseHue + i * 20) % 120;
    const saturation = 50 + (Math.random() * 20 - 10);
    const lightness = 65 + (Math.random() * 15 - 5);
    colors.push(hslToHex(hue, saturation, lightness));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateSummer(hues, saturations, lightnesses)) {
    console.warn('Summer colors validation failed');
  }
  return colors;
}

function generateWinter(hex, variations = 5) {
  const baseHue = 240; // Deep blue
  const colors = [];
  for (let i = 0; i < variations; i++) {
    const hue = (baseHue + i * 20) % 120;
    const saturation = 80 + (Math.random() * 20 - 10);
    const lightness = 40 + (Math.random() * 20 - 10);
    colors.push(hslToHex(hue, saturation, lightness));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateWinter(hues, saturations, lightnesses)) {
    console.warn('Winter colors validation failed');
  }
  return colors;
}

function generateRetro50s(hex, variations = 5) {
  // Classic 1950s color palette base hues
  const retroHues = [
    350,  // Pink
    30,   // Coral
    60,   // Yellow
    180,  // Turquoise
    210   // Sky Blue
  ];
  
  // Characteristic 50s pastel saturation and lightness
  const retroSaturation = 45;  // Moderate saturation
  const retroLightness = 75;   // High lightness for pastel effect
  
  const colors = [];
  for (let i = 0; i < variations; i++) {
    // Use predefined retro hues instead of offsets from input
    const hue = retroHues[i % retroHues.length];
    // Add slight variation to saturation and lightness for more natural look
    const sat = retroSaturation + (Math.random() * 10 - 5);  // ±5 variation
    const light = retroLightness + (Math.random() * 10 - 5); // ±5 variation
    colors.push(hslToHex(hue, sat, light));
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

function generateAccessible(hex, variations = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const baseLightness = l;
  
  for (let i = 0; i < variations; i++) {
    const lightness = baseLightness + (i * 20 - (variations * 10));
    colors.push(hslToHex(h, s, Math.max(0, Math.min(100, lightness))));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateAccessible(hues, saturations, lightnesses)) {
    console.warn('Accessible colors validation failed');
  }
  return colors;
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

function generateColorBlind(hex, variations = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const baseLightness = l;
  
  for (let i = 0; i < variations; i++) {
    const lightness = baseLightness + (i * 15 - (variations * 7.5));
    colors.push(hslToHex(h, s, Math.max(0, Math.min(100, lightness))));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateColorBlind(hues, saturations, lightnesses)) {
    console.warn('Color blind friendly colors validation failed');
  }
  return colors;
}

function generateDuotone(hex, variations = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  const secondHue = (h + 180) % 360;
  
  for (let i = 0; i < variations; i++) {
    const ratio = i / (variations - 1);
    const hue = (h * (1 - ratio) + secondHue * ratio) % 360;
    const lightness = l + (Math.random() * 20 - 10);
    colors.push(hslToHex(hue, s, Math.max(0, Math.min(100, lightness))));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateDuotone(hues, saturations, lightnesses)) {
    console.warn('Duotone colors validation failed');
  }
  return colors;
}

function generateGradient(hex, variations = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  
  for (let i = 0; i < variations; i++) {
    const ratio = i / (variations - 1);
    const hue = (h + ratio * 30) % 360;
    const saturation = s + (ratio * 20 - 10);
    const lightness = l + (ratio * 20 - 10);
    colors.push(hslToHex(hue, saturation, lightness));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateGradient(hues, saturations, lightnesses)) {
    console.warn('Gradient colors validation failed');
  }
  return colors;
}

function generateMetallic(hex, variations = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  
  for (let i = 0; i < variations; i++) {
    const hue = (h + i * 10) % 360;
    const saturation = 40 + (Math.random() * 20 - 10);
    const lightness = 50 + (Math.random() * 30 - 15);
    colors.push(hslToHex(hue, saturation, lightness));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateMetallic(hues, saturations, lightnesses)) {
    console.warn('Metallic colors validation failed');
  }
  return colors;
}

function generateVintage(hex, variations = 5) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  
  for (let i = 0; i < variations; i++) {
    const hue = (h + i * 10) % 60;
    const saturation = 40 + (Math.random() * 20 - 10);
    const lightness = 60 + (Math.random() * 20 - 10);
    colors.push(hslToHex(hue, saturation, lightness));
  }
  // Validate
  const hues = colors.map(color => hexToHsl(color)[0]);
  const saturations = colors.map(color => hexToHsl(color)[1]);
  const lightnesses = colors.map(color => hexToHsl(color)[2]);
  if (!validateVintage(hues, saturations, lightnesses)) {
    console.warn('Vintage colors validation failed');
  }
  return colors;
}

function generatePentadic(hex) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];
  for (let i = 0; i < 5; i++) {
    colors.push(hslToHex((h + i * 72) % 360, s, l));
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
    navigator.clipboard.writeText(hex)
      .then(() => {
        const hexSpan = swatch.querySelector('.swatch-hex');
        hexSpan.textContent = hex + ' ✓';
        setTimeout(() => { hexSpan.textContent = hex; }, 1000);
        // Log the copy
        recordCopy(hex);
      })
      .catch(err => {
        console.error("Clipboard write failed:", err);
      });
  };
  referenceRow.appendChild(swatch);
}

function updateSwatches(hex, scheme) {
  const swatchRow = document.getElementById('swatchRow');
  swatchRow.innerHTML = '';
  // Use nColors input for variable schemes, otherwise use colorCount default
  const variableSchemes = ['analogous', 'monochromatic', 'pastel', 'earth', 'warm', 'cool', 'highkey', 'lowkey', 'gradient'];
  let n = variableSchemes.includes(scheme)
    ? (parseInt(document.getElementById('nColors').value) || colorCount[scheme] || 5)
    : (colorCount[scheme] || 5);
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
      colors = generateAutumn(hex, n);
      break;
    case 'spring':
      colors = generateSpring(hex, n);
      break;
    case 'summer':
      colors = generateSummer(hex, n);
      break;
    case 'winter':
      colors = generateWinter(hex, n);
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
      colors = generateAccessible(hex, n);
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
    case 'colorblind':
      colors = generateColorBlind(hex, n);
      break;
    case 'duotone':
      colors = generateDuotone(hex, n);
      break;
    case 'gradient':
      colors = generateGradient(hex, n);
      break;
    case 'vintage':
      colors = generateVintage(hex, n);
      break;
    case 'pentadic':
      colors = generatePentadic(hex);
      break;
    default:
      colors = [hex];
  }

  colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.innerHTML = `<div class="swatch-color" style="background:${color}"></div><span class="swatch-hex">${color}</span>`;
    swatch.onclick = function() {
      navigator.clipboard.writeText(color)
        .then(() => {
          const hexSpan = swatch.querySelector('.swatch-hex');
          hexSpan.textContent = color + ' ✓';
          setTimeout(() => { hexSpan.textContent = color; }, 1000);
          // Log the copy
          recordCopy(color);
        })
        .catch(err => {
          console.error("Clipboard write failed:", err);
        });
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
  'accessible': 5,
  'psychology-calm': 3,
  'relaxing': 5,
  'energetic': 5,
  'polychromatic': 6,
  'colorblind': 5,
  'duotone': 5,
  'gradient': 5,
  'vintage': 5,
  'pentadic': 5
};

// Initialize the color matcher
function initColorMatcher() {
  const colorPicker = document.getElementById('colorPicker');
  const hexInput = document.getElementById('hexInput');
  const schemeSelect = document.getElementById('schemeSelect');
  
  function updateAll() {
    const hex = colorPicker.value;
    const scheme = schemeSelect.value;
    const n = parseInt(document.getElementById('nColors').value) || 5;
    
    // Update hex input
    hexInput.value = hex;
    
    // Show reference swatch
    showReferenceSwatch(hex);
    
    // Update theme description
    const themeDesc = document.querySelector('.theme-description');
    themeDesc.textContent = getThemeDescription(scheme);
    
    // Update scheme description
    const schemeDesc = document.getElementById('schemeDesc');
    schemeDesc.textContent = getSchemeDescription(scheme);
    
    // Show/hide add color button based on scheme
    const addColorBtn = document.getElementById('addColorBtn');
    const schemesWithAddButton = ['analogous', 'monochromatic', 'pastel', 'earth', 'warm', 'cool', 'highkey', 'lowkey', 'gradient'];
    addColorBtn.style.display = schemesWithAddButton.includes(scheme) ? 'block' : 'none';
    
    // Update swatches
    updateSwatches(hex, scheme);
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

// Add event listener for the add color button
document.getElementById('addColorBtn').addEventListener('click', function() {
  const hex = colorPicker.value;
  const scheme = schemeSelect.value;
  const n = parseInt(document.getElementById('nColors').value) || 5;
  const newN = n + 1;
  document.getElementById('nColors').value = newN;
  updateSwatches(hex, scheme);
});

function getThemeDescription(scheme) {
  const descriptions = {
    'complementary': 'Opposite colors on the wheel',
    'analogous': 'Colors next to each other',
    'triadic': 'Three evenly spaced colors',
    'split-complementary': 'One color and two near its opposite',
    'tetradic': 'Two pairs of opposite colors',
    'square': 'Four evenly spaced colors',
    'monochromatic': 'Different shades of one color',
    'diadic': 'Two colors one step apart',
    'pentadic': 'Five evenly spaced colors',
    'pastel': 'Soft, light color variations',
    'earth': 'Natural, muted tones',
    'warm': 'Reds, oranges, and yellows',
    'cool': 'Blues, greens, and purples',
    'highkey': 'Light, bright colors',
    'lowkey': 'Dark, rich colors',
    'gradient': 'Smooth color transitions',
    'gradient-extended': 'More color steps in gradient',
    'achromatic': 'Black, white, and grays',
    'accented-neutral': 'Neutrals with one accent',
    'compound': 'Mix of complementary and analogous',
    'fauvist': 'Bold, vivid colors',
    'autumn': 'Warm fall colors',
    'spring': 'Fresh, light colors',
    'summer': 'Bright, vibrant colors',
    'winter': 'Cool, crisp colors',
    'retro50s': 'Soft pastel colors',
    'discordant': 'Intentionally clashing colors',
    'metallic': 'Colors with metallic sheen',
    'optical-mix': 'Colors that create illusions',
    'accessible': 'High-contrast colors',
    'psychology-calm': 'Calming color combinations',
    'relaxing': 'Soft, peaceful colors',
    'energetic': 'Bright, exciting colors',
    'polychromatic': 'Multiple colors from spectrum'
  };
  return descriptions[scheme] || '';
}

function getSchemeDescription(scheme) {
  const descriptions = {
    'complementary': 'Two colors opposite each other on the color wheel, creating high contrast and visual impact.',
    'analogous': 'Colors adjacent to each other on the color wheel, creating a harmonious and cohesive look.',
    'triadic': 'Three colors equally spaced around the color wheel, offering vibrant contrast while maintaining harmony.',
    'split-complementary': 'A base color and two colors adjacent to its complement, offering high contrast with less tension.',
    'tetradic': 'Four colors arranged into two complementary pairs, creating a rich and diverse color scheme.',
    'square': 'Four colors evenly spaced around the color wheel, creating a balanced and vibrant palette.',
    'monochromatic': 'Variations of a single color, creating a cohesive and sophisticated look.',
    'diadic': 'Two colors separated by one color on the color wheel, offering a balanced contrast.',
    'pentadic': 'Five colors evenly spaced around the color wheel, creating a rich and diverse palette.',
    'pastel': 'Soft, light versions of colors, creating a gentle and soothing atmosphere.',
    'earth': 'Natural, muted tones inspired by nature, creating a warm and organic feel.',
    'warm': 'Colors from the red, orange, and yellow families, creating an energetic and inviting atmosphere.',
    'cool': 'Colors from the blue, green, and purple families, creating a calm and soothing atmosphere.',
    'highkey': 'Light, bright colors with high value, creating an airy and uplifting mood.',
    'lowkey': 'Dark, rich colors with low value, creating a dramatic and sophisticated atmosphere.',
    'gradient': 'A smooth transition between colors, creating a dynamic and flowing effect.',
    'gradient-extended': 'An extended gradient with more color steps, offering more subtle transitions.',
    'achromatic': 'A grayscale palette using only black, white, and grays.',
    'accented-neutral': 'Neutral colors with a single accent color for visual interest.',
    'compound': 'A combination of complementary and analogous colors, offering both harmony and contrast.',
    'fauvist': 'Bold, vivid colors with high saturation, creating an energetic and expressive look.',
    'autumn': 'Warm, earthy tones inspired by fall foliage.',
    'spring': 'Fresh, light colors inspired by spring blossoms.',
    'summer': 'Bright, vibrant colors inspired by summer landscapes.',
    'winter': 'Cool, crisp colors inspired by winter scenes.',
    'retro50s': 'Soft, pastel colors reminiscent of 1950s design.',
    'discordant': 'Colors that intentionally clash, creating tension and visual interest.',
    'metallic': 'Colors with a metallic sheen, creating a luxurious and sophisticated look.',
    'optical-mix': 'Colors that create optical illusions when viewed together.',
    'accessible': 'High-contrast colors designed for maximum readability and accessibility.',
    'psychology-calm': 'Colors chosen for their calming psychological effects.',
    'relaxing': 'Soft, muted colors designed to create a peaceful atmosphere.',
    'energetic': 'Bright, vibrant colors designed to create excitement and energy.',
    'polychromatic': 'Multiple colors from across the spectrum, creating a vibrant and diverse palette.'
  };
  return descriptions[scheme] || 'A custom color scheme.';
} 