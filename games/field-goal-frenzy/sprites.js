const HAT_OPTIONS = [
  { id: 'none', label: 'Helmet only' },
  { id: 'cap', label: 'Cap' },
  { id: 'visor', label: 'Visor' },
  { id: 'headband', label: 'Headband' },
  { id: 'crown', label: 'Crown' },
  { id: 'party', label: 'Party hat' },
  { id: 'cowboy', label: 'Cowboy' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'wizard', label: 'Wizard' },
  { id: 'propeller', label: 'Propeller' },
];

const ACCESSORY_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'shades', label: 'Shades' },
  { id: 'eyeblack', label: 'Eye black' },
  { id: 'bowtie', label: 'Bow tie' },
  { id: 'tie', label: 'Neck tie' },
  { id: 'scarf', label: 'Towel' },
  { id: 'chain', label: 'Gold chain' },
  { id: 'medal', label: 'Medal' },
  { id: 'headphones', label: 'Headphones' },
];

const OUTFIT_OPTIONS = [
  { id: 'none', label: 'Plain jersey' },
  { id: 'jersey', label: 'Striped' },
  { id: 'captain', label: 'Captain C' },
  { id: 'hoodie', label: 'Hoodie' },
  { id: 'cape', label: 'Cape' },
  { id: 'tuxedo', label: 'Tuxedo' },
  { id: 'armor', label: 'Armor' },
];

const DEFAULT_KICKER_STYLE = { hat: 'none', accessory: 'none', outfit: 'none' };

const FACE_ACCESSORIES = new Set(['shades', 'eyeblack']);
const NECK_ACCESSORIES = new Set(['bowtie', 'tie', 'scarf', 'chain']);
const CHEST_ACCESSORIES = new Set(['medal']);
const HEAD_ACCESSORIES = new Set(['headphones']);

/** Side-view anatomy anchors (viewBox 0 0 44 58) */
const HEAD = { cx: 24, cy: 10, rx: 8, ry: 9 };
const HEAD_TOP = HEAD.cy - HEAD.ry;
const EYE_L = { x: 20.5, y: 9.5 };
const EYE_R = { x: 27.5, y: 9.5 };
const CHEEK_Y = 12.2;
const COLLAR_Y = 20.5;
const CHEST_Y = 30;

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function normalizeKickerStyle(style = {}) {
  return {
    hat: HAT_OPTIONS.some((o) => o.id === style.hat) ? style.hat : 'none',
    accessory: ACCESSORY_OPTIONS.some((o) => o.id === style.accessory) ? style.accessory : 'none',
    outfit: OUTFIT_OPTIONS.some((o) => o.id === style.outfit) ? style.outfit : 'none',
  };
}

function getFacemaskSVG() {
  return `
    <rect x="14" y="10" width="20" height="5" rx="1.5" fill="#fafafa" opacity="0.92"/>
    <line x1="16" y1="12" x2="19" y2="15.5" stroke="#bbb" stroke-width="0.9"/>
    <line x1="20" y1="12" x2="20" y2="16" stroke="#bbb" stroke-width="0.9"/>
    <line x1="24" y1="12" x2="24" y2="16" stroke="#bbb" stroke-width="0.9"/>
    <line x1="28" y1="12" x2="28" y2="16" stroke="#bbb" stroke-width="0.9"/>
    <line x1="32" y1="12" x2="29" y2="15.5" stroke="#bbb" stroke-width="0.9"/>`;
}

function getEyesSVG() {
  return `
    <circle cx="${EYE_L.x}" cy="${EYE_L.y}" r="1.1" fill="#1a1a1a"/>
    <circle cx="${EYE_R.x}" cy="${EYE_R.y}" r="1.1" fill="#1a1a1a"/>
    <circle cx="${EYE_L.x + 0.35}" cy="${EYE_L.y - 0.35}" r="0.35" fill="#fff" opacity="0.75"/>
    <circle cx="${EYE_R.x + 0.35}" cy="${EYE_R.y - 0.35}" r="0.35" fill="#fff" opacity="0.75"/>`;
}

function getShadesSVG() {
  return `
    <rect x="${EYE_L.x - 2.2}" y="${EYE_L.y - 1.4}" width="4.8" height="2.6" rx="0.8" fill="#111"/>
    <rect x="${EYE_R.x - 2.2}" y="${EYE_R.y - 1.4}" width="4.8" height="2.6" rx="0.8" fill="#111"/>
    <line x1="${EYE_L.x + 2.6}" y1="${EYE_L.y - 0.2}" x2="${EYE_R.x - 2.6}" y2="${EYE_R.y - 0.2}" stroke="#111" stroke-width="0.7"/>`;
}

function getEyeblackSVG() {
  return `
    <rect x="${EYE_L.x - 2.5}" y="${CHEEK_Y - 0.8}" width="5" height="1.8" rx="0.6" fill="#111" opacity="0.88"/>
    <rect x="${EYE_R.x - 2.5}" y="${CHEEK_Y - 0.8}" width="5" height="1.8" rx="0.6" fill="#111" opacity="0.88"/>`;
}

function getKickerFaceSVG(accessoryId) {
  let face = getEyesSVG();
  if (accessoryId === 'shades') face += getShadesSVG();
  if (accessoryId === 'eyeblack') face += getEyeblackSVG();
  return face;
}

function getKickerHatSVG(hatId) {
  const top = HEAD_TOP;
  switch (hatId) {
    case 'cap':
      return `
        <ellipse cx="${HEAD.cx}" cy="${top + 4}" rx="9" ry="3" fill="#1565C0"/>
        <rect x="${HEAD.cx - 8}" y="${top + 1}" width="16" height="4.5" rx="2" fill="#1E88E5"/>
        <ellipse cx="${HEAD.cx + 6}" cy="${top + 5.5}" rx="6.5" ry="2" fill="#0D47A1"/>`;
    case 'visor':
      return `
        <path d="M${HEAD.cx - 10} ${top + 8} Q${HEAD.cx} ${top + 4} ${HEAD.cx + 10} ${top + 8} L${HEAD.cx + 8} ${top + 10} Q${HEAD.cx} ${top + 7} ${HEAD.cx - 8} ${top + 10} Z" fill="#00ACC1"/>`;
    case 'headband':
      return `
        <rect x="${HEAD.cx - 9}" y="${top + 5}" width="18" height="3" rx="1.5" fill="#E53935"/>
        <circle cx="${HEAD.cx}" cy="${top + 6.5}" r="1.8" fill="#FFEB3B"/>`;
    case 'crown':
      return `
        <path d="M${HEAD.cx - 8} ${top + 7} L${HEAD.cx - 5} ${top - 1} L${HEAD.cx - 1} ${top + 4} L${HEAD.cx + 3} ${top - 1} L${HEAD.cx + 6} ${top + 3} L${HEAD.cx + 8} ${top + 7} Z" fill="#FFC107" stroke="#F57F17" stroke-width="0.7"/>
        <rect x="${HEAD.cx - 8}" y="${top + 6.5}" width="16" height="2" rx="0.5" fill="#F9A825"/>`;
    case 'party':
      return `
        <path d="M${HEAD.cx - 4} ${top + 6} L${HEAD.cx} ${top - 5} L${HEAD.cx + 4} ${top + 6} Z" fill="#E91E63" stroke="#AD1457" stroke-width="0.7"/>
        <ellipse cx="${HEAD.cx}" cy="${top + 6.5}" rx="5" ry="1.2" fill="#F48FB1"/>`;
    case 'cowboy':
      return `
        <ellipse cx="${HEAD.cx}" cy="${top + 7}" rx="11" ry="2.8" fill="#8D6E63" stroke="#5D4037" stroke-width="0.7"/>
        <path d="M${HEAD.cx - 7} ${top + 3} Q${HEAD.cx} ${top - 1} ${HEAD.cx + 7} ${top + 3} L${HEAD.cx + 6} ${top + 6} Q${HEAD.cx} ${top + 2} ${HEAD.cx - 6} ${top + 6} Z" fill="#A1887F"/>`;
    case 'beanie':
      return `
        <ellipse cx="${HEAD.cx}" cy="${top + 3.5}" rx="8.5" ry="4.5" fill="#E53935"/>
        <circle cx="${HEAD.cx}" cy="${top - 1}" r="2" fill="#FFCDD2"/>
        <path d="M${HEAD.cx - 8} ${top + 6} Q${HEAD.cx} ${top + 8} ${HEAD.cx + 8} ${top + 6}" stroke="#B71C1C" stroke-width="1" fill="none"/>`;
    case 'wizard':
      return `
        <path d="M${HEAD.cx - 7} ${top + 6} L${HEAD.cx} ${top - 6} L${HEAD.cx + 7} ${top + 6} Z" fill="#5E35B1" stroke="#311B92" stroke-width="0.7"/>
        <ellipse cx="${HEAD.cx}" cy="${top + 6.5}" rx="8" ry="1.5" fill="#311B92"/>
        <circle cx="${HEAD.cx - 2}" cy="${top + 1}" r="0.9" fill="#FFD54F"/>`;
    case 'propeller':
      return `
        <rect x="${HEAD.cx - 2}" y="${top - 1}" width="4" height="5" rx="1" fill="#78909C"/>
        <ellipse cx="${HEAD.cx}" cy="${top - 2}" rx="9" ry="2" fill="#EF5350" opacity="0.95"/>
        <ellipse cx="${HEAD.cx}" cy="${top - 2}" rx="2" ry="9" fill="#42A5F5" opacity="0.95"/>
        <circle cx="${HEAD.cx}" cy="${top - 2}" r="1.3" fill="#37474F"/>`;
    default:
      return '';
  }
}

function getHeadphonesSVG() {
  return `
    <path d="M${HEAD.cx - 9} ${HEAD.cy - 1} Q${HEAD.cx} ${HEAD_TOP - 3} ${HEAD.cx + 9} ${HEAD.cy - 1}" stroke="#37474F" stroke-width="1.8" fill="none"/>
    <rect x="${HEAD.cx - 11}" y="${HEAD.cy - 3}" width="4.5" height="7" rx="2" fill="#455A64"/>
    <rect x="${HEAD.cx + 6.5}" y="${HEAD.cy - 3}" width="4.5" height="7" rx="2" fill="#455A64"/>`;
}

function getKickerAccessorySVG(accessoryId) {
  switch (accessoryId) {
    case 'bowtie':
      return `
        <path d="M${HEAD.cx - 4} ${COLLAR_Y} L${HEAD.cx - 1} ${COLLAR_Y + 2.5} L${HEAD.cx - 4} ${COLLAR_Y + 5} L${HEAD.cx - 7} ${COLLAR_Y + 2.5} Z" fill="#D32F2F"/>
        <path d="M${HEAD.cx + 1} ${COLLAR_Y} L${HEAD.cx + 4} ${COLLAR_Y + 2.5} L${HEAD.cx + 1} ${COLLAR_Y + 5} L${HEAD.cx - 2} ${COLLAR_Y + 2.5} Z" fill="#D32F2F"/>
        <circle cx="${HEAD.cx}" cy="${COLLAR_Y + 2.5}" r="1" fill="#B71C1C"/>`;
    case 'tie':
      return `
        <path d="M${HEAD.cx - 1.5} ${COLLAR_Y} L${HEAD.cx} ${COLLAR_Y + 4} L${HEAD.cx + 1.5} ${COLLAR_Y} L${HEAD.cx} ${CHEST_Y + 4} Z" fill="#283593"/>
        <polygon points="${HEAD.cx - 1.5},${COLLAR_Y} ${HEAD.cx},${COLLAR_Y + 3} ${HEAD.cx + 1.5},${COLLAR_Y}" fill="#3949AB"/>`;
    case 'scarf':
      return `
        <path d="M${HEAD.cx - 10} ${COLLAR_Y + 1} Q${HEAD.cx} ${COLLAR_Y + 5} ${HEAD.cx + 10} ${COLLAR_Y + 1} L${HEAD.cx + 8} ${COLLAR_Y + 4} Q${HEAD.cx} ${COLLAR_Y + 7} ${HEAD.cx - 8} ${COLLAR_Y + 4} Z" fill="#E53935"/>
        <rect x="${HEAD.cx + 5}" y="${COLLAR_Y + 3}" width="3.5" height="11" rx="1" fill="#C62828" transform="rotate(8 ${HEAD.cx + 7} ${COLLAR_Y + 8})"/>`;
    case 'chain':
      return `
        <path d="M${HEAD.cx - 5} ${COLLAR_Y + 1} Q${HEAD.cx} ${COLLAR_Y + 4} ${HEAD.cx + 5} ${COLLAR_Y + 1}" fill="none" stroke="#FFD700" stroke-width="1.2"/>
        <circle cx="${HEAD.cx}" cy="${COLLAR_Y + 6}" r="2.2" fill="#FFD700" stroke="#F57F17" stroke-width="0.5"/>`;
    case 'medal':
      return `
        <line x1="${HEAD.cx}" y1="${COLLAR_Y + 3}" x2="${HEAD.cx}" y2="${CHEST_Y - 2}" stroke="#FFD700" stroke-width="0.8"/>
        <circle cx="${HEAD.cx}" cy="${CHEST_Y}" r="3.2" fill="#FFD700" stroke="#F57F17" stroke-width="0.8"/>
        <text x="${HEAD.cx}" y="${CHEST_Y + 1.2}" text-anchor="middle" font-size="3.8" font-weight="700" fill="#5D4037">1</text>`;
    case 'headphones':
      return getHeadphonesSVG();
    default:
      return '';
  }
}

function getJerseyBodySVG(jerseyColor, darker, outfitId) {
  if (outfitId === 'tuxedo') {
    return `
      <rect x="16" y="18" width="16" height="20" rx="4" fill="#111" stroke="#000" stroke-width="1"/>
      <polygon points="${HEAD.cx},22 ${HEAD.cx - 3},30 ${HEAD.cx + 3},30" fill="#fff"/>
      <circle cx="${HEAD.cx}" cy="31" r="1.2" fill="#FFD700"/>`;
  }
  if (outfitId === 'armor') {
    return `
      <rect x="15" y="18" width="18" height="20" rx="4" fill="${jerseyColor}" stroke="${darker}" stroke-width="1"/>
      <rect x="15" y="19" width="18" height="18" rx="3" fill="#78909C" stroke="#455A64" stroke-width="1"/>
      <rect x="18" y="22" width="12" height="3" fill="#B0BEC5"/>`;
  }
  return `<rect x="16" y="18" width="16" height="20" rx="4" fill="${jerseyColor}" stroke="${darker}" stroke-width="1"/>`;
}

function getHoodieBackSVG(darker) {
  return `<path d="M11 19 Q${HEAD.cx} 10 37 19 L35 24 Q${HEAD.cx} 16 13 24 Z" fill="${darker}" opacity="0.42"/>`;
}

function getKickerBodyOverlay(outfitId, darker) {
  switch (outfitId) {
    case 'none':
      return `<rect x="18" y="23" width="12" height="3" rx="1" fill="rgba(255,255,255,0.35)"/>`;
    case 'jersey':
      return `
        <rect x="19" y="22" width="2" height="14" fill="rgba(255,255,255,0.45)"/>
        <rect x="24" y="22" width="2" height="14" fill="rgba(255,255,255,0.45)"/>
        <rect x="29" y="22" width="2" height="14" fill="rgba(255,255,255,0.45)"/>`;
    case 'captain':
      return `<text x="${HEAD.cx}" y="${CHEST_Y + 1}" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" stroke="${darker}" stroke-width="0.35">C</text>`;
    default:
      return '';
  }
}

function getKickerHeadOverlay(outfitId, darker) {
  if (outfitId === 'hoodie') {
    return `<ellipse cx="${HEAD.cx}" cy="17.5" rx="9.5" ry="3" fill="none" stroke="${darker}" stroke-width="1" opacity="0.55"/>`;
  }
  return '';
}

function getKickerOutfitOverlay(outfitId, darker) {
  return getKickerBodyOverlay(outfitId, darker);
}

function getCapeBackSVG() {
  return `<path d="M10 20 Q6 34 12 48 Q${HEAD.cx} 42 36 48 Q42 34 38 20 Z" fill="#7B1FA2" opacity="0.55"/>`;
}

function getAccessoryLayer(accessoryId) {
  if (accessoryId === 'none' || FACE_ACCESSORIES.has(accessoryId)) return '';
  return getKickerAccessorySVG(accessoryId);
}

function getAccessoryLayerSlot(accessoryId) {
  if (NECK_ACCESSORIES.has(accessoryId)) return 'neck';
  if (CHEST_ACCESSORIES.has(accessoryId)) return 'chest';
  if (HEAD_ACCESSORIES.has(accessoryId)) return 'head';
  return '';
}

function createKickerSVG(jerseyColor, style = DEFAULT_KICKER_STYLE) {
  const customization = normalizeKickerStyle(style);
  const darker = shadeColor(jerseyColor, -22);
  const helmetColor = shadeColor(jerseyColor, 8);
  const { hat, accessory, outfit } = customization;
  const accessorySlot = getAccessoryLayerSlot(accessory);
  const accessoryLayer = getAccessoryLayer(accessory);

  return `
    <svg class="kicker-svg" viewBox="0 0 44 58" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${outfit === 'cape' ? getCapeBackSVG() : ''}
      ${outfit === 'hoodie' ? getHoodieBackSVG(darker) : ''}

      <rect x="13" y="36" width="9" height="16" rx="3" fill="#f5f0e6" stroke="#2a2a2a" stroke-width="0.8"/>
      <rect x="24" y="36" width="9" height="16" rx="3" fill="#f5f0e6" stroke="#2a2a2a" stroke-width="0.8" class="kicker-kick-leg"/>

      ${getJerseyBodySVG(jerseyColor, darker, outfit)}
      ${getKickerBodyOverlay(outfit, darker)}

      <ellipse cx="${HEAD.cx}" cy="${HEAD.cy}" rx="${HEAD.rx}" ry="${HEAD.ry}" fill="${helmetColor}" stroke="${darker}" stroke-width="1"/>

      ${getFacemaskSVG()}
      ${getKickerFaceSVG(accessory)}

      ${accessorySlot === 'neck' ? accessoryLayer : ''}
      ${accessorySlot === 'chest' ? accessoryLayer : ''}

      ${getKickerHeadOverlay(outfit, darker)}

      <rect x="10" y="20" width="7" height="5" rx="2" fill="${outfit === 'tuxedo' ? '#111' : jerseyColor}" transform="rotate(-28 13 22)"/>

      ${accessorySlot === 'head' ? accessoryLayer : ''}
      ${hat !== 'none' ? getKickerHatSVG(hat) : ''}
    </svg>`;
}

function createMiniKickerSVG(jerseyColor, style = DEFAULT_KICKER_STYLE, width = 36) {
  return createKickerSVG(jerseyColor, style).replace(
    'class="kicker-svg"',
    `class="kicker-svg" width="${width}" height="${Math.round(width * 58 / 44)}"`
  );
}
