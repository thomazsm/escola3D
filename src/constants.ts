export type RoomType = 'classroom' | 'admin' | 'sports' | 'service' | 'common' | 'library' | 'cafeteria' | 'laboratory' | 'playground' | 'tree' | 'bush' | 'stairs' | 'garden' | 'court' | 'parking';
export type FloorMaterial = 'wood' | 'tile' | 'carpet' | 'grass' | 'concrete' | 'gym' | 'asphalt' | 'dirt';

export interface FurnitureItem {
  id: string;
  type: 'desk' | 'chair' | 'whiteboard' | 'teacher_desk' | 'shelf' | 'tree' | 'bush' | 'projector' | 'trash_can' | 'cabinet' | 'cafeteria_table' | 'bench' | 'counter' | 'park_bench' | 'street_light' | 'recycle_bin' | 'round_table' | 'auditorium_chair' | 'stage' | 'gate' | string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface RoomData {
  id: string;
  name: string;
  type: RoomType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  depth?: number;
  rotation?: number;
  floor?: number;
  floorMaterial?: FloorMaterial;
  wallColor?: string;
  wallMaterial?: 'paint' | 'brick' | 'wood';
  hasRoof?: boolean;
  noRoof?: boolean;
  noWalls?: boolean;
  roofType?: 'flat' | 'sloped' | 'glass';
  furniture?: FurnitureItem[];
  occupancy?: number; // 0 to 1 for heatmap
  equipment?: string[];
  currentClass?: string;
  teacher?: string;
  photos?: string[];
}

export type POIType = 'water' | 'extinguisher' | 'exit' | 'wifi';
export interface POIData {
  id: string;
  type: POIType;
  x: number;
  y: number;
}

export const POIS: POIData[] = [
  { id: 'ext-1', type: 'extinguisher', x: -35, y: 30 },
  { id: 'ext-2', type: 'extinguisher', x: -35, y: 0 },
  { id: 'ext-3', type: 'extinguisher', x: -10, y: -25 },
  { id: 'ext-4', type: 'extinguisher', x: 15, y: -10 },
  { id: 'water-1', type: 'water', x: -20, y: 10 },
  { id: 'water-2', type: 'water', x: 5, y: -20 },
  { id: 'exit-1', type: 'exit', x: 0, y: -48 }, // Entrada de alunos
  { id: 'exit-2', type: 'exit', x: -48, y: 0 },
  { id: 'wifi-1', type: 'wifi', x: -30, y: 20 },
  { id: 'wifi-2', type: 'wifi', x: 10, y: -15 },
];

export const FLOOR_HEIGHT = 3.5;

export const INITIAL_ROOMS: RoomData[] = [
  // --- RUAS E ENTORNO ---
  { id: 'rua-top', name: 'Rua Bruno Samarco', type: 'common', x: 0, y: 48, width: 100, height: 4, color: '#334155', floorMaterial: 'asphalt', noWalls: true, furniture: [
    { id: 'sl-1', type: 'street_light', x: -40, y: 0, rotation: 0, scale: 1 },
    { id: 'sl-2', type: 'street_light', x: -20, y: 0, rotation: 0, scale: 1 },
    { id: 'sl-3', type: 'street_light', x: 0, y: 0, rotation: 0, scale: 1 },
    { id: 'sl-4', type: 'street_light', x: 20, y: 0, rotation: 0, scale: 1 },
    { id: 'sl-5', type: 'street_light', x: 40, y: 0, rotation: 0, scale: 1 },
  ] },
  { id: 'rua-bottom', name: 'Rua Dr. Gomes Neto', type: 'common', x: 0, y: -48, width: 100, height: 4, color: '#334155', floorMaterial: 'asphalt', noWalls: true, furniture: [
    { id: 'sl-6', type: 'street_light', x: -40, y: 0, rotation: 0, scale: 1 },
    { id: 'sl-7', type: 'street_light', x: -20, y: 0, rotation: 0, scale: 1 },
    { id: 'sl-8', type: 'street_light', x: 0, y: 0, rotation: 0, scale: 1 },
    { id: 'sl-9', type: 'street_light', x: 20, y: 0, rotation: 0, scale: 1 },
    { id: 'sl-10', type: 'street_light', x: 40, y: 0, rotation: 0, scale: 1 },
  ] },
  { id: 'rua-left', name: 'Av. Rio Grande', type: 'common', x: -48, y: 0, width: 4, height: 100, color: '#334155', floorMaterial: 'asphalt', noWalls: true, furniture: [
    { id: 'sl-11', type: 'street_light', x: 0, y: -40, rotation: 90, scale: 1 },
    { id: 'sl-12', type: 'street_light', x: 0, y: -20, rotation: 90, scale: 1 },
    { id: 'sl-13', type: 'street_light', x: 0, y: 0, rotation: 90, scale: 1 },
    { id: 'sl-14', type: 'street_light', x: 0, y: 20, rotation: 90, scale: 1 },
    { id: 'sl-15', type: 'street_light', x: 0, y: 40, rotation: 90, scale: 1 },
  ] },
  { id: 'rua-right', name: 'Av. Washington Luís', type: 'common', x: 48, y: 0, width: 4, height: 100, color: '#334155', floorMaterial: 'asphalt', noWalls: true, furniture: [
    { id: 'sl-16', type: 'street_light', x: 0, y: -40, rotation: -90, scale: 1 },
    { id: 'sl-17', type: 'street_light', x: 0, y: -20, rotation: -90, scale: 1 },
    { id: 'sl-18', type: 'street_light', x: 0, y: 0, rotation: -90, scale: 1 },
    { id: 'sl-19', type: 'street_light', x: 0, y: 20, rotation: -90, scale: 1 },
    { id: 'sl-20', type: 'street_light', x: 0, y: 40, rotation: -90, scale: 1 },
  ] },
  
  // --- MURO PERIMETRAL ---
  { id: 'muro-left', name: 'Muro', type: 'service', x: -45, y: 0, width: 0.5, height: 90, color: '#94a3b8' },
  { id: 'muro-right', name: 'Muro', type: 'service', x: 45, y: 0, width: 0.5, height: 90, color: '#94a3b8' },
  { id: 'muro-top', name: 'Muro', type: 'service', x: 0, y: 45, width: 90, height: 0.5, color: '#94a3b8' },
  { id: 'muro-bottom', name: 'Muro', type: 'service', x: 0, y: -45, width: 90, height: 0.5, color: '#94a3b8' },

  // --- ÁRVORES E VEGETAÇÃO (Perímetro) ---
  { id: 'tree-1', name: 'Árvore', type: 'tree', x: -43, y: 43, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-2', name: 'Árvore', type: 'tree', x: -43, y: 30, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-3', name: 'Árvore', type: 'tree', x: -43, y: 10, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-4', name: 'Árvore', type: 'tree', x: -43, y: -10, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-5', name: 'Árvore', type: 'tree', x: -43, y: -30, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-6', name: 'Árvore', type: 'tree', x: 43, y: 43, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-7', name: 'Árvore', type: 'tree', x: 43, y: 20, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-8', name: 'Árvore', type: 'tree', x: 43, y: 0, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-9', name: 'Árvore', type: 'tree', x: 43, y: -20, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-10', name: 'Árvore', type: 'tree', x: 43, y: -40, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-11', name: 'Árvore', type: 'tree', x: 25, y: 43, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-12', name: 'Árvore', type: 'tree', x: 15, y: 43, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-13', name: 'Árvore', type: 'tree', x: 30, y: -43, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-14', name: 'Árvore', type: 'tree', x: 20, y: -43, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-15', name: 'Árvore', type: 'tree', x: -20, y: -43, width: 2, height: 1.5, color: '#166534' },
  { id: 'tree-16', name: 'Árvore', type: 'tree', x: -30, y: -43, width: 2, height: 1.5, color: '#166534' },

  // --- ESTACIONAMENTO ---
  { id: 'estac', name: 'Estacionamento', type: 'parking', x: -25, y: 40, width: 40, height: 10, color: '#475569', floorMaterial: 'asphalt', noWalls: true, furniture: [
    { id: 'gate-1', type: 'gate', x: 0, y: 5, rotation: 0, scale: 1 },
    { id: 'car-1', type: 'car', x: -15, y: 0, rotation: 180, scale: 1 },
    { id: 'car-2', type: 'car', x: -10, y: 0, rotation: 180, scale: 1 },
    { id: 'car-3', type: 'car', x: -5, y: 0, rotation: 180, scale: 1 },
    { id: 'car-4', type: 'car', x: 5, y: 0, rotation: 180, scale: 1 },
    { id: 'car-5', type: 'car', x: 10, y: 0, rotation: 180, scale: 1 },
    { id: 'car-6', type: 'car', x: 15, y: 0, rotation: 180, scale: 1 },
  ] },

  // --- ALA ADMINISTRATIVA E SALAS (Esquerda) ---
  { id: 'sala-prof-1', name: 'Sala dos Prof.', type: 'admin', x: -38, y: 35, width: 12, height: 8, color: '#fbcfe8', photos: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800'] },
  { id: 'sala-prof-2', name: 'Sala dos Prof.', type: 'admin', x: -38, y: 27, width: 12, height: 8, color: '#fbcfe8' },
  { id: 'recurso-1', name: 'Recurso', type: 'admin', x: -38, y: 21, width: 12, height: 4, color: '#fbcfe8' },
  { id: 'coord', name: 'Coordenação', type: 'admin', x: -38, y: 16, width: 12, height: 6, color: '#fbcfe8' },
  { id: 'recurso-2', name: 'Recurso', type: 'admin', x: -38, y: 11, width: 12, height: 4, color: '#fbcfe8' },
  { id: 'direcao', name: 'Direção', type: 'admin', x: -38, y: 6, width: 12, height: 6, color: '#fbcfe8', photos: ['https://images.unsplash.com/photo-1573164060897-4259418d7718?auto=format&fit=crop&q=80&w=800'] },
  { id: 'recurso-3', name: 'Recurso', type: 'admin', x: -38, y: 1, width: 12, height: 4, color: '#fbcfe8' },
  { id: 'sala-01-esq', name: 'Sala 01', type: 'classroom', x: -38, y: -4, width: 12, height: 6, color: '#bfdbfe', photos: ['https://images.unsplash.com/photo-1509062522246-3755999927d7?auto=format&fit=crop&q=80&w=800'] },
  { id: 'sala-02-esq', name: 'Sala 02', type: 'classroom', x: -38, y: -10, width: 12, height: 6, color: '#bfdbfe', photos: ['https://images.unsplash.com/photo-1544648397-52ee9d67803c?auto=format&fit=crop&q=80&w=800'] },
  { id: 'sala-03-esq', name: 'Sala 03', type: 'classroom', x: -38, y: -16, width: 12, height: 6, color: '#bfdbfe' },
  { id: 'sala-15-esq', name: 'Sala 15', type: 'classroom', x: -38, y: -22, width: 12, height: 6, color: '#bfdbfe' },
  { id: 'secretaria', name: 'Secretaria', type: 'admin', x: -38, y: -29, width: 12, height: 8, color: '#fbcfe8' },
  { id: 'vicedirecao', name: 'Vice-Direção', type: 'admin', x: -38, y: -36, width: 12, height: 6, color: '#fbcfe8' },

  // --- ALA ACADÊMICA SUPERIOR (Abaixo do Estacionamento) ---
  { id: 'lab-inf-1', name: 'Lab. Inf.', type: 'classroom', x: -25, y: 25, width: 8, height: 8, color: '#bfdbfe' },
  { id: 'sala-13', name: 'Sala 13', type: 'classroom', x: -16, y: 25, width: 8, height: 8, color: '#bfdbfe' },
  { id: 'sila-coberto', name: 'Sila Coberto', type: 'common', x: -12, y: 18, width: 12, height: 6, color: '#e2e8f0', floorMaterial: 'tile', noWalls: true, hasRoof: true, roofType: 'flat' },
  { id: 'alm-1', name: 'Alm.', type: 'service', x: -9, y: 25, width: 4, height: 8, color: '#cbd5e1' },
  { id: 'sala-15-sup', name: 'Sala 15', type: 'classroom', x: -3, y: 25, width: 8, height: 8, color: '#bfdbfe' },

  // --- ILHA CENTRAL ---
  { id: 'sala-02-ilha', name: 'Sala 02', type: 'classroom', x: -15, y: -5, width: 8, height: 8, color: '#bfdbfe' },
  { id: 'escada-ilha', name: 'Escada', type: 'stairs', x: -9, y: -5, width: 4, height: 8, color: '#94a3b8' },
  { id: 'lab-inf-2', name: 'Lab. Inf.', type: 'classroom', x: -3, y: -5, width: 8, height: 8, color: '#bfdbfe' },
  { id: 'sala-05-ilha', name: 'Sala 05', type: 'classroom', x: 5, y: -5, width: 8, height: 8, color: '#bfdbfe' },
  { id: 'alm-2', name: 'Alm.', type: 'service', x: 11, y: -5, width: 4, height: 8, color: '#cbd5e1' },

  // --- ALA ACADÊMICA (Inferior) ---
  { id: 'sala-15-inf', name: 'Sala 15', type: 'classroom', x: -25, y: -38, width: 8, height: 10, color: '#bfdbfe' },
  { id: 'sala-06', name: 'Sala 06', type: 'classroom', x: -16, y: -38, width: 8, height: 10, color: '#bfdbfe' },
  { id: 'sala-07', name: 'Sala 07', type: 'classroom', x: -7, y: -38, width: 8, height: 10, color: '#bfdbfe' },
  { id: 'escada-inf', name: 'Escada', type: 'stairs', x: -1.5, y: -38, width: 3, height: 10, color: '#94a3b8' },
  { id: 'sala-03', name: 'Sala 03', type: 'classroom', x: 4, y: -38, width: 8, height: 10, color: '#bfdbfe' },
  { id: 'sala-02-inf', name: 'Sala 02', type: 'classroom', x: 13, y: -38, width: 8, height: 10, color: '#bfdbfe' },
  { id: 'sala-11', name: 'Sala 11', type: 'classroom', x: 22, y: -38, width: 8, height: 10, color: '#bfdbfe' },

  // --- BLOCO CENTRAL (Pátios) ---
  { id: 'patio-1', name: 'Pátio Coberto', type: 'common', x: -5, y: 10, width: 35, height: 20, color: '#e2e8f0', floorMaterial: 'tile', noWalls: true, hasRoof: true, roofType: 'glass', furniture: [
    { id: 'pt1-1', type: 'round_table', x: -10, y: 0, rotation: 0, scale: 1 },
    { id: 'pt1-2', type: 'round_table', x: 0, y: 0, rotation: 0, scale: 1 },
    { id: 'pt1-3', type: 'round_table', x: 10, y: 0, rotation: 0, scale: 1 },
    { id: 'pt1-4', type: 'round_table', x: -10, y: 5, rotation: 0, scale: 1 },
    { id: 'pt1-5', type: 'round_table', x: 0, y: 5, rotation: 0, scale: 1 },
    { id: 'pt1-6', type: 'round_table', x: 10, y: 5, rotation: 0, scale: 1 },
  ] },
  { id: 'patio-2', name: 'Pátio Coberto', type: 'common', x: -5, y: -20, width: 35, height: 20, color: '#e2e8f0', floorMaterial: 'tile', noWalls: true, hasRoof: true, roofType: 'glass', furniture: [
    { id: 'pt2-1', type: 'round_table', x: -10, y: 0, rotation: 0, scale: 1 },
    { id: 'pt2-2', type: 'round_table', x: 0, y: 0, rotation: 0, scale: 1 },
    { id: 'pt2-3', type: 'round_table', x: 10, y: 0, rotation: 0, scale: 1 },
    { id: 'pt2-4', type: 'round_table', x: -5, y: 5, rotation: 0, scale: 1 },
    { id: 'pt2-5', type: 'round_table', x: 5, y: 5, rotation: 0, scale: 1 },
    { id: 'pt2-6', type: 'round_table', x: -10, y: -5, rotation: 0, scale: 1 },
    { id: 'pt2-7', type: 'round_table', x: 0, y: -5, rotation: 0, scale: 1 },
    { id: 'pt2-8', type: 'round_table', x: 10, y: -5, rotation: 0, scale: 1 },
  ] },
  { id: 'auditorio', name: 'Auditório', type: 'common', x: 20, y: -20, width: 18, height: 15, rotation: 45, color: '#fef08a', floorMaterial: 'wood', furniture: [
    { id: 'stg-1', type: 'stage', x: 0, y: -5, rotation: 0, scale: 1 },
    { id: 'ch-1', type: 'auditorium_chair', x: -4, y: 0, rotation: 0, scale: 1 },
    { id: 'ch-2', type: 'auditorium_chair', x: 0, y: 0, rotation: 0, scale: 1 },
    { id: 'ch-3', type: 'auditorium_chair', x: 4, y: 0, rotation: 0, scale: 1 },
    { id: 'ch-4', type: 'auditorium_chair', x: -4, y: 3, rotation: 0, scale: 1 },
    { id: 'ch-5', type: 'auditorium_chair', x: 0, y: 3, rotation: 0, scale: 1 },
    { id: 'ch-6', type: 'auditorium_chair', x: 4, y: 3, rotation: 0, scale: 1 },
  ] },

  // --- SERVIÇOS E REFEITÓRIO (Superior Centro/Direita) ---
  // Bloco Superior (Cantina e WCs)
  { id: 'wcf-1', name: 'WCF', type: 'service', x: 2, y: 35, width: 4, height: 6, color: '#cbd5e1' },
  { id: 'wcf-2', name: 'WCF', type: 'service', x: 6, y: 35, width: 4, height: 6, color: '#cbd5e1' },
  { id: 'refeitorio-1', name: 'Refeitório', type: 'cafeteria', x: 12, y: 35, width: 8, height: 6, color: '#fed7aa', floorMaterial: 'tile' },
  { id: 'cantina', name: 'Cantina', type: 'cafeteria', x: 10, y: 26, width: 20, height: 12, color: '#fed7aa', floorMaterial: 'tile' },
  
  // Bloco Inferior (Cozinha e Anexos)
  { id: 'cozinha', name: 'Cozinha', type: 'service', x: 10, y: 15, width: 10, height: 8, color: '#cbd5e1' },
  { id: 'alm-ref', name: 'Alm.', type: 'service', x: 17, y: 15, width: 4, height: 8, color: '#cbd5e1' },
  { id: 'refeitorio-2', name: 'Refeitório', type: 'cafeteria', x: 23, y: 15, width: 8, height: 8, color: '#fed7aa', floorMaterial: 'tile' },
  { id: 'sala-15-ref', name: 'Sala 15', type: 'classroom', x: 29, y: 15, width: 4, height: 8, color: '#bfdbfe' },

  // --- ALA ESPORTIVA (Direita) ---
  { id: 'quadra-desc-1', name: 'Quadra Descoberta', type: 'sports', x: 30, y: 30, width: 26, height: 16, color: '#10b981', floorMaterial: 'asphalt', noWalls: true, noRoof: true },
  { id: 'quadra-desc-2', name: 'Quadra Descoberta', type: 'sports', x: 35, y: 10, width: 16, height: 26, rotation: -20, color: '#10b981', floorMaterial: 'asphalt', noWalls: true, noRoof: true },
  { id: 'quadra-cob', name: 'Quadra Coberta', type: 'sports', x: 35, y: -15, width: 26, height: 16, rotation: -45, color: '#059669', floorMaterial: 'gym', noWalls: true, hasRoof: true },
  
  // --- ZELADORIA (Inferior Direita) ---
  { id: 'zel-sala', name: 'Sala/Cozinha', type: 'service', x: 35, y: -30, width: 10, height: 6, color: '#cbd5e1' },
  { id: 'zel-quarto1', name: 'Quarto', type: 'service', x: 33, y: -36, width: 6, height: 6, color: '#cbd5e1' },
  { id: 'zel-quarto2', name: 'Quarto', type: 'service', x: 39, y: -36, width: 6, height: 6, color: '#cbd5e1' },
  { id: 'zel-wc', name: 'WC', type: 'service', x: 43, y: -30, width: 6, height: 6, color: '#cbd5e1' },

  // --- ENTRADA ---
  { id: 'entrada', name: 'Entrada de Alunos', type: 'common', x: 0, y: -44, width: 10, height: 2, color: '#94a3b8', noWalls: true, furniture: [
    { id: 'gate-2', type: 'gate', x: 0, y: 0, rotation: 0, scale: 1 }
  ] },
];

