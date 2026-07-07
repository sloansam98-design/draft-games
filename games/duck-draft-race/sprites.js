const DUCK_BODY_COLORS = [
  '#FFD93D', '#FFCA28', '#FFE082', '#FFC107', '#FFEB3B',
  '#FFB830', '#F9A825', '#FFD54F', '#FBC02D', '#FFF176',
  '#FFCC02', '#FFE57F', '#FFD740', '#FFAB00', '#FDD835',
];

const HAT_OPTIONS = [
  { id: 'none', label: 'No hat' },
  { id: 'top-hat', label: 'Top hat' },
  { id: 'crown', label: 'Crown' },
  { id: 'cap', label: 'Cap' },
  { id: 'cowboy', label: 'Cowboy' },
  { id: 'beanie', label: 'Beanie' },
  { id: 'party', label: 'Party hat' },
  { id: 'wizard', label: 'Wizard' },
  { id: 'sombrero', label: 'Sombrero' },
  { id: 'propeller', label: 'Propeller' },
  { id: 'headband', label: 'Headband' },
  { id: 'pirate', label: 'Pirate' },
  { id: 'visor', label: 'Visor' },
];

const ACCESSORY_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'bowtie', label: 'Bow tie' },
  { id: 'tie', label: 'Neck tie' },
  { id: 'scarf', label: 'Scarf' },
  { id: 'chain', label: 'Gold chain' },
  { id: 'shades', label: 'Shades' },
  { id: 'monocle', label: 'Monocle' },
  { id: 'mustache', label: 'Mustache' },
  { id: 'medal', label: 'Medal' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'lei', label: 'Flower lei' },
  { id: 'mask', label: 'Sleep mask' },
];

const OUTFIT_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'jersey', label: 'Jersey' },
  { id: 'tuxedo', label: 'Tuxedo' },
  { id: 'hoodie', label: 'Hoodie' },
  { id: 'tutu', label: 'Tutu' },
  { id: 'cape', label: 'Cape' },
  { id: 'hawaiian', label: 'Hawaiian' },
  { id: 'armor', label: 'Armor' },
];

const DEFAULT_DUCK_STYLE = { hat: 'none', accessory: 'none', outfit: 'none' };

const FACE_ACCESSORIES = new Set(['shades', 'monocle', 'mask']);
const NECK_ACCESSORIES = new Set(['bowtie', 'tie', 'scarf', 'chain', 'lei']);
const CHEST_ACCESSORIES = new Set(['medal']);
const BEAK_ACCESSORIES = new Set(['mustache']);
const HEAD_ACCESSORIES = new Set(['headphones']);

/** Torso overlay path that follows the side-view body ellipse */
const TORSO_OVERLAY =
  'M12 33 C12 28 22 26 34 26 C44 26 52 28 54 33 C54 38 50 44 34 46 C18 44 12 38 12 33 Z';

function getHatSVG(hatId) {
  switch (hatId) {
    case 'top-hat':
      return `
        <rect x="47" y="4" width="22" height="3" rx="1" fill="#1a1a1a"/>
        <rect x="50" y="-2" width="16" height="8" rx="1" fill="#222"/>
        <rect x="52" y="0" width="12" height="1" fill="#444"/>
      `;
    case 'crown':
      return `
        <path d="M48 8 L52 -1 L56 6 L60 -1 L64 6 L68 -1 L72 8 Z" fill="#FFC107" stroke="#F57F17" stroke-width="1"/>
        <circle cx="52" cy="3" r="1.2" fill="#FFEB3B"/>
        <circle cx="60" cy="3" r="1.2" fill="#FFEB3B"/>
        <circle cx="68" cy="3" r="1.2" fill="#FFEB3B"/>
      `;
    case 'cap':
      return `
        <ellipse cx="60" cy="8" rx="14" ry="5" fill="#1976D2"/>
        <ellipse cx="68" cy="10" rx="10" ry="3" fill="#1565C0"/>
        <rect x="48" y="4" width="20" height="5" rx="3" fill="#1E88E5"/>
      `;
    case 'cowboy':
      return `
        <ellipse cx="60" cy="10" rx="18" ry="5" fill="#8D6E63" stroke="#5D4037" stroke-width="1"/>
        <path d="M50 6 Q60 -2 70 6 L68 10 Q60 4 52 10 Z" fill="#A1887F" stroke="#5D4037" stroke-width="1"/>
      `;
    case 'beanie':
      return `
        <ellipse cx="60" cy="7" rx="12" ry="7" fill="#E53935"/>
        <circle cx="60" cy="-1" r="3" fill="#FFCDD2"/>
        <path d="M48 8 Q60 14 72 8" stroke="#B71C1C" stroke-width="1.5" fill="none"/>
      `;
    case 'party':
      return `
        <path d="M54 10 L60 -4 L66 10 Z" fill="#E91E63" stroke="#AD1457" stroke-width="1"/>
        <circle cx="57" cy="2" r="1.2" fill="#FFEB3B"/>
        <circle cx="63" cy="0" r="1.2" fill="#4FC3F7"/>
        <circle cx="60" cy="6" r="1.2" fill="#81C784"/>
        <ellipse cx="60" cy="10" rx="10" ry="2" fill="#F48FB1"/>
      `;
    case 'wizard':
      return `
        <path d="M50 10 L60 -6 L70 10 Z" fill="#5E35B1" stroke="#311B92" stroke-width="1"/>
        <ellipse cx="60" cy="10" rx="12" ry="2.5" fill="#311B92"/>
        <circle cx="58" cy="2" r="1.5" fill="#FFD54F"/>
        <circle cx="63" cy="4" r="1" fill="#FFD54F"/>
      `;
    case 'sombrero':
      return `
        <ellipse cx="60" cy="12" rx="22" ry="5" fill="#F9A825" stroke="#E65100" stroke-width="1"/>
        <ellipse cx="60" cy="6" rx="10" ry="6" fill="#FFB300" stroke="#E65100" stroke-width="1"/>
        <path d="M54 4 Q60 0 66 4" stroke="#E65100" stroke-width="1" fill="none"/>
      `;
    case 'propeller':
      return `
        <rect x="57" y="2" width="6" height="8" rx="1" fill="#78909C"/>
        <ellipse cx="60" cy="0" rx="12" ry="3" fill="#EF5350" opacity="0.9"/>
        <ellipse cx="60" cy="0" rx="3" ry="12" fill="#42A5F5" opacity="0.9"/>
        <circle cx="60" cy="0" r="2" fill="#37474F"/>
      `;
    case 'headband':
      return `
        <rect x="46" y="10" width="28" height="4" rx="2" fill="#E53935"/>
        <circle cx="60" cy="12" r="3" fill="#FFEB3B" stroke="#F9A825" stroke-width="0.8"/>
      `;
    case 'pirate':
      return `
        <path d="M46 12 Q60 2 74 12 L72 14 Q60 6 48 14 Z" fill="#212121"/>
        <circle cx="58" cy="8" r="2" fill="#FFD700"/>
        <path d="M74 10 L78 14 L74 16 Z" fill="#212121"/>
      `;
    case 'visor':
      return `
        <path d="M46 10 Q60 6 74 10 L72 14 Q60 10 48 14 Z" fill="#00ACC1"/>
        <rect x="48" y="8" width="24" height="3" rx="1.5" fill="#26C6DA"/>
      `;
    default:
      return '';
  }
}

function getAccessorySVG(accessoryId) {
  switch (accessoryId) {
    case 'bowtie':
      return `
        <path d="M42 30 L46 33 L42 36 L38 33 Z" fill="#D32F2F"/>
        <path d="M46 30 L50 33 L46 36 L42 33 Z" fill="#D32F2F"/>
        <circle cx="46" cy="33" r="1.5" fill="#B71C1C"/>
      `;
    case 'tie':
      return `
        <path d="M45 29 L42 33 L45 43 L48 33 Z" fill="#1565C0"/>
        <rect x="44" y="33" width="4" height="11" rx="1" fill="#0D47A1"/>
      `;
    case 'scarf':
      return `
        <path d="M38 30 Q46 34 52 30" stroke="#43A047" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M44 32 L42 40 L46 40 Z" fill="#2E7D32"/>
      `;
    case 'chain':
      return `
        <path d="M40 30 Q46 33 52 30" stroke="#FFD700" stroke-width="1.5" fill="none"/>
        <circle cx="46" cy="33" r="2.5" fill="#FFC107" stroke="#FF8F00" stroke-width="0.8"/>
      `;
    case 'shades':
      return `
        <rect x="54" y="15" width="9" height="5" rx="1.5" fill="#111"/>
        <line x1="54" y1="17" x2="50" y2="16" stroke="#111" stroke-width="1.2"/>
      `;
    case 'monocle':
      return `
        <circle cx="58" cy="18" r="4.5" fill="rgba(200,230,255,0.15)" stroke="#B8860B" stroke-width="1.5"/>
        <line x1="62" y1="18" x2="68" y2="22" stroke="#B8860B" stroke-width="1"/>
      `;
    case 'mustache':
      return `
        <path d="M66 25 Q70 28 74 25 Q70 27 66 25" fill="#4E342E"/>
        <path d="M72 25 Q76 28 80 25 Q76 27 72 25" fill="#4E342E"/>
      `;
    case 'medal':
      return `
        <path d="M26 32 L28 36 L26 38 Z" fill="#D32F2F"/>
        <path d="M34 32 L32 36 L34 38 Z" fill="#1565C0"/>
        <circle cx="30" cy="37" r="3.5" fill="#FFD700" stroke="#FF8F00" stroke-width="0.8"/>
        <text x="30" y="38.5" text-anchor="middle" font-size="4" font-weight="700" fill="#E65100">1</text>
      `;
    case 'headphones':
      return `
        <path d="M44 12 Q58 6 72 12" stroke="#37474F" stroke-width="2.5" fill="none"/>
        <rect x="41" y="10" width="6" height="10" rx="2" fill="#455A64"/>
        <rect x="69" y="10" width="6" height="10" rx="2" fill="#455A64"/>
      `;
    case 'lei':
      return `
        <ellipse cx="46" cy="31" rx="11" ry="4" fill="none" stroke="#E91E63" stroke-width="2.5"/>
        <circle cx="38" cy="30" r="2" fill="#F48FB1"/>
        <circle cx="46" cy="33" r="2" fill="#FFEB3B"/>
        <circle cx="54" cy="30" r="2" fill="#81C784"/>
      `;
    case 'mask':
      return `
        <rect x="50" y="14" width="18" height="7" rx="3" fill="#5C6BC0"/>
        <text x="59" y="19.5" text-anchor="middle" font-size="4.5" fill="#fff">zZ</text>
      `;
    default:
      return '';
  }
}

function getOutfitBackSVG(outfitId) {
  if (outfitId !== 'cape') return '';
  return `
    <path d="M40 26 C24 28 8 38 2 50 C0 52 6 52 10 48 C18 40 30 36 40 34 Z" fill="#C62828" opacity="0.95"/>
    <path d="M44 26 C50 38 52 46 48 50 C54 46 56 36 52 28 Z" fill="#B71C1C" opacity="0.85"/>
  `;
}

function getOutfitHeadSVG(outfitId) {
  if (outfitId === 'hoodie') {
    return `
      <ellipse cx="50" cy="26" rx="11" ry="7" fill="#5D4037" opacity="0.8"/>
      <path d="M50 19 Q38 17 34 25" stroke="#5D4037" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    `;
  }
  if (outfitId === 'cape') {
    return `
      <path d="M40 28 Q46 32 50 28" stroke="#B71C1C" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="46" cy="30" r="1.5" fill="#FFD700"/>
    `;
  }
  return '';
}

function getOutfitFrontSVG(outfitId) {
  switch (outfitId) {
    case 'jersey':
      return `
        <path d="${TORSO_OVERLAY}" fill="#1E88E5" opacity="0.92"/>
        <path d="M14 31 L10 35 L14 38 L18 35 Z" fill="#1565C0"/>
        <text x="30" y="38" text-anchor="middle" font-size="6" font-weight="700" fill="#fff">FF</text>
      `;
    case 'tuxedo':
      return `
        <path d="${TORSO_OVERLAY}" fill="#212121" opacity="0.9"/>
        <path d="M26 30 L30 40 L34 30 Z" fill="#fff"/>
        <path d="M28 30 L30 36 L32 30" fill="#212121"/>
      `;
    case 'hoodie':
      return `
        <path d="M10 30 Q34 24 50 30 L48 44 Q34 48 12 44 Z" fill="#6D4C41" opacity="0.88"/>
      `;
    case 'tutu':
      return `
        <path d="M10 38 Q18 34 26 38 Q34 34 42 38 Q50 34 56 38" fill="#F8BBD0" opacity="0.9"/>
        <path d="M12 40 L10 47 Q34 51 56 47 L54 40 Z" fill="#F48FB1" opacity="0.88"/>
        <path d="M14 42 Q26 38 38 42 Q50 38 54 42" stroke="#EC407A" stroke-width="1" fill="none"/>
      `;
    case 'hawaiian':
      return `
        <path d="${TORSO_OVERLAY}" fill="#26C6DA" opacity="0.88"/>
        <circle cx="22" cy="34" r="2.2" fill="#FF7043"/>
        <circle cx="32" cy="38" r="2" fill="#FFEB3B"/>
        <circle cx="40" cy="33" r="1.8" fill="#66BB6A"/>
        <circle cx="28" cy="36" r="1.5" fill="#AB47BC"/>
      `;
    case 'armor':
      return `
        <path d="${TORSO_OVERLAY}" fill="#90A4AE" opacity="0.92" stroke="#546E7A" stroke-width="1"/>
        <path d="M22 32 L30 30 L42 32 L42 40 L30 42 L22 40 Z" fill="#B0BEC5" opacity="0.95"/>
        <line x1="22" y1="35" x2="42" y2="35" stroke="#546E7A" stroke-width="0.8"/>
        <line x1="22" y1="38" x2="42" y2="38" stroke="#546E7A" stroke-width="0.8"/>
      `;
    default:
      return '';
  }
}

function getDuckEyes(accessoryId) {
  if (FACE_ACCESSORIES.has(accessoryId)) {
    return getAccessorySVG(accessoryId);
  }
  return '<circle cx="58" cy="18" r="3" fill="#1a1a1a"/><circle cx="59" cy="17" r="1" fill="#fff" opacity="0.7"/>';
}

function getAccessoryLayer(accessoryId) {
  if (accessoryId === 'none' || FACE_ACCESSORIES.has(accessoryId)) return '';
  return getAccessorySVG(accessoryId);
}

function getAccessoryLayerSlot(accessoryId) {
  if (BEAK_ACCESSORIES.has(accessoryId)) return 'beak';
  if (NECK_ACCESSORIES.has(accessoryId)) return 'neck';
  if (CHEST_ACCESSORIES.has(accessoryId)) return 'chest';
  if (HEAD_ACCESSORIES.has(accessoryId)) return 'head';
  return '';
}

function normalizeDuckStyle(style = {}) {
  let accessory = style.accessory;
  let outfit = style.outfit;

  if (accessory === 'jersey') {
    accessory = 'none';
    outfit = outfit === 'none' ? 'jersey' : outfit;
  }

  return {
    hat: HAT_OPTIONS.some((option) => option.id === style.hat) ? style.hat : 'none',
    accessory: ACCESSORY_OPTIONS.some((option) => option.id === accessory) ? accessory : 'none',
    outfit: OUTFIT_OPTIONS.some((option) => option.id === outfit) ? outfit : 'none',
  };
}

function createRubberDuckSVG(color, number, style = DEFAULT_DUCK_STYLE) {
  const customization = normalizeDuckStyle(style);
  const darker = shadeColor(color, -18);
  const beak = '#FF8C00';
  const hatLayer = getHatSVG(customization.hat);
  const outfitBack = getOutfitBackSVG(customization.outfit);
  const outfitFront = getOutfitFrontSVG(customization.outfit);
  const outfitHead = getOutfitHeadSVG(customization.outfit);
  const eyes = getDuckEyes(customization.accessory);
  const accessorySlot = getAccessoryLayerSlot(customization.accessory);
  const accessoryLayer = getAccessoryLayer(customization.accessory);

  return `
    <svg class="rubber-duck-svg" viewBox="0 0 88 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${outfitBack}
      <ellipse cx="34" cy="36" rx="26" ry="13" fill="${color}" stroke="${darker}" stroke-width="1.2"/>
      <ellipse cx="34" cy="36" rx="18" ry="8" fill="${darker}" opacity="0.25"/>
      ${outfitFront}
      <circle cx="56" cy="22" r="15" fill="${color}" stroke="${darker}" stroke-width="1.2"/>
      ${outfitHead}
      ${accessorySlot === 'head' ? accessoryLayer : ''}
      <ellipse cx="72" cy="24" rx="9" ry="5.5" fill="${beak}" stroke="#E07000" stroke-width="1"/>
      ${accessorySlot === 'beak' ? accessoryLayer : ''}
      ${eyes}
      ${accessorySlot === 'neck' ? accessoryLayer : ''}
      ${accessorySlot === 'chest' ? accessoryLayer : ''}
      <ellipse cx="24" cy="32" rx="11" ry="7" fill="${darker}" opacity="0.45"/>
      <circle cx="20" cy="24" r="11" fill="#fff" stroke="#bbb" stroke-width="1.5"/>
      <text x="20" y="28" text-anchor="middle" font-family="Fredoka, Arial, sans-serif" font-size="13" font-weight="700" fill="#333">${number}</text>
      ${hatLayer}
    </svg>
  `;
}

function createDriftwoodSVG() {
  return `
    <svg class="driftwood-svg" viewBox="0 0 56 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="28" cy="16" rx="24" ry="9" fill="#6D4C2C" stroke="#4E342E" stroke-width="1.2"/>
      <ellipse cx="18" cy="14" rx="8" ry="5" fill="#5D4037" opacity="0.5"/>
      <ellipse cx="38" cy="17" rx="10" ry="4" fill="#5D4037" opacity="0.35"/>
      <circle cx="12" cy="15" r="2.5" fill="#4E342E"/>
      <circle cx="42" cy="14" r="2" fill="#4E342E"/>
      <path d="M8 16 Q14 12 20 16" stroke="#4E342E" stroke-width="1.5" fill="none" opacity="0.6"/>
    </svg>
  `;
}

function createLilyPadSVG() {
  return `
    <svg class="lilypad-svg" viewBox="0 0 48 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="24" cy="28" rx="20" ry="10" fill="#43A047" stroke="#2E7D32" stroke-width="1.2"/>
      <path d="M24 18 L24 38" stroke="#2E7D32" stroke-width="1.5" opacity="0.5"/>
      <path d="M14 28 Q24 22 34 28" stroke="#66BB6A" stroke-width="1" fill="none"/>
      <g class="lilypad-frog-art">
        <ellipse cx="24" cy="14" rx="9" ry="7" fill="#66BB6A" stroke="#388E3C" stroke-width="1"/>
        <circle cx="19" cy="12" r="3.5" fill="#81C784"/>
        <circle cx="29" cy="12" r="3.5" fill="#81C784"/>
        <circle cx="19" cy="12" r="1.5" fill="#1B5E20"/>
        <circle cx="29" cy="12" r="1.5" fill="#1B5E20"/>
        <ellipse cx="24" cy="16" rx="3" ry="2" fill="#A5D6A7"/>
      </g>
    </svg>
  `;
}

function createMiniDuckSVG(color, style = DEFAULT_DUCK_STYLE, size = 28) {
  const customization = normalizeDuckStyle(style);
  const hatLayer = getHatSVG(customization.hat);
  const outfitBack = getOutfitBackSVG(customization.outfit);
  const outfitFront = getOutfitFrontSVG(customization.outfit);
  const outfitHead = getOutfitHeadSVG(customization.outfit);
  const eyes = getDuckEyes(customization.accessory);
  const accessorySlot = getAccessoryLayerSlot(customization.accessory);
  const accessoryLayer = getAccessoryLayer(customization.accessory);

  return `
    <svg width="${size}" height="${size * 0.6}" viewBox="0 0 88 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${outfitBack}
      <ellipse cx="34" cy="36" rx="26" ry="13" fill="${color}"/>
      ${outfitFront}
      <circle cx="56" cy="22" r="15" fill="${color}"/>
      ${outfitHead}
      ${accessorySlot === 'head' ? accessoryLayer : ''}
      <ellipse cx="72" cy="24" rx="9" ry="5.5" fill="#FF8C00"/>
      ${accessorySlot === 'beak' ? accessoryLayer : ''}
      ${eyes}
      ${accessorySlot === 'neck' ? accessoryLayer : ''}
      ${accessorySlot === 'chest' ? accessoryLayer : ''}
      ${hatLayer}
    </svg>
  `;
}

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getDuckColor(index) {
  return DUCK_BODY_COLORS[index % DUCK_BODY_COLORS.length];
}
