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

function getKickerHatSVG(hatId) {
  switch (hatId) {
    case 'cap':
      return `
        <ellipse cx="24" cy="6" rx="10" ry="3.5" fill="#1565C0"/>
        <rect x="15" y="4" width="14" height="4" rx="2" fill="#1E88E5"/>
        <ellipse cx="30" cy="7" rx="7" ry="2" fill="#0D47A1"/>`;
    case 'visor':
      return `<path d="M14 9 Q24 5 34 9 L32 12 Q24 9 16 12 Z" fill="#00ACC1"/>`;
    case 'headband':
      return `
        <rect x="14" y="8" width="20" height="3" rx="1.5" fill="#E53935"/>
        <circle cx="24" cy="9.5" r="2" fill="#FFEB3B"/>`;
    case 'crown':
      return `
        <path d="M16 10 L19 4 L24 9 L29 4 L32 10 Z" fill="#FFC107" stroke="#F57F17" stroke-width="0.8"/>
        <circle cx="19" cy="7" r="0.8" fill="#FFEB3B"/>
        <circle cx="24" cy="6" r="0.8" fill="#FFEB3B"/>
        <circle cx="29" cy="7" r="0.8" fill="#FFEB3B"/>`;
    case 'party':
      return `
        <path d="M20 10 L24 0 L28 10 Z" fill="#E91E63" stroke="#AD1457" stroke-width="0.8"/>
        <circle cx="22" cy="5" r="0.8" fill="#FFEB3B"/>
        <circle cx="26" cy="4" r="0.8" fill="#4FC3F7"/>`;
    case 'cowboy':
      return `
        <ellipse cx="24" cy="9" rx="12" ry="3" fill="#8D6E63" stroke="#5D4037" stroke-width="0.8"/>
        <path d="M16 7 Q24 2 32 7 L30 9 Q24 5 18 9 Z" fill="#A1887F"/>`;
    case 'beanie':
      return `
        <ellipse cx="24" cy="6" rx="8" ry="5" fill="#E53935"/>
        <circle cx="24" cy="1" r="2" fill="#FFCDD2"/>`;
    case 'wizard':
      return `
        <path d="M17 10 L24 -2 L31 10 Z" fill="#5E35B1" stroke="#311B92" stroke-width="0.8"/>
        <circle cx="22" cy="4" r="1" fill="#FFD54F"/>`;
    case 'propeller':
      return `
        <rect x="22" y="2" width="4" height="5" rx="1" fill="#78909C"/>
        <ellipse cx="24" cy="1" rx="8" ry="2" fill="#EF5350"/>
        <ellipse cx="24" cy="1" rx="2" ry="8" fill="#42A5F5"/>`;
    default:
      return '';
  }
}

function getKickerAccessorySVG(accessoryId) {
  switch (accessoryId) {
    case 'shades':
      return `
        <rect x="18" y="9" width="5" height="3" rx="1" fill="#111"/>
        <rect x="25" y="9" width="5" height="3" rx="1" fill="#111"/>
        <line x1="23" y1="10.5" x2="25" y2="10.5" stroke="#111" stroke-width="0.8"/>`;
    case 'eyeblack':
      return `
        <rect x="18" y="10" width="5" height="2" rx="0.5" fill="#111" opacity="0.85"/>
        <rect x="25" y="10" width="5" height="2" rx="0.5" fill="#111" opacity="0.85"/>`;
    case 'bowtie':
      return `
        <path d="M20 24 L23 26 L20 28 L17 26 Z" fill="#D32F2F"/>
        <path d="M23 24 L26 26 L23 28 L20 26 Z" fill="#D32F2F"/>`;
    case 'tie':
      return `<path d="M23 24 L24 28 L25 24 L24 36 Z" fill="#283593"/>`;
    case 'scarf':
      return `
        <path d="M16 24 Q24 28 32 24 L30 28 Q24 32 18 28 Z" fill="#E53935"/>
        <rect x="28" y="26" width="4" height="10" rx="1" fill="#C62828"/>`;
    case 'chain':
      return `
        <ellipse cx="24" cy="25" rx="6" ry="2" fill="none" stroke="#FFD700" stroke-width="1.2"/>
        <circle cx="24" cy="28" r="2.5" fill="#FFD700"/>`;
    case 'medal':
      return `
        <circle cx="24" cy="30" r="3" fill="#FFD700" stroke="#F57F17" stroke-width="0.8"/>
        <text x="24" y="31.5" text-anchor="middle" font-size="4" font-weight="700" fill="#5D4037">1</text>`;
    case 'headphones':
      return `
        <path d="M14 10 Q24 2 34 10" stroke="#37474F" stroke-width="2" fill="none"/>
        <rect x="12" y="9" width="4" height="6" rx="1.5" fill="#455A64"/>
        <rect x="32" y="9" width="4" height="6" rx="1.5" fill="#455A64"/>`;
    default:
      return '';
  }
}

function getKickerOutfitSVG(outfitId, jerseyColor, darker) {
  switch (outfitId) {
    case 'jersey':
      return `
        <rect x="19" y="22" width="2" height="14" fill="rgba(255,255,255,0.45)"/>
        <rect x="24" y="22" width="2" height="14" fill="rgba(255,255,255,0.45)"/>
        <rect x="29" y="22" width="2" height="14" fill="rgba(255,255,255,0.45)"/>`;
    case 'captain':
      return `<text x="24" y="32" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" stroke="${darker}" stroke-width="0.4">C</text>`;
    case 'hoodie':
      return `
        <path d="M12 20 Q24 14 36 20 L34 24 Q24 18 14 24 Z" fill="${darker}" opacity="0.35"/>
        <circle cx="24" cy="16" r="2" fill="${darker}" opacity="0.5"/>`;
    case 'cape':
      return `<path d="M10 20 Q6 34 12 48 Q24 42 36 48 Q42 34 38 20 Z" fill="#7B1FA2" opacity="0.55"/>`;
    case 'tuxedo':
      return `
        <rect x="16" y="18" width="16" height="20" rx="3" fill="#111"/>
        <polygon points="24,22 21,30 27,30" fill="#fff"/>
        <circle cx="24" cy="31" r="1.2" fill="#FFD700"/>`;
    case 'armor':
      return `
        <rect x="15" y="19" width="18" height="18" rx="3" fill="#78909C" stroke="#455A64" stroke-width="1"/>
        <rect x="18" y="22" width="12" height="3" fill="#B0BEC5"/>`;
    default:
      return `<rect x="18" y="22" width="12" height="3" rx="1" fill="rgba(255,255,255,0.35)"/>`;
  }
}

function getKickerEyes(accessoryId) {
  if (FACE_ACCESSORIES.has(accessoryId)) return getKickerAccessorySVG(accessoryId);
  return `
    <circle cx="21" cy="10" r="1.2" fill="#1a1a1a"/>
    <circle cx="27" cy="10" r="1.2" fill="#1a1a1a"/>`;
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
  const hatLayer = getKickerHatSVG(customization.hat);
  const outfitLayer = getKickerOutfitSVG(customization.outfit, jerseyColor, darker);
  const capeBack = customization.outfit === 'cape' ? getKickerOutfitSVG('cape', jerseyColor, darker) : '';
  const eyes = getKickerEyes(customization.accessory);
  const accessorySlot = getAccessoryLayerSlot(customization.accessory);
  const accessoryLayer = getAccessoryLayer(customization.accessory);

  return `
    <svg class="kicker-svg" viewBox="0 0 44 58" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${capeBack}
      <rect x="13" y="36" width="9" height="16" rx="3" fill="#f5f0e6" stroke="#2a2a2a" stroke-width="0.8"/>
      <rect x="24" y="36" width="9" height="16" rx="3" fill="#f5f0e6" stroke="#2a2a2a" stroke-width="0.8" class="kicker-kick-leg"/>
      <rect x="16" y="18" width="16" height="20" rx="4" fill="${jerseyColor}" stroke="${darker}" stroke-width="1"/>
      ${outfitLayer}
      ${accessorySlot === 'neck' ? accessoryLayer : ''}
      ${accessorySlot === 'chest' ? accessoryLayer : ''}
      <ellipse cx="24" cy="10" rx="8" ry="9" fill="${helmetColor}" stroke="${darker}" stroke-width="1"/>
      <rect x="14" y="9" width="20" height="4" rx="1.5" fill="#fafafa" opacity="0.92"/>
      <line x1="16" y1="11" x2="19" y2="14" stroke="#ccc" stroke-width="0.8"/>
      <line x1="20" y1="11" x2="20" y2="15" stroke="#ccc" stroke-width="0.8"/>
      <line x1="24" y1="11" x2="24" y2="15" stroke="#ccc" stroke-width="0.8"/>
      <line x1="28" y1="11" x2="28" y2="15" stroke="#ccc" stroke-width="0.8"/>
      <line x1="32" y1="11" x2="29" y2="14" stroke="#ccc" stroke-width="0.8"/>
      ${eyes}
      ${accessorySlot === 'head' ? accessoryLayer : ''}
      <rect x="10" y="20" width="7" height="5" rx="2" fill="${jerseyColor}" transform="rotate(-28 13 22)"/>
      ${hatLayer}
    </svg>`;
}

function createMiniKickerSVG(jerseyColor, style = DEFAULT_KICKER_STYLE, width = 36) {
  return createKickerSVG(jerseyColor, style).replace(
    'class="kicker-svg"',
    `class="kicker-svg" width="${width}" height="${Math.round(width * 58 / 44)}"`
  );
}
