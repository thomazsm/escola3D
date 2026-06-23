/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Grid, Center, Environment, ContactShadows, Sky, KeyboardControls, useKeyboardControls, Html, Line, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { INITIAL_ROOMS, RoomData, RoomType, FurnitureItem, FLOOR_HEIGHT, POIS, POIData } from './constants';
import { Box, Layers, Maximize2, Minimize2, MousePointer2, RotateCcw, Info, Sun, TreePine, Armchair, Plus, Trash2, Home, Eye, Move, Play, Pause, Search, Volume2, VolumeX, Folder, Save, Check, X, Ruler, Camera, Activity, Palette, Maximize, Minimize, ChevronUp, ChevronDown, Map, MapPin, ShieldAlert, Droplets, Flame, DoorOpen, Wifi, BarChart3, Video, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './lib/utils';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { getTexture } from './lib/textures';
import { SceneExporter } from './components/SceneExporter';

import { XR, VRButton, createXRStore } from '@react-three/xr';

const xrStore = createXRStore();

function RulerTool({ active, points, onAddPoint, onClear }: { active: boolean, points: [number, number, number][], onAddPoint: (p: [number, number, number]) => void, onClear: () => void }) {
  const { viewport } = useThree();
  
  if (!active && points.length === 0) return null;

  const distance = points.length === 2 
    ? new THREE.Vector3(...points[0]).distanceTo(new THREE.Vector3(...points[1])) 
    : 0;

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      ))}
      
      {points.length === 2 && (
        <>
          <Line
            points={points}
            color="#ef4444"
            lineWidth={2}
          />
          <Html position={[
            (points[0][0] + points[1][0]) / 2,
            ((points[0][1] + points[1][1]) / 2) + 0.5,
            (points[0][2] + points[1][2]) / 2
          ]}>
            <div className="bg-red-500 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-lg whitespace-nowrap pointer-events-none flex items-center gap-1">
              <Ruler className="w-3 h-3" />
              {distance.toFixed(2)}m
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

function GalleryModal({ photos, isOpen, onClose, roomName }: { photos: string[], isOpen: boolean, onClose: () => void, roomName: string }) {
  const [index, setIndex] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{roomName}</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Galeria de Fotos Reais</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 relative bg-slate-50 flex items-center justify-center overflow-hidden group">
          <img 
            src={photos[index]} 
            className="max-w-full max-h-full object-contain"
            alt={`${roomName} - ${index + 1}`}
          />
          
          {photos.length > 1 && (
            <>
              <button 
                onClick={() => setIndex((index - 1 + photos.length) % photos.length)}
                className="absolute left-4 p-3 bg-white/20 hover:bg-white/90 backdrop-blur rounded-full text-white hover:text-slate-800 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setIndex((index + 1) % photos.length)}
                className="absolute right-4 p-3 bg-white/20 hover:bg-white/90 backdrop-blur rounded-full text-white hover:text-slate-800 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
        
        <div className="p-4 bg-white flex justify-center gap-2">
          {photos.map((_, i) => (
            <button 
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === index ? "bg-blue-600 w-6" : "bg-slate-200 hover:bg-slate-300"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WeatherEffects({ weather, sunY }: { weather: 'sunny' | 'rainy' | 'snowy', sunY: number }) {
  const points = useRef<THREE.Points>(null);
  const count = 5000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!points.current || weather === 'sunny') return;
    const pos = points.current.geometry.attributes.position.array as Float32Array;
    const speed = weather === 'rainy' ? 0.5 : 0.1;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= speed;
      if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 50;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  if (weather === 'sunny') return null;

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={weather === 'rainy' ? 0.1 : 0.3}
        color={weather === 'rainy' ? "#60a5fa" : "#ffffff"}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function StudentCharacters({ rooms }: { rooms: RoomData[] }) {
  const students = useMemo(() => {
    const list: { id: string, position: [number, number, number], color: string }[] = [];
    rooms.forEach(room => {
      if (room.type === 'classroom' || room.type === 'playground' || room.type === 'common' || room.type === 'sports') {
        const count = room.type === 'classroom' ? 8 : 4;
        for (let i = 0; i < count; i++) {
          list.push({
            id: `student-${room.id}-${i}`,
            position: [
              room.x + (Math.random() - 0.5) * (room.width - 2),
              0.8,
              -(room.y + (Math.random() - 0.5) * (room.height - 2))
            ],
            color: `hsl(${Math.random() * 360}, 70%, 60%)`
          });
        }
      }
    });
    return list;
  }, [rooms]);

  return (
    <group>
      {students.map(s => (
        <group key={s.id} position={s.position}>
          {/* Body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.25, 1.2, 8]} />
            <meshStandardMaterial color={s.color} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.8, 0]} castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#fcd34d" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Car({ position, rotation = 0, color = "red" }: { position: [number, number, number], rotation?: number, color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.8, 0.4, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Cabin */}
      <mesh position={[-0.2, 0.6, 0]} castShadow>
        <boxGeometry args={[0.8, 0.4, 0.7]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Wheels */}
      {[-0.6, 0.6].map(x => [-0.35, 0.35].map(z => (
        <mesh key={`${x}-${z}`} position={[x, 0.1, z]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      )))}
    </group>
  );
}

function StreetLabel({ name, position, rotation = 0 }: { name: string, position: [number, number, number], rotation?: number }) {
  return (
    <Text
      position={position}
      rotation={[-Math.PI / 2, 0, rotation]}
      fontSize={1.5}
      color="#94a3b8"
      anchorX="center"
      anchorY="middle"
      fillOpacity={0.5}
    >
      {name}
    </Text>
  );
}

function FloatingText({ text, position, rotation = 0, fontSize = 1.5, color = "#1e293b" }: { text: string, position: [number, number, number], rotation?: number, fontSize?: number, color?: string }) {
  return (
    <Text
      position={position}
      rotation={[-Math.PI / 2, 0, rotation]}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      fontWeight="bold"
    >
      {text}
    </Text>
  );
}

function LegendBoard() {
  return (
    <group position={[-60, 0.1, 10]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
      {/* Background Panel */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[40, 15]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.8} />
      </mesh>
      {/* Texts */}
      <Text position={[-18, 5, 0]} fontSize={1.2} color="white" anchorX="left">Terreno: 13.654,29 m2</Text>
      <Text position={[-18, 3, 0]} fontSize={1.2} color="white" anchorX="left">Escola: 2.588,24 m2</Text>
      <Text position={[-18, 1, 0]} fontSize={1.2} color="white" anchorX="left">Auditório: 457,40 m2</Text>
      <Text position={[-18, -1, 0]} fontSize={1.2} color="white" anchorX="left">Zeladoria (coberta): 74,00 m2</Text>
      <Text position={[-18, -3, 0]} fontSize={1.2} color="white" anchorX="left">Quadra (descoberta): 792,00 m2</Text>
    </group>
  );
}

function ColorLegend() {
  return (
    <group position={[-60, 0.1, -25]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[25, 12]} />
        <meshBasicMaterial color="#f8fafc" transparent opacity={0.9} />
      </mesh>
      
      {/* Items */}
      <mesh position={[-10, 3, 0]}><circleGeometry args={[0.8, 32]} /><meshBasicMaterial color="#fdba74" /></mesh>
      <Text position={[-8, 3, 0]} fontSize={1.2} color="#1e293b" anchorX="left">WC - Administrativo</Text>

      <mesh position={[-10, 0, 0]}><circleGeometry args={[0.8, 32]} /><meshBasicMaterial color="#93c5fd" /></mesh>
      <Text position={[-8, 0, 0]} fontSize={1.2} color="#1e293b" anchorX="left">WC - Aluno</Text>

      <mesh position={[-10, -3, 0]}><circleGeometry args={[0.8, 32]} /><meshBasicMaterial color="#7dd3fc" /></mesh>
      <Text position={[-8, -3, 0]} fontSize={1.2} color="#1e293b" anchorX="left">Área Quadrada</Text>
    </group>
  );
}

function POI({ data, isEmergency }: { data: POIData; isEmergency: boolean }) {
  const [hovered, setHovered] = useState(false);
  const yPos = 1.5; // Height above ground

  const getIcon = () => {
    switch (data.type) {
      case 'water': return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'extinguisher': return <Flame className="w-4 h-4 text-red-500" />;
      case 'exit': return <DoorOpen className="w-4 h-4 text-green-500" />;
      case 'wifi': return <Wifi className="w-4 h-4 text-slate-500" />;
    }
  };

  const getColor = () => {
    switch (data.type) {
      case 'water': return '#3b82f6';
      case 'extinguisher': return '#ef4444';
      case 'exit': return '#22c55e';
      case 'wifi': return '#64748b';
    }
  };

  const getLabel = () => {
    switch (data.type) {
      case 'water': return 'Water Fountain';
      case 'extinguisher': return 'Fire Extinguisher';
      case 'exit': return 'Emergency Exit';
      case 'wifi': return 'Wi-Fi Point';
    }
  };

  // Highlight exits and extinguishers during emergency
  const isHighlighted = isEmergency && (data.type === 'exit' || data.type === 'extinguisher');

  return (
    <group position={[data.x, yPos, -data.y]}>
      <mesh 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={getColor()} 
          emissive={isHighlighted ? getColor() : '#000000'}
          emissiveIntensity={isHighlighted ? 2 : 0}
          transparent 
          opacity={0.8} 
        />
      </mesh>
      
      {/* Pulsing ring for emergency */}
      {isHighlighted && (
        <mesh>
          <ringGeometry args={[0.4, 0.5, 32]} />
          <meshBasicMaterial color={getColor()} side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      )}

      {hovered && (
        <Html position={[0, 0.5, 0]} center>
          <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg border border-slate-200 flex items-center gap-2 whitespace-nowrap pointer-events-none">
            {getIcon()}
            <span className="text-xs font-bold text-slate-700">{getLabel()}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function Furniture({ 
  type, width, height, isTransparent, customItems,
  selectedFurnitureId, onSelectFurniture, onUpdateFurniturePosition
}: { 
  type: RoomType; width: number; height: number; isTransparent?: boolean; customItems?: FurnitureItem[];
  selectedFurnitureId?: string | null;
  onSelectFurniture?: (id: string) => void;
  onUpdateFurniturePosition?: (id: string, x: number, y: number) => void;
}) {
  const materialProps = {
    transparent: isTransparent,
    opacity: isTransparent ? 0.4 : 1
  };

  if (customItems && customItems.length > 0) {
    return (
      <>
        {customItems.map((item) => {
          const isSelected = selectedFurnitureId === item.id;
          
          const itemContent = (
            <group 
              position={isSelected ? [0, 0, 0] : [item.x, -0.8, -item.y]} 
              rotation={[0, item.rotation * (Math.PI / 180), 0]}
              scale={item.scale}
              onClick={(e) => {
                if (onSelectFurniture) {
                  e.stopPropagation();
                  onSelectFurniture(item.id);
                }
              }}
            >
              {item.type === 'desk' && (
                <group>
                  <mesh castShadow>
                    <boxGeometry args={[0.6, 0.6, 0.4]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#92400e"} {...materialProps} />
                  </mesh>
                  <mesh position={[0, -0.2, 0.3]} castShadow>
                    <boxGeometry args={[0.4, 0.4, 0.3]} />
                    <meshStandardMaterial color="#475569" {...materialProps} />
                  </mesh>
                </group>
              )}
              {item.type === 'chair' && (
                <mesh castShadow>
                  <boxGeometry args={[0.4, 0.4, 0.4]} />
                  <meshStandardMaterial color={isSelected ? "#f59e0b" : "#475569"} {...materialProps} />
                </mesh>
              )}
              {item.type === 'shelf' && (
                <mesh castShadow>
                  <boxGeometry args={[0.4, 1.5, 1]} />
                  <meshStandardMaterial color={isSelected ? "#f59e0b" : "#78350f"} {...materialProps} />
                </mesh>
              )}
              {item.type === 'tree' && (
                <group>
                  <mesh position={[0, 1, 0]} castShadow>
                    <cylinderGeometry args={[0.2, 0.2, 2]} />
                    <meshStandardMaterial color="#451a03" />
                  </mesh>
                  <mesh position={[0, 2.5, 0]} castShadow>
                    <sphereGeometry args={[1.5, 16, 16]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#166534"} />
                  </mesh>
                </group>
              )}
              {item.type === 'bush' && (
                <mesh position={[0, 0.5, 0]} castShadow>
                  <sphereGeometry args={[0.8, 16, 16]} />
                  <meshStandardMaterial color={isSelected ? "#3b82f6" : "#166534"} />
                </mesh>
              )}
              {item.type === 'whiteboard' && (
                <mesh position={[0, 1.5, -0.4]} castShadow>
                  <boxGeometry args={[2, 1.2, 0.05]} />
                  <meshStandardMaterial color={isSelected ? "#3b82f6" : "white"} />
                </mesh>
              )}
              {item.type === 'teacher_desk' && (
                <group>
                  <mesh position={[0, 0.4, 0]} castShadow>
                    <boxGeometry args={[1.5, 0.8, 0.8]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#8B4513"} />
                  </mesh>
                </group>
              )}
              {item.type === 'projector' && (
                <group position={[0, 2.8, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.3, 0.1, 0.3]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#e2e8f0"} />
                  </mesh>
                  <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.2]} />
                    <meshStandardMaterial color="#94a3b8" />
                  </mesh>
                </group>
              )}
              {item.type === 'trash_can' && (
                <mesh position={[0, 0.3, 0]} castShadow>
                  <cylinderGeometry args={[0.2, 0.15, 0.6]} />
                  <meshStandardMaterial color={isSelected ? "#3b82f6" : "#64748b"} />
                </mesh>
              )}
              {item.type === 'cabinet' && (
                <mesh position={[0, 1, 0]} castShadow>
                  <boxGeometry args={[1, 2, 0.5]} />
                  <meshStandardMaterial color={isSelected ? "#f59e0b" : "#d4d4d8"} />
                </mesh>
              )}
              {item.type === 'cafeteria_table' && (
                <group>
                  <mesh position={[0, 0.7, 0]} castShadow>
                    <boxGeometry args={[3, 0.05, 0.8]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#fef08a"} />
                  </mesh>
                  <mesh position={[-1.3, 0.35, 0]} castShadow>
                    <boxGeometry args={[0.1, 0.7, 0.6]} />
                    <meshStandardMaterial color="#94a3b8" />
                  </mesh>
                  <mesh position={[1.3, 0.35, 0]} castShadow>
                    <boxGeometry args={[0.1, 0.7, 0.6]} />
                    <meshStandardMaterial color="#94a3b8" />
                  </mesh>
                </group>
              )}
              {item.type === 'bench' && (
                <mesh position={[0, 0.4, 0]} castShadow>
                  <boxGeometry args={[3, 0.05, 0.4]} />
                  <meshStandardMaterial color={isSelected ? "#3b82f6" : "#fb923c"} />
                </mesh>
              )}
              {item.type === 'counter' && (
                <mesh position={[0, 0.5, 0]} castShadow>
                  <boxGeometry args={[4, 1, 0.8]} />
                  <meshStandardMaterial color={isSelected ? "#3b82f6" : "#e2e8f0"} />
                </mesh>
              )}
              {item.type === 'park_bench' && (
                <group>
                  <mesh position={[0, 0.4, 0]} castShadow>
                    <boxGeometry args={[2, 0.05, 0.5]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#8B4513"} />
                  </mesh>
                  <mesh position={[0, 0.8, -0.2]} rotation={[0.2, 0, 0]} castShadow>
                    <boxGeometry args={[2, 0.4, 0.05]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#8B4513"} />
                  </mesh>
                </group>
              )}
              {item.type === 'street_light' && (
                <group>
                  <mesh position={[0, 2, 0]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 4]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#475569"} />
                  </mesh>
                  <mesh position={[0, 4, 0.2]} castShadow>
                    <boxGeometry args={[0.2, 0.1, 0.6]} />
                    <meshStandardMaterial color="#e2e8f0" />
                  </mesh>
                  <mesh position={[0, 3.95, 0.4]}>
                    <sphereGeometry args={[0.1]} />
                    <meshBasicMaterial color="#fef08a" />
                  </mesh>
                </group>
              )}
              {item.type === 'recycle_bin' && (
                <group position={[0, 0.4, 0]}>
                  <mesh position={[-0.4, 0, 0]} castShadow>
                    <boxGeometry args={[0.3, 0.8, 0.3]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#ef4444"} />
                  </mesh>
                  <mesh position={[0, 0, 0]} castShadow>
                    <boxGeometry args={[0.3, 0.8, 0.3]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#eab308"} />
                  </mesh>
                  <mesh position={[0.4, 0, 0]} castShadow>
                    <boxGeometry args={[0.3, 0.8, 0.3]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#22c55e"} />
                  </mesh>
                </group>
              )}
              {item.type === 'water_fountain' && (
                <group position={[0, 0.5, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[0.4, 1, 0.4]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#cbd5e1"} />
                  </mesh>
                  <mesh position={[0, 0.5, 0.1]} rotation={[Math.PI/2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 0.1]} />
                    <meshStandardMaterial color="#94a3b8" />
                  </mesh>
                </group>
              )}
              {item.type === 'round_table' && (
                <group>
                  <mesh position={[0, 0.7, 0]} castShadow>
                    <cylinderGeometry args={[0.8, 0.8, 0.05, 32]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#fef08a"} />
                  </mesh>
                  <mesh position={[0, 0.35, 0]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 0.7]} />
                    <meshStandardMaterial color="#94a3b8" />
                  </mesh>
                  {/* Chairs */}
                  {[0, Math.PI/2, Math.PI, -Math.PI/2].map((rot, i) => (
                    <group key={i} rotation={[0, rot, 0]}>
                      <mesh position={[0, 0.4, 1.2]} castShadow>
                        <boxGeometry args={[0.4, 0.05, 0.4]} />
                        <meshStandardMaterial color="#3b82f6" />
                      </mesh>
                      <mesh position={[0, 0.8, 1.4]} rotation={[0.2, 0, 0]} castShadow>
                        <boxGeometry args={[0.4, 0.4, 0.05]} />
                        <meshStandardMaterial color="#3b82f6" />
                      </mesh>
                    </group>
                  ))}
                </group>
              )}
              {item.type === 'auditorium_chair' && (
                <group>
                  {[-1, 0, 1].map((x, i) => (
                    <group key={i} position={[x * 0.8, 0, 0]}>
                      <mesh position={[0, 0.4, 0]} castShadow>
                        <boxGeometry args={[0.6, 0.1, 0.5]} />
                        <meshStandardMaterial color={isSelected ? "#f59e0b" : "#ef4444"} />
                      </mesh>
                      <mesh position={[0, 0.8, -0.2]} rotation={[0.1, 0, 0]} castShadow>
                        <boxGeometry args={[0.6, 0.6, 0.1]} />
                        <meshStandardMaterial color={isSelected ? "#f59e0b" : "#ef4444"} />
                      </mesh>
                    </group>
                  ))}
                </group>
              )}
              {item.type === 'stage' && (
                <mesh position={[0, 0.3, 0]} castShadow>
                  <boxGeometry args={[8, 0.6, 4]} />
                  <meshStandardMaterial color={isSelected ? "#f59e0b" : "#8B4513"} />
                </mesh>
              )}
              {item.type === 'gate' && (
                <group>
                  <mesh position={[0, 1, 0]} castShadow>
                    <boxGeometry args={[4, 2, 0.1]} />
                    <meshStandardMaterial color="#475569" wireframe />
                  </mesh>
                  <mesh position={[-2, 1, 0]} castShadow>
                    <boxGeometry args={[0.2, 2, 0.2]} />
                    <meshStandardMaterial color="#334155" />
                  </mesh>
                  <mesh position={[2, 1, 0]} castShadow>
                    <boxGeometry args={[0.2, 2, 0.2]} />
                    <meshStandardMaterial color="#334155" />
                  </mesh>
                </group>
              )}
              {item.type === 'soccer_goal' && (
                <group>
                  <mesh position={[-1.5, 1, 0]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 2]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "white"} />
                  </mesh>
                  <mesh position={[1.5, 1, 0]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 2]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "white"} />
                  </mesh>
                  <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 3]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "white"} />
                  </mesh>
                  <mesh position={[0, 1, -0.5]}>
                    <boxGeometry args={[3, 2, 1]} />
                    <meshBasicMaterial color="white" wireframe transparent opacity={0.2} />
                  </mesh>
                </group>
              )}
              {item.type === 'volleyball_net' && (
                <group>
                  <mesh position={[-2, 1.5, 0]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 3]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#94a3b8"} />
                  </mesh>
                  <mesh position={[2, 1.5, 0]} castShadow>
                    <cylinderGeometry args={[0.05, 0.05, 3]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#94a3b8"} />
                  </mesh>
                  <mesh position={[0, 2.5, 0]}>
                    <boxGeometry args={[4, 0.8, 0.05]} />
                    <meshBasicMaterial color="white" wireframe transparent opacity={0.5} />
                  </mesh>
                </group>
              )}
              {item.type === 'basketball_hoop' && (
                <group>
                  <mesh position={[0, 1.5, -0.5]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 3]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#475569"} />
                  </mesh>
                  <mesh position={[0, 3, 0]} castShadow>
                    <boxGeometry args={[1.2, 0.8, 0.05]} />
                    <meshStandardMaterial color="white" />
                  </mesh>
                  <mesh position={[0, 2.8, 0.2]} rotation={[Math.PI/2, 0, 0]} castShadow>
                    <torusGeometry args={[0.2, 0.02, 8, 24]} />
                    <meshStandardMaterial color="#ef4444" />
                  </mesh>
                </group>
              )}
              {item.type === 'bleachers' && (
                <group>
                  <mesh position={[0, 0.2, 0.5]} castShadow>
                    <boxGeometry args={[4, 0.4, 0.5]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#94a3b8"} />
                  </mesh>
                  <mesh position={[0, 0.6, 0]} castShadow>
                    <boxGeometry args={[4, 0.4, 0.5]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#94a3b8"} />
                  </mesh>
                  <mesh position={[0, 1.0, -0.5]} castShadow>
                    <boxGeometry args={[4, 0.4, 0.5]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#94a3b8"} />
                  </mesh>
                </group>
              )}
              {item.type === 'car' && (
                <group position={[0, 0.4, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[1.8, 0.5, 4]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#3b82f6"} />
                  </mesh>
                  <mesh position={[0, 0.5, -0.2]} castShadow>
                    <boxGeometry args={[1.4, 0.4, 2]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#60a5fa"} />
                  </mesh>
                  <mesh position={[-0.9, -0.2, 1.2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.2]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                  <mesh position={[0.9, -0.2, 1.2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.2]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                  <mesh position={[-0.9, -0.2, -1.2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.2]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                  <mesh position={[0.9, -0.2, -1.2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.2]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                </group>
              )}
              {item.type === 'school_bus' && (
                <group position={[0, 0.8, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[2.2, 1.2, 6]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#eab308"} />
                  </mesh>
                  <mesh position={[0, 0.2, 2.5]} castShadow>
                    <boxGeometry args={[2.2, 0.8, 1]} />
                    <meshStandardMaterial color={isSelected ? "#f59e0b" : "#eab308"} />
                  </mesh>
                  <mesh position={[-1.1, -0.6, 2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.4, 0.4, 0.3]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                  <mesh position={[1.1, -0.6, 2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.4, 0.4, 0.3]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                  <mesh position={[-1.1, -0.6, -2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.4, 0.4, 0.3]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                  <mesh position={[1.1, -0.6, -2]} rotation={[0, 0, Math.PI/2]} castShadow>
                    <cylinderGeometry args={[0.4, 0.4, 0.3]} />
                    <meshStandardMaterial color="#1e293b" />
                  </mesh>
                </group>
              )}
              {item.type === 'door' && (
                <mesh position={[0, 1, 0]} castShadow>
                  <boxGeometry args={[1.2, 2, 0.1]} />
                  <meshStandardMaterial color={isSelected ? "#3b82f6" : "#78350f"} />
                </mesh>
              )}
              {item.type === 'window' && (
                <mesh position={[0, 1.5, 0]} castShadow>
                  <boxGeometry args={[1.5, 1, 0.1]} />
                  <meshStandardMaterial color={isSelected ? "#3b82f6" : "#bae6fd"} transparent opacity={0.6} />
                </mesh>
              )}
              {item.type === 'fence' && (
                <group position={[0, 0.5, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[2, 1, 0.05]} />
                    <meshBasicMaterial color={isSelected ? "#3b82f6" : "#94a3b8"} wireframe />
                  </mesh>
                </group>
              )}
            </group>
          );

          if (isSelected && onUpdateFurniturePosition) {
            return (
              <TransformControls
                key={item.id}
                mode="translate"
                showY={false}
                onMouseUp={(e) => {
                  const target = e?.target as any;
                  if (target && target.object) {
                    onUpdateFurniturePosition(item.id, target.object.position.x, -target.object.position.z);
                  }
                }}
              >
                <group 
                  position={[item.x, -0.8, -item.y]} 
                  rotation={[0, item.rotation * (Math.PI / 180), 0]}
                  scale={item.scale}
                  onClick={(e) => {
                    if (onSelectFurniture) {
                      e.stopPropagation();
                      onSelectFurniture(item.id);
                    }
                  }}
                >
                  {item.type === 'desk' && (
                    <group>
                      <mesh castShadow>
                        <boxGeometry args={[0.6, 0.6, 0.4]} />
                        <meshStandardMaterial color={isSelected ? "#f59e0b" : "#92400e"} {...materialProps} />
                      </mesh>
                      <mesh position={[0, -0.2, 0.3]} castShadow>
                        <boxGeometry args={[0.4, 0.4, 0.3]} />
                        <meshStandardMaterial color="#475569" {...materialProps} />
                      </mesh>
                    </group>
                  )}
                  {item.type === 'chair' && (
                    <mesh castShadow>
                      <boxGeometry args={[0.4, 0.4, 0.4]} />
                      <meshStandardMaterial color={isSelected ? "#f59e0b" : "#475569"} {...materialProps} />
                    </mesh>
                  )}
                  {item.type === 'shelf' && (
                    <mesh castShadow>
                      <boxGeometry args={[0.4, 1.5, 1]} />
                      <meshStandardMaterial color={isSelected ? "#f59e0b" : "#78350f"} {...materialProps} />
                    </mesh>
                  )}
                </group>
              </TransformControls>
            );
          }

          return <React.Fragment key={item.id}>{itemContent}</React.Fragment>;
        })}
      </>
    );
  }

  if (type === 'classroom') {
    const rows = Math.floor((height - 2) / 1.5); // Leave space for teacher
    const cols = Math.floor(width / 1.5);
    const desks = [];
    // Teacher Desk
    desks.push(
      <group key="teacher" position={[0, -0.8, -height / 2 + 1]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.7, 0.6]} />
          <meshStandardMaterial color="#92400e" {...materialProps} />
        </mesh>
        <mesh position={[0, -0.1, 0.5]} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.4]} />
          <meshStandardMaterial color="#475569" {...materialProps} />
        </mesh>
      </group>
    );
    // Student Desks
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        desks.push(
          <group key={`${r}-${c}`} position={[c * 1.5 - (cols * 1.5) / 2 + 0.75, -0.8, r * 1.5 - height / 2 + 2.5]}>
            <mesh castShadow>
              <boxGeometry args={[0.6, 0.6, 0.4]} />
              <meshStandardMaterial color="#92400e" {...materialProps} />
            </mesh>
            <mesh position={[0, -0.2, 0.3]} castShadow>
              <boxGeometry args={[0.4, 0.4, 0.3]} />
              <meshStandardMaterial color="#475569" {...materialProps} />
            </mesh>
          </group>
        );
      }
    }
    return <>{desks}</>;
  }
  
  if (type === 'library') {
    const shelves = [];
    for (let i = 0; i < 3; i++) {
      shelves.push(
        <mesh key={i} position={[width/2 - 0.3, -0.2, i * 1.2 - height/2 + 1]} castShadow>
          <boxGeometry args={[0.4, 1.5, 1]} />
          <meshStandardMaterial color="#78350f" {...materialProps} />
        </mesh>
      );
    }
    return <>{shelves}</>;
  }

  if (type === 'cafeteria') {
    const tables = [];
    for (let i = 0; i < 2; i++) {
      tables.push(
        <mesh key={i} position={[0, -0.6, i * 2 - height/2 + 1.5]} castShadow>
          <boxGeometry args={[width * 0.7, 0.1, 0.8]} />
          <meshStandardMaterial color="#f8fafc" {...materialProps} />
        </mesh>
      );
    }
    return <>{tables}</>;
  }

  if (type === 'laboratory') {
    return (
      <group position={[0, -0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[width * 0.8, 0.8, 0.6]} />
          <meshStandardMaterial color="#94a3b8" {...materialProps} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[width * 0.8, 0.1, 0.6]} />
          <meshStandardMaterial color="white" {...materialProps} />
        </mesh>
      </group>
    );
  }

  if (type === 'playground') {
    return (
      <group position={[0, -0.8, 0]}>
        <mesh castShadow position={[-1, 0.5, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.5]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh castShadow position={[1, 0.5, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.5]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI/2]} position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.2]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
    );
  }
  
  if (type === 'sports') {
    return (
      <group position={[0, -0.9, 0]}>
        <mesh rotation={[0, 0, 0]} position={[0, 0, height/2 - 0.2]}>
          <boxGeometry args={[1, 1.5, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh rotation={[0, 0, 0]} position={[0, 0, -height/2 + 0.2]}>
          <boxGeometry args={[1, 1.5, 0.1]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>
    );
  }

  if (type === 'admin') {
    const desks = [];
    const numDesks = Math.floor(width / 3);
    for (let i = 0; i < numDesks; i++) {
      desks.push(
        <group key={i} position={[-width / 2 + 1.5 + i * 3, -0.8, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.7, 0.8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, -0.1, 0.6]} castShadow>
            <boxGeometry args={[0.5, 0.5, 0.4]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[-0.8, 0.5, -0.8]} castShadow>
            <boxGeometry args={[0.8, 1.5, 0.4]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>
      );
    }
    return <group>{desks}</group>;
  }

  if (type === 'garden') {
    return (
      <group position={[0, -0.9, 0]}>
        <mesh castShadow position={[-width/4, 0.5, -height/4]}>
          <cylinderGeometry args={[0.2, 0.2, 1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh castShadow position={[-width/4, 1.5, -height/4]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
        <mesh castShadow position={[width/4, 0.3, height/4]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh castShadow position={[width/4, 0.8, height/4]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#4ade80" />
        </mesh>
      </group>
    );
  }

  if (type === 'court') {
    return (
      <group position={[0, -0.9, 0]}>
        {/* Court Lines */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.9, height * 0.9]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
        {/* Hoops/Goals */}
        <mesh position={[0, 1.5, -height/2 + 0.5]} castShadow>
          <boxGeometry args={[1.2, 1, 0.1]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        <mesh position={[0, 1.5, height/2 - 0.5]} castShadow>
          <boxGeometry args={[1.2, 1, 0.1]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>
    );
  }

  if (type === 'parking') {
    const lines = [];
    const numSpots = Math.floor(width / 2.5);
    for (let i = 0; i < numSpots; i++) {
      lines.push(
        <mesh key={i} position={[-width/2 + 1.25 + (i * 2.5), 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, height * 0.8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      );
    }
    return <group position={[0, -0.9, 0]}>{lines}</group>;
  }

  return null;
}

function Human({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.8]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}


function Person({ position, color = "#3b82f6", rooms, simulationTime, name, role, className }: { position: [number, number, number], color?: string, rooms: RoomData[], simulationTime?: number, name?: string, role?: string, className?: string }) {
  const group = useRef<THREE.Group>(null);
  const [target, setTarget] = useState<THREE.Vector3>(new THREE.Vector3(...position));
  const [currentPos, setCurrentPos] = useState<THREE.Vector3>(new THREE.Vector3(...position));
  const [hovered, setHovered] = useState(false);
  
  useFrame((state, delta) => {
    if (group.current && rooms && rooms.length > 0) {
      // School routine logic based on simulationTime (0-24)
      if (simulationTime !== undefined) {
        if (currentPos.distanceTo(target) < 0.1) {
          if (Math.random() > 0.98) {
            let targetRoomType = 'common';
            if (role === 'Teacher') {
              if (simulationTime >= 8 && simulationTime < 12) targetRoomType = 'classroom';
              else if (simulationTime >= 12 && simulationTime < 13) targetRoomType = 'staff';
              else if (simulationTime >= 13 && simulationTime < 15) targetRoomType = 'classroom';
              else if (simulationTime >= 15 && simulationTime < 16) targetRoomType = 'staff';
              else if (simulationTime >= 16) targetRoomType = 'garden';
            } else {
              if (simulationTime >= 8 && simulationTime < 12) targetRoomType = 'classroom'; // Morning classes
              else if (simulationTime >= 12 && simulationTime < 13) targetRoomType = 'cafeteria'; // Lunch
              else if (simulationTime >= 13 && simulationTime < 15) targetRoomType = 'classroom'; // Afternoon classes
              else if (simulationTime >= 15 && simulationTime < 16) targetRoomType = 'sports'; // PE
              else if (simulationTime >= 16) targetRoomType = 'garden'; // Leaving/After school
            }

            const possibleRooms = rooms.filter(r => r.type === targetRoomType);
            const randomRoom = possibleRooms.length > 0 
              ? possibleRooms[Math.floor(Math.random() * possibleRooms.length)]
              : rooms[Math.floor(Math.random() * rooms.length)];

            if (randomRoom) {
              setTarget(new THREE.Vector3(
                randomRoom.x + (Math.random() - 0.5) * randomRoom.width,
                (randomRoom.floor || 0) * FLOOR_HEIGHT,
                -randomRoom.y + (Math.random() - 0.5) * randomRoom.height
              ));
            }
          }
        } else {
          const dir = target.clone().sub(currentPos).normalize().multiplyScalar(delta * 2);
          currentPos.add(dir);
          group.current.position.copy(currentPos);
          group.current.position.y += Math.sin(state.clock.elapsedTime * 10) * 0.05; // Bobbing
          group.current.lookAt(target.x, group.current.position.y, target.z);
        }
      } else {
        // Random movement logic (fallback)
        if (currentPos.distanceTo(target) < 0.1) {
          if (Math.random() > 0.99) {
            const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
            if (randomRoom) {
              setTarget(new THREE.Vector3(
                randomRoom.x + (Math.random() - 0.5) * randomRoom.width,
                (randomRoom.floor || 0) * FLOOR_HEIGHT,
                -randomRoom.y + (Math.random() - 0.5) * randomRoom.height
              ));
            }
          }
        } else {
          const dir = target.clone().sub(currentPos).normalize().multiplyScalar(delta * 2);
          currentPos.add(dir);
          group.current.position.copy(currentPos);
          group.current.position.y += Math.sin(state.clock.elapsedTime * 10) * 0.05; // Bobbing
          group.current.lookAt(target.x, group.current.position.y, target.z);
        }
      }
    }
  });

  return (
    <group 
      ref={group} 
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.3, 0.6, 0.15]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fecaca" />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.2, 0.7, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#fecaca" />
      </mesh>
      <mesh position={[0.2, 0.7, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#fecaca" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.08, 0.2, 0]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.08, 0.2, 0]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {name && (hovered || role === 'Teacher') && (
        <Html position={[0, 1.9, 0]} center style={{ pointerEvents: 'none', zIndex: 10 }}>
          <div className="bg-white/95 backdrop-blur px-2 py-1 rounded-md shadow-lg border border-slate-200 text-center min-w-max pointer-events-none">
            <p className="text-[10px] font-bold text-slate-800">{name}</p>
            {role && <p className="text-[8px] font-bold text-slate-500 uppercase">{role === 'Teacher' ? 'Teacher' : 'Student'} {className ? `- ${className}` : ''}</p>}
          </div>
        </Html>
      )}
    </group>
  );
}

function Clouds() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={group}>
      {[...Array(10)].map((_, i) => (
        <mesh 
          key={i} 
          position={[
            Math.cos(i * 1.5) * 20, 
            15 + Math.sin(i * 2) * 2, 
            Math.sin(i * 1.5) * 20
          ]}
        >
          <sphereGeometry args={[2, 8, 8]} />
          <meshStandardMaterial color="white" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Life() {
  const birds = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (birds.current) {
      birds.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 15;
      birds.current.position.z = Math.cos(state.clock.elapsedTime * 0.5) * 15;
      birds.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={birds} position={[0, 10, 0]}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[Math.random() * 2, Math.random() * 2, Math.random() * 2]}>
          <coneGeometry args={[0.1, 0.3, 4]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      ))}
    </group>
  );
}

function MiniMap({ rooms, selectedId, onTeleport }: { rooms: RoomData[], selectedId: string | null, onTeleport: (pos: THREE.Vector3) => void }) {
  const { camera } = useThree();
  const playerDotRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (playerDotRef.current) {
      const x = ((camera.position.x + 50) / 100) * 100;
      const y = ((camera.position.z + 50) / 100) * 100;
      playerDotRef.current.style.left = `${x}%`;
      playerDotRef.current.style.top = `${y}%`;
      playerDotRef.current.style.transform = `translate(-50%, -50%) rotate(${camera.rotation.y}rad)`;
    }
  });

  const handleMapClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100 - 50;
    const y = ((e.clientY - rect.top) / rect.height) * 100 - 50;
    onTeleport(new THREE.Vector3(x, 1.6, y));
  };

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div 
        className="absolute bottom-6 right-6 w-48 h-48 bg-white/80 backdrop-blur rounded-xl border-2 border-slate-200 shadow-xl overflow-hidden z-10 pointer-events-auto cursor-crosshair"
        onClick={handleMapClick}
      >
        <div className="relative w-full h-full p-2">
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-10 pointer-events-none">
            {[...Array(100)].map((_, i) => <div key={i} className="border border-slate-400" />)}
          </div>
          {rooms.map(room => (
            <div 
              key={room.id}
              className={cn(
                "absolute border transition-all",
                selectedId === room.id ? "bg-blue-500/50 border-blue-600 z-10" : "bg-slate-400/30 border-slate-500"
              )}
              style={{
                left: `${((room.x - room.width / 2 + 50) / 100) * 100}%`,
                top: `${((-room.y - room.height / 2 + 50) / 100) * 100}%`,
                width: `${(room.width / 100) * 100}%`,
                height: `${(room.height / 100) * 100}%`,
                transform: `rotate(${room.rotation || 0}deg)`
              }}
            />
          ))}
          {/* Player Indicator */}
          <div 
            ref={playerDotRef}
            className="absolute w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-md z-20"
            style={{ left: '50%', top: '50%' }}
          >
            <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-red-600" />
          </div>
          <div className="absolute top-1 left-1 text-[8px] font-bold text-slate-400 uppercase">Mini-Mapa</div>
          <div className="absolute bottom-1 left-1 text-[7px] text-slate-400 italic">Clique para Teleportar</div>
        </div>
      </div>
    </Html>
  );
}

function WalkthroughHelp({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="absolute top-1/2 left-6 -translate-y-1/2 bg-slate-900/60 backdrop-blur p-4 rounded-xl border border-white/20 text-white space-y-2 animate-in fade-in slide-in-from-left-4">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Controles de Passeio</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <span className="text-slate-300">W, A, S, D</span> <span className="font-mono">Mover</span>
          <span className="text-slate-300">Mouse</span> <span className="font-mono">Olhar</span>
          <span className="text-slate-300">ESC</span> <span className="font-mono">Sair</span>
        </div>
      </div>
    </Html>
  );
}

function DynamicLife({ rooms, sunTime, sunPaused }: { rooms: RoomData[], sunTime: number, sunPaused: boolean }) {
  const people = useMemo(() => {
    const list: any[] = [];
    const classrooms = rooms.filter(r => r.type === 'classroom');
    const teachers = rooms.filter(r => r.type === 'admin' || r.type === 'classroom');
    
    // Generate students for each classroom
    classrooms.forEach((room, rIdx) => {
      const studentCount = Math.floor(room.width * room.height / 4); // 1 student per 4m2
      for (let i = 0; i < studentCount; i++) {
        list.push({
          id: `student-${rIdx}-${i}`,
          name: `Aluno ${rIdx * 10 + i}`,
          role: 'Student',
          className: room.name,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          position: [room.x + (Math.random() - 0.5) * room.width, 0, -room.y + (Math.random() - 0.5) * room.height] as [number, number, number]
        });
      }
    });

    // Generate teachers
    teachers.forEach((room, rIdx) => {
      list.push({
        id: `teacher-${rIdx}`,
        name: `Prof. ${['Carlos', 'Mariana', 'Roberto', 'Ana', 'Julia'][rIdx % 5]}`,
        role: 'Teacher',
        className: room.name,
        color: '#4f46e5',
        position: [room.x, 0, -room.y] as [number, number, number]
      });
    });

    // Generate people in common areas (Pátio, Refeitório, etc.)
    const commonRooms = rooms.filter(r => r.type === 'common' || r.type === 'cafeteria' || r.type === 'sports');
    commonRooms.forEach((room, rIdx) => {
      const count = Math.floor(room.width * room.height / 10); // 1 person per 10m2
      for (let i = 0; i < count; i++) {
        list.push({
          id: `common-${rIdx}-${i}`,
          name: `Pessoa ${rIdx * 10 + i}`,
          role: 'Student',
          className: room.name,
          color: `hsl(${Math.random() * 360}, 60%, 50%)`,
          position: [room.x + (Math.random() - 0.5) * room.width, 0, -room.y + (Math.random() - 0.5) * room.height] as [number, number, number]
        });
      }
    });

    return list;
  }, [rooms]);

  return (
    <group>
      {people.map(p => (
        <Person 
          key={p.id} 
          {...p} 
          rooms={rooms} 
          simulationTime={!sunPaused ? sunTime : undefined} 
        />
      ))}
      <Life />
    </group>
  );
}

function Compass() {
  const { camera } = useThree();
  const compassRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (compassRef.current) {
      const angle = camera.rotation.y * (180 / Math.PI);
      compassRef.current.style.transform = `rotate(${-angle}deg)`;
    }
  });

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="absolute top-6 right-6 w-12 h-12 bg-white/80 backdrop-blur rounded-full border-2 border-slate-200 shadow-lg flex items-center justify-center z-50">
        <div ref={compassRef} className="relative w-full h-full transition-transform duration-75">
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-black text-red-600">N</div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400">S</div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">W</div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">E</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-red-500 rounded-full" />
        </div>
      </div>
    </Html>
  );
}

function Room({ 
  data, isSelected, onSelect, renderMode, showFurniture, showRoof, isTransparent,
  selectedFurnitureId, onSelectFurniture, onUpdateFurniturePosition, isNight
}: { 
  data: RoomData; isSelected: boolean; onSelect: () => void; renderMode: 'solid' | 'walls'; showFurniture: boolean; showRoof: boolean; isTransparent: boolean;
  selectedFurnitureId?: string | null;
  onSelectFurniture?: (id: string) => void;
  onUpdateFurniturePosition?: (id: string, x: number, y: number) => void;
  isNight?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const doorRef = useRef<THREE.Group>(null);
  const height = data.depth || 2.5;
  const wallThickness = 0.15;
  const doorWidth = 0.9;
  const windowWidth = 1.2;
  const windowHeight = 1.0;
  
  const [doorOpen, setDoorOpen] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);

  useFrame((state) => {
    if (doorRef.current) {
      const targetRotation = doorOpen ? -Math.PI / 2 : 0;
      doorRef.current.rotation.y = THREE.MathUtils.lerp(doorRef.current.rotation.y, targetRotation, 0.1);
    }
  });
  
  const getFloorTexture = () => {
    const isTile = data.floorMaterial === 'tile' || (!data.floorMaterial && ['service', 'laboratory'].includes(data.type));
    const isWood = data.floorMaterial === 'wood' || (!data.floorMaterial && ['classroom', 'library', 'admin'].includes(data.type));
    const isSports = data.floorMaterial === 'gym' || (!data.floorMaterial && data.type === 'sports');
    
    return { isTile, isWood, isSports };
  };

  const { isTile, isWood, isSports } = getFloorTexture();
  
  const getFloorMaterial = () => {
    let materialType = data.floorMaterial;
    
    if (!materialType) {
      switch (data.type) {
        case 'sports': materialType = 'gym'; break;
        case 'playground': materialType = 'dirt'; break;
        case 'library': materialType = 'wood'; break;
        case 'cafeteria': materialType = 'tile'; break;
        case 'laboratory': materialType = 'tile'; break;
        case 'garden': materialType = 'grass'; break;
        case 'court': materialType = 'gym'; break;
        case 'parking': materialType = 'asphalt'; break;
        case 'classroom': materialType = 'wood'; break;
        case 'admin': materialType = 'wood'; break;
        case 'service': materialType = 'tile'; break;
        case 'common': materialType = 'concrete'; break;
        default: materialType = 'concrete'; break;
      }
    }

    const tex = getTexture(materialType, data.width / 2, data.height / 2);
    return <meshStandardMaterial map={tex} roughness={0.9} />;
  };

  const wallMaterial = (
    <meshStandardMaterial 
      map={data.wallMaterial === 'brick' ? getTexture('brick', data.width / 2, height / 2) : (data.wallMaterial === 'wood' ? getTexture('wood', data.width / 2, height / 2) : undefined)}
      color={data.wallMaterial === 'paint' || !data.wallMaterial ? (data.wallColor || "#e5e5cb") : undefined} 
      transparent={isTransparent} 
      opacity={isTransparent ? 0.2 : 1} 
    />
  );

  if (data.type === 'tree') {
    return (
      <group 
        name={data.id}
        position={[data.x, (data.floor || 0) * FLOOR_HEIGHT, -data.y]} 
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.1 * data.width, 0.2 * data.width, 2 * data.height]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow>
          <sphereGeometry args={[0.8 * data.width, 8, 8]} />
          <meshStandardMaterial color={isSelected ? "#3b82f6" : "#166534"} />
        </mesh>
      </group>
    );
  }

  if (data.type === 'bush') {
    return (
      <group 
        name={data.id}
        position={[data.x, (data.floor || 0) * FLOOR_HEIGHT, -data.y]} 
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <mesh position={[0, 0.3, 0]} castShadow>
          <sphereGeometry args={[0.5 * data.width, 8, 8]} />
          <meshStandardMaterial color={isSelected ? "#3b82f6" : "#166534"} />
        </mesh>
      </group>
    );
  }

  if (data.type === 'stairs') {
    return (
      <group 
        name={data.id}
        position={[data.x, (data.floor || 0) * FLOOR_HEIGHT, -data.y]} 
        rotation={[0, (data.rotation || 0) * (Math.PI / 180), 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        {[...Array(10)].map((_, i) => (
          <mesh key={i} position={[0, i * 0.2, i * 0.3]} castShadow>
            <boxGeometry args={[data.width, 0.2, 0.3]} />
            <meshStandardMaterial color={isSelected ? "#3b82f6" : "#94a3b8"} />
          </mesh>
        ))}
      </group>
    );
  }

  if (renderMode === 'walls' && (data.type as string) !== 'playground') {
    return (
      <group 
        name={data.id}
        position={[data.x, height / 2 + (data.floor || 0) * FLOOR_HEIGHT, -data.y]}
        rotation={[0, (data.rotation || 0) * (Math.PI / 180), 0]}
      >
        {/* Floor */}
        <mesh position={[0, -height / 2 + 0.05, 0]} receiveShadow>
          <boxGeometry args={[data.width, 0.1, data.height]} />
          {getFloorMaterial()}
        </mesh>

        {/* Night Light */}
        {isNight && (data.type as string) !== 'playground' && (data.type as string) !== 'garden' && (
          <pointLight 
            position={[0, height / 2 - 0.5, 0]} 
            intensity={0.8} 
            distance={10} 
            color="#fef3c7" 
            castShadow
          />
        )}

        {/* Sports Court Details */}
        {isSports && (
          <group position={[0, -height / 2 + 0.11, 0]}>
            {/* Main Lines */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[data.width * 0.95, data.height * 0.95]} />
              <meshStandardMaterial color="white" wireframe />
            </mesh>
            {/* Center Circle */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
              <ringGeometry args={[0.4, 0.45, 32]} />
              <meshStandardMaterial color="white" />
            </mesh>
            {/* Hoops */}
            <group position={[0, 0, -data.height/2 + 0.5]}>
              <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[1, 0.8, 0.05]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 1.3, 0.2]} rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[0.2, 0.02, 16, 32]} />
                <meshStandardMaterial color="red" />
              </mesh>
              <mesh position={[0, 0.75, -0.1]}>
                <cylinderGeometry args={[0.05, 0.05, 1.5]} />
                <meshStandardMaterial color="#444" />
              </mesh>
            </group>
            <group position={[0, 0, data.height/2 - 0.5]} rotation={[0, Math.PI, 0]}>
              <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[1, 0.8, 0.05]} />
                <meshStandardMaterial color="white" />
              </mesh>
              <mesh position={[0, 1.3, 0.2]} rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[0.2, 0.02, 16, 32]} />
                <meshStandardMaterial color="red" />
              </mesh>
              <mesh position={[0, 0.75, -0.1]}>
                <cylinderGeometry args={[0.05, 0.05, 1.5]} />
                <meshStandardMaterial color="#444" />
              </mesh>
            </group>
          </group>
        )}
        
        {/* Floor Texture Overlay (Grid for tiles/wood) */}
        {(isTile || isWood) && (
          <gridHelper 
            args={[Math.max(data.width, data.height), isTile ? 10 : 5, isTile ? "#ffffff" : "#451a03", isTile ? "#ffffff" : "#451a03"]} 
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -height/2 + 0.11, 0]}
          />
        )}

        {/* Room Label (3D Text) */}
        <Text
          position={[0, height/2 + 0.5, 0]}
          fontSize={0.3}
          color="#1e293b"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#ffffff"
        >
          {data.name}
        </Text>
        
        {/* Walls */}
        {!data.noWalls && (
          <group onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            {/* North Wall (with Door Gap) */}
          <group position={[0, 0, data.height / 2 - wallThickness / 2]}>
            <mesh position={[-(data.width/2 + doorWidth/2)/2 + doorWidth/2, 0, 0]}>
              <boxGeometry args={[(data.width - doorWidth) / 2, height, wallThickness]} />
              {wallMaterial}
            </mesh>
            <mesh position={[(data.width/2 + doorWidth/2)/2 - doorWidth/2, 0, 0]}>
              <boxGeometry args={[(data.width - doorWidth) / 2, height, wallThickness]} />
              {wallMaterial}
            </mesh>
            {/* Header above door */}
            <mesh position={[0, height/2 - 0.25, 0]}>
              <boxGeometry args={[doorWidth, 0.5, wallThickness]} />
              {wallMaterial}
            </mesh>
            {/* Animated Door */}
            <group 
              ref={doorRef} 
              position={[doorWidth / 2, 0, 0]} 
              onClick={(e) => { e.stopPropagation(); setDoorOpen(!doorOpen); }}
            >
              <mesh position={[-doorWidth / 2, 0, 0]} castShadow>
                <boxGeometry args={[doorWidth, 2.0, 0.05]} />
                <meshStandardMaterial color="#92400e" />
              </mesh>
              {/* Handle */}
              <mesh position={[-doorWidth + 0.1, 0, 0.05]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial color="gold" />
              </mesh>
            </group>
          </group>

          {/* South Wall (with Windows) */}
          <group position={[0, 0, -data.height / 2 + wallThickness / 2]}>
            <mesh position={[0, -height/2 + (height - windowHeight)/4, 0]}>
              <boxGeometry args={[data.width, (height - windowHeight)/2, wallThickness]} />
              {wallMaterial}
            </mesh>
            <mesh position={[0, height/2 - (height - windowHeight)/4, 0]}>
              <boxGeometry args={[data.width, (height - windowHeight)/2, wallThickness]} />
              {wallMaterial}
            </mesh>
            <mesh position={[-(data.width/2 + windowWidth/2)/2 + windowWidth/2, 0, 0]}>
              <boxGeometry args={[(data.width - windowWidth) / 2, windowHeight, wallThickness]} />
              {wallMaterial}
            </mesh>
            <mesh position={[(data.width/2 + windowWidth/2)/2 - windowWidth/2, 0, 0]}>
              <boxGeometry args={[(data.width - windowWidth) / 2, windowHeight, wallThickness]} />
              {wallMaterial}
            </mesh>
            {/* Glass */}
            <mesh 
              position={[0, 0, windowOpen ? 0.3 : 0]} 
              onClick={(e) => { e.stopPropagation(); setWindowOpen(!windowOpen); }}
            >
              <boxGeometry args={[windowWidth, windowHeight, 0.05]} />
              <meshStandardMaterial color="#93c5fd" transparent opacity={0.3} />
            </mesh>
          </group>

          {/* East Wall */}
          <mesh position={[data.width / 2 - wallThickness / 2, 0, 0]}>
            <boxGeometry args={[wallThickness, height, data.height]} />
            {wallMaterial}
          </mesh>
          {/* West Wall */}
          <mesh position={[-data.width / 2 + wallThickness / 2, 0, 0]}>
            <boxGeometry args={[wallThickness, height, data.height]} />
            {wallMaterial}
          </mesh>
        </group>
        )}

        {/* Roof */}
        {((showRoof && !data.noRoof) || data.hasRoof) && (
          <group position={[0, height/2 + 0.05, 0]}>
            {(!data.roofType || data.roofType === 'flat') && (
              <mesh castShadow>
                <boxGeometry args={[data.width + 0.2, 0.1, data.height + 0.2]} />
                <meshStandardMaterial color="#475569" />
              </mesh>
            )}
            {data.roofType === 'sloped' && (
              <mesh position={[0, data.height / 4, 0]} rotation={[0, Math.PI/4, 0]} castShadow>
                <cylinderGeometry args={[0, data.width / 2 + 0.1, data.height / 2, 4]} />
                <meshStandardMaterial color="#78350f" />
              </mesh>
            )}
            {data.roofType === 'glass' && (
              <group>
                <mesh castShadow>
                  <boxGeometry args={[data.width + 0.2, 0.1, data.height + 0.2]} />
                  <meshStandardMaterial color="#e0f2fe" transparent opacity={0.5} roughness={0.1} />
                </mesh>
                {/* Frame */}
                <mesh position={[0, 0, data.height/2 + 0.05]}>
                  <boxGeometry args={[data.width + 0.2, 0.15, 0.1]} />
                  <meshStandardMaterial color="#475569" />
                </mesh>
                <mesh position={[0, 0, -data.height/2 - 0.05]}>
                  <boxGeometry args={[data.width + 0.2, 0.15, 0.1]} />
                  <meshStandardMaterial color="#475569" />
                </mesh>
                <mesh position={[data.width/2 + 0.05, 0, 0]}>
                  <boxGeometry args={[0.1, 0.15, data.height + 0.2]} />
                  <meshStandardMaterial color="#475569" />
                </mesh>
                <mesh position={[-data.width/2 - 0.05, 0, 0]}>
                  <boxGeometry args={[0.1, 0.15, data.height + 0.2]} />
                  <meshStandardMaterial color="#475569" />
                </mesh>
                {/* Grid Lines */}
                <gridHelper 
                  args={[Math.max(data.width, data.height) + 0.2, Math.max(data.width, data.height) / 2, "#94a3b8", "#94a3b8"]} 
                  position={[0, 0.06, 0]}
                />
              </group>
            )}
          </group>
        )}

        {showFurniture && <Furniture type={data.type} width={data.width} height={data.height} customItems={data.furniture} selectedFurnitureId={selectedFurnitureId} onSelectFurniture={onSelectFurniture} onUpdateFurniturePosition={onUpdateFurniturePosition} />}

        {isSelected && (
          <mesh>
            <boxGeometry args={[data.width + 0.1, height + 0.1, data.height + 0.1]} />
            <meshBasicMaterial color="#3b82f6" wireframe />
          </mesh>
        )}

        <Text
          position={[0, height / 2 + 0.2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.25}
          color="#1e293b"
          anchorX="center"
          anchorY="middle"
        >
          {data.name}
        </Text>
      </group>
    );
  }

  return (
    <group 
      name={data.id}
      position={[data.x, height / 2 + (data.floor || 0) * FLOOR_HEIGHT, -data.y]}
      rotation={[0, (data.rotation || 0) * (Math.PI / 180), 0]}
    >
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[data.width, height, data.height]} />
        <meshStandardMaterial 
          color={isSelected ? '#3b82f6' : (isSports ? '#15803d' : (data.wallColor || data.color))} 
          transparent={isTransparent} 
          opacity={isTransparent ? 0.3 : (isSelected ? 0.8 : 0.7)}
          roughness={0.3}
          metalness={0.1}
        />
        {/* Wireframe overlay */}
        <mesh>
          <boxGeometry args={[data.width + 0.01, height + 0.01, data.height + 0.01]} />
          <meshBasicMaterial color={isSelected ? '#2563eb' : '#475569'} wireframe />
        </mesh>
      </mesh>

      {/* Sports Court Details (Solid Mode) */}
      {isSports && (
        <group position={[0, height / 2 + 0.01, 0]}>
          {/* Main Lines */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[data.width * 0.95, data.height * 0.95]} />
            <meshStandardMaterial color="white" wireframe />
          </mesh>
          {/* Center Circle */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <ringGeometry args={[0.4, 0.45, 32]} />
            <meshStandardMaterial color="white" />
          </mesh>
          {/* Hoops */}
          <group position={[0, 0, -data.height/2 + 0.5]}>
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[1, 0.8, 0.05]} />
              <meshStandardMaterial color="white" />
            </mesh>
            <mesh position={[0, 1.3, 0.2]} rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.2, 0.02, 16, 32]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <mesh position={[0, 0.75, -0.1]}>
              <cylinderGeometry args={[0.05, 0.05, 1.5]} />
              <meshStandardMaterial color="#444" />
            </mesh>
          </group>
          <group position={[0, 0, data.height/2 - 0.5]} rotation={[0, Math.PI, 0]}>
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[1, 0.8, 0.05]} />
              <meshStandardMaterial color="white" />
            </mesh>
            <mesh position={[0, 1.3, 0.2]} rotation={[Math.PI/2, 0, 0]}>
              <torusGeometry args={[0.2, 0.02, 16, 32]} />
              <meshStandardMaterial color="red" />
            </mesh>
            <mesh position={[0, 0.75, -0.1]}>
              <cylinderGeometry args={[0.05, 0.05, 1.5]} />
              <meshStandardMaterial color="#444" />
            </mesh>
          </group>
        </group>
      )}
      
      {showFurniture && <Furniture type={data.type} width={data.width} height={data.height} customItems={data.furniture} selectedFurnitureId={selectedFurnitureId} onSelectFurniture={onSelectFurniture} onUpdateFurniturePosition={onUpdateFurniturePosition} />}

      {/* Label */}
      <Text
        position={[0, height / 2 + 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.25}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        maxWidth={data.width}
      >
        {`${data.name}\n${(data.width * data.height).toFixed(2)}m²`}
      </Text>
    </group>
  );
}

function MouseLookControls() {
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      gl.domElement.setPointerCapture(e.pointerId);
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDragging.current = false;
      gl.domElement.releasePointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      previousMousePosition.current = { x: e.clientX, y: e.clientY };

      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(camera.quaternion);

      euler.y -= deltaX * 0.005;
      euler.x -= deltaY * 0.005;

      euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

      camera.quaternion.setFromEuler(euler);
    };

    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointermove', handlePointerMove);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }, [camera, gl]);

  return null;
}

function AutoTourController({ rooms, onComplete }: { rooms: RoomData[], onComplete: () => void }) {
  const { camera } = useThree();

  const { posCurve, lookCurve } = useMemo(() => {
    if (rooms.length === 0) return { posCurve: null, lookCurve: null };

    const posPoints: THREE.Vector3[] = [];
    const lookPoints: THREE.Vector3[] = [];

    // Calculate center of the entire complex
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    rooms.forEach(r => {
      minX = Math.min(minX, r.x - r.width / 2);
      maxX = Math.max(maxX, r.x + r.width / 2);
      minZ = Math.min(minZ, -r.y - r.height / 2);
      maxZ = Math.max(maxZ, -r.y + r.height / 2);
    });
    
    // Fallback if no valid rooms
    if (minX === Infinity) {
      minX = 0; maxX = 0; minZ = 0; maxZ = 0;
    }

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const center = new THREE.Vector3(centerX, 0, centerZ);

    // Start High and far back
    posPoints.push(new THREE.Vector3(centerX, 25, centerZ + 25));
    lookPoints.push(center);

    // Sort rooms to make a logical path
    const sortedRooms = [...rooms].sort((a, b) => {
      if (a.floor !== b.floor) return (a.floor || 0) - (b.floor || 0);
      return a.x - b.x;
    });

    sortedRooms.forEach((r, i) => {
      const roomCenter = new THREE.Vector3(r.x, (r.floor || 0) * FLOOR_HEIGHT, -r.y);
      
      // Drone position: high up and slightly offset to alternate sides
      const offsetDir = i % 2 === 0 ? 1 : -1;
      const dronePos = new THREE.Vector3(roomCenter.x + (5 * offsetDir), 12, roomCenter.z + 10);
      
      posPoints.push(dronePos);
      lookPoints.push(roomCenter);
    });

    // End High and far back (orbiting slightly)
    posPoints.push(new THREE.Vector3(centerX - 20, 20, centerZ + 20));
    lookPoints.push(center);

    return {
      posCurve: new THREE.CatmullRomCurve3(posPoints, false, 'catmullrom', 0.5),
      lookCurve: new THREE.CatmullRomCurve3(lookPoints, false, 'catmullrom', 0.5)
    };
  }, [rooms]);

  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!posCurve || !lookCurve) {
      onComplete();
      return;
    }

    // Drone speed: slower and more cinematic (approx 3 seconds per room, min 10s)
    const duration = Math.max(10, rooms.length * 3);
    progress.current += delta / duration;

    if (progress.current >= 1) {
      onComplete();
      return;
    }

    // Smooth easing (easeInOutCubic)
    const t = progress.current;
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const currentPos = posCurve.getPointAt(easeT);
    const currentLook = lookCurve.getPointAt(easeT);

    camera.position.copy(currentPos);
    camera.lookAt(currentLook);
  });

  return null;
}

function TourRecorder({ 
  isAutoTour, 
  onTourComplete 
}: { 
  isAutoTour: boolean;
  onTourComplete: () => void;
}) {
  const { gl } = useThree();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (isAutoTour && !isRecording) {
      chunksRef.current = [];
      const stream = gl.domElement.captureStream(30);
      
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      }

      try {
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `escola-3d-tour.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
          a.click();
          URL.revokeObjectURL(url);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (e) {
        console.error("Recording failed", e);
      }
    } else if (!isAutoTour && isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  }, [isAutoTour, isRecording, gl]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return null;
}

function Player({ rooms }: { rooms: RoomData[] }) {
  const [, get] = useKeyboardControls();
  const { camera } = useThree();
  const lastStepTime = useRef(0);
  
  const playFootstep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(60, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  };

  useFrame((state) => {
    const { forward, backward, left, right } = get();
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, Number(backward) - Number(forward));
    const sideVector = new THREE.Vector3(Number(left) - Number(right), 0, 0);
    
    const isMoving = forward || backward || left || right;
    
    if (isMoving && state.clock.elapsedTime - lastStepTime.current > 0.4) {
      playFootstep();
      lastStepTime.current = state.clock.elapsedTime;
    }

    const euler = new THREE.Euler(0, state.camera.rotation.y, 0, 'YXZ');
    
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(0.12)
      .applyEuler(euler);
      
    const nextPos = state.camera.position.clone().add(new THREE.Vector3(direction.x, 0, direction.z));
    
    // Simple Collision Detection
    let canMove = true;
    const playerRadius = 0.4;

    for (const room of rooms) {
      if (room.noWalls) continue;
      
      // Check if player is inside room bounds (with a small buffer for walls)
      const rx = room.x;
      const rz = -room.y;
      const halfW = room.width / 2;
      const halfH = room.height / 2;

      // If we are at the same floor
      const playerFloor = Math.floor(state.camera.position.y / FLOOR_HEIGHT);
      if (playerFloor !== (room.floor || 0)) continue;

      // Distance to walls
      const dx = Math.abs(nextPos.x - rx);
      const dz = Math.abs(nextPos.z - rz);

      // If we are hitting a wall from outside or inside
      // This is a very simplified AABB check
      if (dx < halfW + playerRadius && dz < halfH + playerRadius) {
        // If we were outside and trying to go in, or vice versa
        // For simplicity, let's just block if too close to any wall
        const distToEdgeX = halfW - dx;
        const distToEdgeZ = halfH - dz;

        if (Math.abs(distToEdgeX) < playerRadius || Math.abs(distToEdgeZ) < playerRadius) {
          // Check if there's a door? 
          // For now, just block
          canMove = false;
          break;
        }
      }
    }

    if (canMove) {
      state.camera.position.copy(nextPos);
    }
  });

  return null;
}

function Teleporter({ request, onComplete }: { request: { position: THREE.Vector3, lookAt: THREE.Vector3 } | null, onComplete: () => void }) {
  const { camera } = useThree();
  React.useEffect(() => {
    if (request) {
      camera.position.copy(request.position);
      camera.lookAt(request.lookAt);
      onComplete();
    }
  }, [request, camera, onComplete]);
  return null;
}

function SceneManager({ 
  rooms, selectedId, isWalkthrough, isAutoTour, updateRoom, transformMode 
}: { 
  rooms: RoomData[], selectedId: string | null, isWalkthrough: boolean, isAutoTour: boolean, 
  updateRoom: (id: string, data: Partial<RoomData>) => void,
  transformMode: 'translate' | 'rotate'
}) {
  const { scene } = useThree();

  return (
    <>
      {selectedId && !isWalkthrough && !isAutoTour && (
        <TransformControls 
          object={scene.getObjectByName(selectedId)} 
          mode={transformMode}
          onMouseUp={() => {
            const obj = scene.getObjectByName(selectedId);
            if (obj) {
              if (transformMode === 'translate') {
                updateRoom(selectedId, { 
                  x: obj.position.x,
                  y: -obj.position.z
                });
              } else {
                // Convert rotation from radians to degrees
                const rotDeg = Math.round(obj.rotation.y * (180 / Math.PI) / 15) * 15;
                updateRoom(selectedId, { rotation: rotDeg });
              }
            }
          }}
        />
      )}
    </>
  );
}

function ReferencePlane({ image, config }: { image: string; config: any }) {
  const texture = useLoader(THREE.TextureLoader, image);
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, config.rotation * (Math.PI / 180)]} 
      position={[config.x, 0.01, -config.y]} 
    >
      <planeGeometry args={[100 * config.scale, 100 * config.scale]} />
      <meshBasicMaterial map={texture} transparent opacity={config.opacity} depthWrite={false} />
    </mesh>
  );
}

function CalibrationTool({ active, points, onPoint }: { active: boolean; points: THREE.Vector3[]; onPoint: (p: THREE.Vector3) => void }) {
  const { camera, raycaster, mouse, scene } = useThree();

  const handleClick = (e: any) => {
    if (!active) return;
    e.stopPropagation();
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      onPoint(intersects[0].point);
    }
  };

  useEffect(() => {
    if (active) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [active, points]);

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.2]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      ))}
      {points.length === 2 && (
        <Line
          points={[points[0], points[1]]}
          color="#22c55e"
          lineWidth={3}
        />
      )}
    </group>
  );
}

interface Project {
  id: string;
  name: string;
  rooms: RoomData[];
  refImage: string | null;
  refConfig: any;
  timestamp: number;
}

function MeasurementTool({ active, points, onPoint }: { active: boolean; points: THREE.Vector3[]; onPoint: (p: THREE.Vector3) => void }) {
  const { camera, raycaster, mouse, scene } = useThree();

  const handleClick = (e: any) => {
    if (!active) return;
    e.stopPropagation();
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      onPoint(intersects[0].point);
    }
  };

  return (
    <group onClick={handleClick}>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="red" />
        </mesh>
      ))}
      {points.length === 2 && (
        <group>
          <line>
            <bufferGeometry attach="geometry" onUpdate={self => self.setFromPoints(points)} />
            <lineBasicMaterial attach="material" color="red" linewidth={2} />
          </line>
          <Text
            position={points[0].clone().add(points[1]).multiplyScalar(0.5).add(new THREE.Vector3(0, 0.2, 0))}
            fontSize={0.2}
            color="red"
            anchorX="center"
            anchorY="middle"
          >
            {`${points[0].distanceTo(points[1]).toFixed(2)}m`}
          </Text>
        </group>
      )}
    </group>
  );
}

function Heatmap({ rooms, active }: { rooms: RoomData[]; active: boolean }) {
  if (!active) return null;

  return (
    <group position={[0, 0.02, 0]}>
      {rooms.map((room) => {
        const occupancy = room.occupancy || 0;
        const color = new THREE.Color().setHSL((1 - occupancy) * 0.4, 1, 0.5);
        return (
          <mesh 
            key={room.id} 
            position={[room.x, 0, -room.y]}
            rotation={[-Math.PI / 2, 0, (room.rotation || 0) * (Math.PI / 180)]}
          >
            <planeGeometry args={[room.width, room.height]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

function EvacuationRoutes({ rooms, pois, active }: { rooms: RoomData[]; pois: POIData[]; active: boolean }) {
  if (!active) return null;

  const exits = pois.filter(p => p.type === 'exit');
  if (exits.length === 0) return null;

  return (
    <group position={[0, 0.1, 0]}>
      {rooms.map(room => {
        // Only draw routes from actual enclosed rooms, skip external areas
        if (room.type === 'playground' || room.type === 'sports' || room.noWalls) return null;

        const roomCenter = new THREE.Vector3(room.x, 0, -room.y);
        
        let nearestExit = exits[0];
        let minDistance = Infinity;
        
        exits.forEach(exit => {
          const exitPos = new THREE.Vector3(exit.x, 0, -exit.y);
          const dist = roomCenter.distanceTo(exitPos);
          if (dist < minDistance) {
            minDistance = dist;
            nearestExit = exit;
          }
        });

        const exitPos = new THREE.Vector3(nearestExit.x, 0, -nearestExit.y);
        
        return (
          <Line
            key={`evac-${room.id}`}
            points={[roomCenter, exitPos]}
            color="#ef4444"
            lineWidth={3}
            dashed={true}
            dashScale={10}
            dashSize={1}
            dashOffset={0}
            transparent
            opacity={0.8}
          />
        );
      })}
    </group>
  );
}

function TourManager({ active, waypoints, onComplete }: { active: boolean; waypoints: THREE.Vector3[]; onComplete: () => void }) {
  const { camera } = useThree();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    if (!active || waypoints.length < 2) return;

    const nextIndex = (index + 1) % waypoints.length;
    const start = waypoints[index];
    const end = waypoints[nextIndex];

    setProgress(prev => {
      const next = prev + delta * 0.2;
      if (next >= 1) {
        setIndex(nextIndex);
        if (nextIndex === 0) onComplete();
        return 0;
      }
      return next;
    });

    const currentPos = new THREE.Vector3().lerpVectors(start, end, progress);
    camera.position.lerp(currentPos.clone().add(new THREE.Vector3(0, 5, 5)), 0.1);
    camera.lookAt(currentPos);
  });

  return null;
}

export default function App() {
  const [rooms, setRooms] = useState<RoomData[]>(INITIAL_ROOMS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'top'>('3d');
  const [renderMode, setRenderMode] = useState<'solid' | 'walls'>('solid');
  const [showFurniture, setShowFurniture] = useState(true);
  const [showRoof, setShowRoof] = useState(false);
  const [isWalkthrough, setIsWalkthrough] = useState(false);
  const [isAutoTour, setIsAutoTour] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);
  const [teleportRequest, setTeleportRequest] = useState<{ position: THREE.Vector3, lookAt: THREE.Vector3 } | null>(null);
  const [sunTime, setSunTime] = useState(10); // 10 AM
  const [sunPaused, setSunPaused] = useState(true);
  const [showFog, setShowFog] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLife, setShowLife] = useState(true);
  const [isTracing, setIsTracing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<THREE.Vector3[]>([]);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState("10");

  // Advanced Features State
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [isHeatmap, setIsHeatmap] = useState(false);
  const [activeFloor, setActiveFloor] = useState(0);
  const [visibleFloors, setVisibleFloors] = useState<number[]>([0, 1, 2]);
  const [isTouring, setIsTouring] = useState(false);
  const [tourWaypoints, setTourWaypoints] = useState<THREE.Vector3[]>([]);
  const [showPOIs, setShowPOIs] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'snowy'>('sunny');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedRoomPhotos, setSelectedRoomPhotos] = useState<string[]>([]);
  const [isVR, setIsVR] = useState(false);
  
  const takeScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Force a render before capture
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `escola-3d-${new Date().getTime()}.png`;
      link.href = url;
      link.click();
    }
  };

  const orbitControlsRef = useRef<any>(null);

  const jumpTo = (x: number, z: number) => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.set(x, 0, -z);
      // We can't easily animate the camera position from here without more complex setup,
      // but jumping the target is a good start.
    }
  };
  
  // Reference Image State
  const [refImage, setRefImage] = useState<string | null>(null);
  const [refConfig, setRefConfig] = useState({
    scale: 1,
    opacity: 0.5,
    x: 0,
    y: 0,
    rotation: 0,
    visible: true
  });

  // Project Management State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectName, setCurrentProjectName] = useState('Meu Projeto Escolar');
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationPoints([]);
    alert("Clique em dois pontos na planta de referência para definir uma distância conhecida.");
  };

  const handleCalibrationPoint = (point: THREE.Vector3) => {
    const newPoints = [...calibrationPoints, point];
    setCalibrationPoints(newPoints);
    if (newPoints.length === 2) {
      setShowCalibrationModal(true);
      setIsCalibrating(false);
    }
  };

  const applyCalibration = () => {
    if (calibrationPoints.length === 2) {
      const dist = calibrationPoints[0].distanceTo(calibrationPoints[1]);
      const realDist = parseFloat(calibrationDistance);
      if (realDist > 0) {
        // Current scale is 's'. Measured distance in 3D units is 'dist'.
        // We want 'dist' to represent 'realDist' meters.
        // The plane size is 120 * scale.
        // If dist in 3D units is 'dist', and we want it to be 'realDist',
        // we need to adjust the scale.
        const newScale = refConfig.scale * (realDist / dist);
        setRefConfig({ ...refConfig, scale: newScale });
      }
    }
    setShowCalibrationModal(false);
    setCalibrationPoints([]);
  };

  // Load initial state from local storage
  useEffect(() => {
    const savedRooms = localStorage.getItem('school_builder_rooms');
    if (savedRooms) {
      try {
        setRooms(JSON.parse(savedRooms));
      } catch (e) {
        console.error("Failed to parse saved rooms", e);
      }
    }
  }, []);

  // Broadcast room changes (now just local state + local storage)
  const updateRooms = (newRooms: RoomData[]) => {
    setRooms(newRooms);
    localStorage.setItem('school_builder_rooms', JSON.stringify(newRooms));
  };

  const playBell = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);
  };

  // Automated Sun Cycle
  React.useEffect(() => {
    if (sunPaused) return;
    const interval = setInterval(() => {
      setSunTime(prev => {
        const next = prev + 0.02;
        return next >= 24 ? 0 : next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [sunPaused]);

  // Persistence: Load from LocalStorage on mount
  React.useEffect(() => {
    const savedProjects = localStorage.getItem('school-maquete-projects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        setProjects(parsed);
      } catch (e) {}
    }

    const savedData = localStorage.getItem('school-maquete-full-data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setRooms(data.rooms || INITIAL_ROOMS);
        if (data.refImage) setRefImage(data.refImage);
        if (data.refConfig) setRefConfig(data.refConfig);
        if (data.currentProjectName) setCurrentProjectName(data.currentProjectName);
      } catch (e) {
        console.error("Erro ao carregar dados salvos", e);
      }
    }
  }, []);

  // Persistence: Save to LocalStorage whenever rooms or ref change
  React.useEffect(() => {
    localStorage.setItem('school-maquete-full-data', JSON.stringify({
      rooms,
      refImage,
      refConfig,
      currentProjectName
    }));
  }, [rooms, refImage, refConfig, currentProjectName]);

  React.useEffect(() => {
    localStorage.setItem('school-maquete-projects', JSON.stringify(projects));
  }, [projects]);

  const saveCurrentProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: currentProjectName,
      rooms: [...rooms],
      refImage,
      refConfig: { ...refConfig },
      timestamp: Date.now()
    };
    
    setProjects(prev => {
      const existingIndex = prev.findIndex(p => p.name === currentProjectName);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newProject;
        return updated;
      }
      return [newProject, ...prev];
    });
    alert(`Projeto "${currentProjectName}" salvo com sucesso!`);
  };

  const loadProject = (project: Project) => {
    updateRooms(project.rooms);
    setRefImage(project.refImage);
    setRefConfig(project.refConfig);
    setCurrentProjectName(project.name);
    setShowProjectManager(false);
    setSelectedId(null);
  };

  const startNewProject = () => {
    if (confirm('Do you want to start a new project? Make sure to save the current one first.')) {
      updateRooms(INITIAL_ROOMS);
      setRefImage(null);
      setRefConfig({
        scale: 1,
        opacity: 0.5,
        x: 0,
        y: 0,
        rotation: 0,
        visible: true
      });
      setCurrentProjectName(`New Project ${projects.length + 1}`);
      setSelectedId(null);
      setShowProjectManager(false);
    }
  };

  const deleteProject = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this project?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const selectedRoom = rooms.find(r => r.id === selectedId);

  const updateRoom = (id: string, updates: Partial<RoomData>) => {
    updateRooms(rooms.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleUpdateFurniturePosition = (furnId: string, x: number, y: number) => {
    const room = rooms.find(r => r.furniture?.some(f => f.id === furnId));
    if (room && room.furniture) {
      const updatedFurniture = room.furniture.map(f => 
        f.id === furnId ? { ...f, x, y } : f
      );
      updateRoom(room.id, { furniture: updatedFurniture });
    }
  };

  const addRoom = () => {
    const newId = `room-${Date.now()}`;
    const newRoom: RoomData = {
      id: newId,
      name: 'New Room',
      type: 'classroom',
      x: 0,
      y: 0,
      width: 4,
      height: 4,
      color: '#fca5a5',
      rotation: 0
    };
    updateRooms([...rooms, newRoom]);
    setSelectedId(newId);
  };

  const duplicateRoom = (room: RoomData) => {
    const newId = `${room.id}-copy-${Date.now()}`;
    const newRoom: RoomData = {
      ...room,
      id: newId,
      name: `${room.name} (Copy)`,
      x: room.x + 0.5,
      y: room.y + 0.5,
    };
    updateRooms([...rooms, newRoom]);
    setSelectedId(newId);
  };

  const deleteRoom = (id: string) => {
    updateRooms(rooms.filter(r => r && r.id !== id));
    setSelectedId(null);
  };

  const clearAllRooms = () => {
    if (window.confirm('Tem certeza que deseja apagar todo o mapa e começar do zero?')) {
      updateRooms([]);
      setSelectedId(null);
    }
  };

  const enterRoom = (room: RoomData) => {
    setIsWalkthrough(true);
    setTeleportRequest({
      position: new THREE.Vector3(room.x, 1.6 + (room.floor || 0) * FLOOR_HEIGHT, -room.y),
      lookAt: new THREE.Vector3(room.x + 1, 1.6 + (room.floor || 0) * FLOOR_HEIGHT, -room.y)
    });
  };

  const sunAngle = ((sunTime - 6) / 24) * Math.PI * 2;
  const sunX = Math.cos(sunAngle) * 40;
  const sunY = Math.sin(sunAngle) * 40;
  const isNight = sunY < 0;

  const resetCamera = () => {
    if (confirm('Do you want to reset the model to the initial state? This will clear your unsaved changes.')) {
      localStorage.removeItem('school-maquete-full-data');
      localStorage.removeItem('school_builder_rooms');
      window.location.reload();
    }
  };

  const exportData = () => {
    const headers = ['ID', 'Name', 'Type', 'Floor', 'X', 'Y', 'Width', 'Length', 'Area (m2)'];
    const rows = rooms.map(r => [
      r.id,
      r.name,
      r.type,
      r.floor || 0,
      r.x,
      r.y,
      r.width,
      r.height,
      (r.width * r.height).toFixed(2)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "escola_projeto_dados.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const magicTrace = async () => {
    if (!refImage) return;
    setIsTracing(true);
    
    try {
      const response = await fetch('/api/magic-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: refImage })
      });

      if (!response.ok) throw new Error('Failed to process image');

      const detectedRooms = await response.json();
      
      if (Array.isArray(detectedRooms)) {
        const newRooms: RoomData[] = detectedRooms.map((room: any, index: number) => ({
          ...room,
          id: `ai-room-${Date.now()}-${index}`,
          rotation: 0,
          floor: 0
        }));
        
        updateRooms(newRooms);
        setSelectedId(null);
      }
    } catch (error) {
      console.error("Erro no Magic Trace:", error);
      alert("Não foi possível processar a imagem. Verifique se é uma planta clara.");
    } finally {
      setIsTracing(false);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Floating Toggle Button (visible when sidebar is closed) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] bg-blue-600 text-white p-2 rounded-r-xl shadow-2xl hover:bg-blue-700 transition-all border border-blue-500 border-l-0 flex flex-col items-center gap-1"
          title="Abrir Menu Lateral"
        >
          <ChevronRight className="w-6 h-6 animate-pulse-slow" />
          <span className="[writing-mode:vertical-lr] text-[10px] font-bold tracking-widest uppercase py-2">Menu</span>
        </button>
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed md:relative inset-y-0 left-0 bg-white border-r border-slate-200 flex flex-col shadow-2xl md:shadow-xl z-50 transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0",
        isSidebarOpen ? "w-[320px] translate-x-0" : "w-0 -translate-x-full md:translate-x-0"
      )}>
        <div className="w-[320px] h-full flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 relative">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-6 -right-1 md:right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors z-10"
              title="Recolher Menu"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                  <Box className="w-6 h-6 text-blue-600" />
                  Escola 3D
                </h1>
                <p className="text-sm text-slate-500 mt-1 italic">Projeto Educacional Completo</p>
              </div>
              <div className="flex gap-1">
              <button 
                onClick={() => setShowProjectManager(!showProjectManager)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  showProjectManager ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
                title="Meus Projetos"
              >
                <Folder className="w-4 h-4" />
              </button>
              <button 
                onClick={saveCurrentProject}
                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all"
                title="Salvar Projeto Atual"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Project Manager Overlay/Section */}
          {showProjectManager && (
            <div className="space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">Gerenciar Projetos</h3>
                <button onClick={() => setShowProjectManager(false)} className="text-blue-400 hover:text-blue-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Current Project Name</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={currentProjectName} 
                    onChange={(e) => setCurrentProjectName(e.target.value)}
                    className="flex-1 p-2 bg-white border border-slate-200 rounded text-xs"
                    placeholder="Project name..."
                  />
                  <button 
                    onClick={saveCurrentProject}
                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={clearAllRooms}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                    title="Clear All / Empty Map"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Projetos Salvos</label>
                  <button 
                    onClick={startNewProject}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    + NEW PROJECT
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {projects.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">No projects saved yet.</p>
                  ) : (
                    projects.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded border border-slate-100 hover:border-blue-200 transition-all group">
                        <button 
                          onClick={() => loadProject(p)}
                          className="flex-1 text-left text-[11px] font-medium text-slate-700 truncate mr-2"
                        >
                          {p.name}
                          <span className="block text-[8px] text-slate-400">
                            {new Date(p.timestamp).toLocaleDateString()} {new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </button>
                        <button 
                          onClick={() => deleteProject(p.id)}
                          className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          {/* View Controls */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Visualização</h3>
              <button 
                onClick={addRoom}
                className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1 text-[10px] font-bold"
              >
                <Plus className="w-3 h-3" />
                NEW
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setRenderMode('solid')}
                className={cn(
                  "p-2 rounded-lg text-xs font-medium border transition-all",
                  renderMode === 'solid' ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600"
                )}
              >
                Blocos
              </button>
              <button 
                onClick={() => setRenderMode('walls')}
                className={cn(
                  "p-2 rounded-lg text-xs font-medium border transition-all",
                  renderMode === 'walls' ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600"
                )}
              >
                Paredes
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowFurniture(!showFurniture)}
                className={cn(
                  "p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-2",
                  showFurniture ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-white border-slate-200 text-slate-600"
                )}
              >
                <Armchair className="w-3 h-3" />
                Mobília
              </button>
              <button 
                onClick={() => setShowRoof(!showRoof)}
                className={cn(
                  "p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-2",
                  showRoof ? "bg-slate-800 text-white border-slate-800" : "bg-white border-slate-200 text-slate-600"
                )}
              >
                <Home className="w-3 h-3" />
                Telhado
              </button>
            </div>
            <button 
              onClick={() => setIsTransparent(!isTransparent)}
              className={cn(
                "w-full p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-2",
                isTransparent ? "bg-cyan-600 text-white border-cyan-600" : "bg-white border-slate-200 text-slate-600"
              )}
            >
              <Minimize2 className="w-3 h-3" />
              {isTransparent ? 'Paredes Sólidas' : 'Paredes Transparentes (Raio-X)'}
            </button>
            <button 
              onClick={() => setIsWalkthrough(!isWalkthrough)}
              className={cn(
                "w-full p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-2",
                isWalkthrough ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-600"
              )}
            >
              <Eye className="w-3 h-3" />
              {isWalkthrough ? 'Sair do Passeio' : 'Passeio Virtual (WASD)'}
            </button>
            <button 
              onClick={() => {
                if (!isAutoTour) {
                  // Reset view mode to 3D for the tour
                  setViewMode('3d');
                  setIsWalkthrough(false);
                }
                setIsAutoTour(!isAutoTour);
              }}
              className={cn(
                "w-full p-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 animate-pulse-slow",
                isAutoTour ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              )}
            >
              <Video className="w-4 h-4" />
              {isAutoTour ? 'Stop Recording' : 'Record Auto Tour'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setShowLife(!showLife)}
                className={cn(
                  "p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-2",
                  showLife ? "bg-green-50 text-green-600 border-green-200" : "bg-white border-slate-200 text-slate-600"
                )}
              >
                <TreePine className="w-3 h-3" />
                Vida
              </button>
              <button 
                onClick={playBell}
                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <Volume2 className="w-3 h-3" />
                Sinal
              </button>
            </div>
          </div>

          {/* Floor Management */}
          <div className="space-y-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <Layers className="w-3 h-3" />
              Floor Management
            </h3>
            <div className="flex gap-2">
              {[0, 1, 2].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFloor(f)}
                  className={cn(
                    "flex-1 p-2 rounded-lg text-[10px] font-bold border transition-all",
                    activeFloor === f ? "bg-indigo-600 text-white border-indigo-700" : "bg-white text-slate-600 border-slate-200"
                  )}
                >
                  {f === 0 ? 'GROUND FLOOR' : `${f}º FLOOR`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Visibilidade:</label>
              <div className="flex gap-1">
                {[0, 1, 2].map(f => (
                  <button
                    key={f}
                    onClick={() => setVisibleFloors(prev => prev.includes(f) ? prev.filter(v => v !== f) : [...prev, f])}
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-[10px] border",
                      visibleFloors.includes(f) ? "bg-indigo-100 text-indigo-600 border-indigo-200" : "bg-white text-slate-300 border-slate-100"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Tools */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Ferramentas Avançadas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMeasuring(!isMeasuring);
                  setMeasurePoints([]);
                }}
                className={cn(
                  "p-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2",
                  isMeasuring ? "bg-red-600 text-white border-red-700" : "bg-white text-slate-600 border-slate-200"
                )}
              >
                <Ruler className="w-3 h-3" />
                RÉGUA 3D
              </button>
              <button
                onClick={() => setIsHeatmap(!isHeatmap)}
                className={cn(
                  "p-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2",
                  isHeatmap ? "bg-orange-600 text-white border-orange-700" : "bg-white text-slate-600 border-slate-200"
                )}
              >
                <Activity className="w-3 h-3" />
                HEATMAP
              </button>
              <button
                onClick={() => {
                  if (isTouring) {
                    setIsTouring(false);
                  } else {
                    const waypoints = rooms.slice(0, 5).map(r => new THREE.Vector3(r.x, 0, -r.y));
                    if (waypoints.length >= 2) {
                      setTourWaypoints(waypoints);
                      setIsTouring(true);
                    } else {
                      alert("Add at least 2 rooms for the tour.");
                    }
                  }
                }}
                className={cn(
                  "p-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2",
                  isTouring ? "bg-blue-600 text-white border-blue-700" : "bg-white text-slate-600 border-slate-200"
                )}
              >
                <Camera className="w-3 h-3" />
                TOUR VIRTUAL
              </button>
              <button
                onClick={() => {
                  const updatedRooms = rooms.map(r => ({
                    ...r,
                    occupancy: Math.random()
                  }));
                  updateRooms(updatedRooms);
                }}
                className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
              >
                <Activity className="w-3 h-3" />
                SIMULAR FLUXO
              </button>
              <button
                onClick={() => setShowPOIs(!showPOIs)}
                className={cn(
                  "p-2 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2",
                  showPOIs ? "bg-blue-600 text-white border-blue-700" : "bg-white text-slate-600 border-slate-200"
                )}
              >
                <MapPin className="w-3 h-3" />
                POIs
              </button>
            </div>
            <button
              onClick={() => setIsEmergency(!isEmergency)}
              className={cn(
                "w-full mt-2 p-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-2",
                isEmergency ? "bg-red-600 text-white border-red-700 animate-pulse" : "bg-white text-red-600 border-red-200 hover:bg-red-50"
              )}
            >
              <ShieldAlert className="w-3 h-3" />
              EMERGENCY MODE
            </button>
            <button
              onClick={() => setShowDashboard(!showDashboard)}
              className={cn(
                "w-full mt-2 p-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-2",
                showDashboard ? "bg-indigo-600 text-white border-indigo-700" : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              )}
            >
              <BarChart3 className="w-3 h-3" />
              CAPACITY DASHBOARD
            </button>
          </div>

          {/* Solar Control */}
          <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-2">
                <Sun className="w-3 h-3" />
                Solar Simulation
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => setSunPaused(!sunPaused)}
                  className="p-1 bg-orange-200 text-orange-700 rounded hover:bg-orange-300 transition-colors"
                  title={sunPaused ? "Iniciar Ciclo" : "Pausar Ciclo"}
                >
                  {sunPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                </button>
                <button 
                  onClick={() => setShowFog(!showFog)}
                  className={cn(
                    "p-1.5 rounded-md text-[10px] font-bold transition-all border",
                    showFog ? "bg-blue-600 text-white border-blue-700" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  NEBLINA: {showFog ? "ON" : "OFF"}
                </button>
              </div>
            </div>
            <input 
              type="range" min="0" max="23.9" step="0.1" 
              value={sunTime} 
              onChange={(e) => setSunTime(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <p className="text-[10px] text-orange-700 font-bold text-center">
              {Math.floor(sunTime).toString().padStart(2, '0')}:{Math.floor((sunTime % 1) * 60).toString().padStart(2, '0')}h
              {isNight ? ' (Noite)' : ' (Dia)'}
            </p>
          </div>

          {/* Reference Image Control */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <Layers className="w-3 h-3" />
              Planta de Referência
            </h3>
            
            {!refImage ? (
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => setRefImage(event.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden" 
                  id="ref-upload" 
                />
                <label 
                  htmlFor="ref-upload"
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-200 rounded-lg bg-white cursor-pointer hover:bg-blue-50 transition-all"
                >
                  <Plus className="w-6 h-6 text-blue-400 mb-1" />
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Subir Planta (PNG/JPG)</span>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button 
                    onClick={startCalibration}
                    className={cn(
                      "flex-1 p-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1",
                      isCalibrating ? "bg-green-600 text-white border-green-700" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                    )}
                  >
                    <Ruler className="w-3 h-3" />
                    {isCalibrating ? 'CLIQUE NA PLANTA' : 'CALIBRAR ESCALA'}
                  </button>
                  <button 
                    onClick={() => setRefConfig({...refConfig, visible: !refConfig.visible})}
                    className={cn(
                      "p-2 rounded-lg text-[10px] font-bold border transition-all",
                      refConfig.visible ? "bg-blue-600 text-white border-blue-700" : "bg-white text-slate-600 border-slate-200"
                    )}
                  >
                    {refConfig.visible ? 'HIDE' : 'SHOW'}
                  </button>
                  <button 
                    onClick={() => setRefImage(null)}
                    className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <button 
                  onClick={magicTrace}
                  disabled={isTracing}
                  className={cn(
                    "w-full p-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2",
                    isTracing ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-lg hover:from-purple-700 hover:to-indigo-700"
                  )}
                >
                  {isTracing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      ANALISANDO PLANTA...
                    </>
                  ) : (
                    <>
                      <Box className="w-4 h-4" />
                      GERAR 3D AUTOMÁTICO (IA)
                    </>
                  )}
                </button>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                    Escala <span>{refConfig.scale.toFixed(2)}x</span>
                  </label>
                  <input 
                    type="range" min="0.1" max="10" step="0.1" 
                    value={refConfig.scale} 
                    onChange={(e) => setRefConfig({...refConfig, scale: parseFloat(e.target.value)})}
                    className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                    Opacidade <span>{(refConfig.opacity * 100).toFixed(0)}%</span>
                  </label>
                  <input 
                    type="range" min="0" max="1" step="0.05" 
                    value={refConfig.opacity} 
                    onChange={(e) => setRefConfig({...refConfig, opacity: parseFloat(e.target.value)})}
                    className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Posição X</label>
                    <input 
                      type="number" step="0.5"
                      value={refConfig.x} 
                      onChange={(e) => setRefConfig({...refConfig, x: parseFloat(e.target.value)})}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-[10px] font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Posição Y</label>
                    <input 
                      type="number" step="0.5"
                      value={refConfig.y} 
                      onChange={(e) => setRefConfig({...refConfig, y: parseFloat(e.target.value)})}
                      className="w-full p-1 bg-white border border-slate-200 rounded text-[10px] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                    Rotation <span>{refConfig.rotation}°</span>
                  </label>
                  <input 
                    type="range" min="0" max="360" step="1" 
                    value={refConfig.rotation} 
                    onChange={(e) => setRefConfig({...refConfig, rotation: parseInt(e.target.value)})}
                    className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Room Editor */}
          {selectedRoom ? (
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Editar: {selectedRoom.name}</h3>
                <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedRoom.photos && selectedRoom.photos.length > 0 && (
                  <button 
                    onClick={() => {
                      setSelectedRoomPhotos(selectedRoom.photos || []);
                      setIsGalleryOpen(true);
                    }}
                    className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-pink-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Camera className="w-5 h-5" />
                    Ver Fotos Reais
                  </button>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Room Name</label>
                  <input 
                    type="text"
                    value={selectedRoom.name} 
                    onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Usage Type</label>
                  <select 
                    value={selectedRoom.type}
                    onChange={(e) => {
                      const type = e.target.value as RoomType;
                      const colors: Record<RoomType, string> = {
                        classroom: '#fca5a5',
                        admin: '#93c5fd',
                        sports: '#10b981',
                        service: '#e2e8f0',
                        common: '#fdba74',
                        library: '#d97706',
                        cafeteria: '#94a3b8',
                        laboratory: '#64748b',
                        playground: '#f59e0b',
                        tree: '#166534',
                        bush: '#166534',
                        stairs: '#94a3b8',
                        garden: '#22c55e',
                        court: '#ea580c',
                        parking: '#475569'
                      };
                      updateRoom(selectedRoom.id, { type, color: colors[type] });
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-sm"
                  >
                    <option value="classroom">Classroom</option>
                    <option value="admin">Administrative</option>
                    <option value="sports">Sports</option>
                    <option value="service">Service/Restroom</option>
                    <option value="common">Common Area</option>
                    <option value="library">Library</option>
                    <option value="cafeteria">Cafeteria</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="playground">Playground</option>
                    <option value="tree">Tree</option>
                    <option value="bush">Bush</option>
                    <option value="stairs">Stairs</option>
                    <option value="garden">Garden/Plaza</option>
                    <option value="court">Sports Court</option>
                    <option value="parking">Parking</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                    Width <span>{selectedRoom.width}m</span>
                  </label>
                  <input 
                    type="range" min="0.5" max="15" step="0.1" 
                    value={selectedRoom.width} 
                    onChange={(e) => updateRoom(selectedRoom.id, { width: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                    Length <span>{selectedRoom.height}m</span>
                  </label>
                  <input 
                    type="range" min="0.5" max="15" step="0.1" 
                    value={selectedRoom.height} 
                    onChange={(e) => updateRoom(selectedRoom.id, { height: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Move className="w-3 h-3" />
                      Posição X
                    </label>
                    <input 
                      type="number" step="0.1"
                      value={selectedRoom.x} 
                      onChange={(e) => updateRoom(selectedRoom.id, { x: parseFloat(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Move className="w-3 h-3" />
                      Posição Y
                    </label>
                    <input 
                      type="number" step="0.1"
                      value={selectedRoom.y} 
                      onChange={(e) => updateRoom(selectedRoom.id, { y: parseFloat(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-200 rounded text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Floor (Level)</label>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(f => (
                      <button
                        key={f}
                        onClick={() => updateRoom(selectedRoom.id, { floor: f })}
                        className={cn(
                          "flex-1 p-2 rounded text-xs font-bold border transition-all",
                          (selectedRoom.floor || 0) === f ? "bg-indigo-600 text-white border-indigo-700" : "bg-white text-slate-600 border-slate-200"
                        )}
                      >
                        {f === 0 ? 'Ground' : `${f}º`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Roof Type</label>
                  <select 
                    value={selectedRoom.roofType || 'flat'}
                    onChange={(e) => updateRoom(selectedRoom.id, { roofType: e.target.value as any })}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-sm"
                  >
                    <option value="flat">Flat</option>
                    <option value="sloped">Sloped</option>
                    <option value="glass">Glass</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Floor Material</label>
                  <select 
                    value={selectedRoom.floorMaterial || 'concrete'}
                    onChange={(e) => updateRoom(selectedRoom.id, { floorMaterial: e.target.value as any })}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-sm"
                  >
                    <option value="concrete">Concrete</option>
                    <option value="wood">Wood</option>
                    <option value="tile">Tile</option>
                    <option value="carpet">Carpet</option>
                    <option value="grass">Grass</option>
                    <option value="gym">Rubber</option>
                    <option value="asphalt">Asphalt</option>
                    <option value="dirt">Dirt</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Wall Material</label>
                  <select 
                    value={selectedRoom.wallMaterial || 'paint'}
                    onChange={(e) => updateRoom(selectedRoom.id, { wallMaterial: e.target.value as any })}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-sm"
                  >
                    <option value="paint">Paint (Solid Color)</option>
                    <option value="brick">Brick</option>
                    <option value="wood">Wood</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Wall Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color"
                      value={selectedRoom.wallColor || "#f8fafc"} 
                      onChange={(e) => updateRoom(selectedRoom.id, { wallColor: e.target.value })}
                      className="w-8 h-8 p-0 border-none rounded cursor-pointer"
                      disabled={selectedRoom.wallMaterial === 'brick' || selectedRoom.wallMaterial === 'wood'}
                    />
                    <input 
                      type="text"
                      value={selectedRoom.wallColor || "#f8fafc"} 
                      onChange={(e) => updateRoom(selectedRoom.id, { wallColor: e.target.value })}
                      className="flex-1 p-1 bg-white border border-slate-200 rounded text-[10px] font-mono"
                      disabled={selectedRoom.wallMaterial === 'brick' || selectedRoom.wallMaterial === 'wood'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mobiliário Individual</label>
                    <button 
                      onClick={() => {
                        const newItem = {
                          id: `furn-${Date.now()}`,
                          type: 'desk',
                          x: 0,
                          y: 0,
                          rotation: 0,
                          scale: 1
                        };
                        updateRoom(selectedRoom.id, { 
                          furniture: [...(selectedRoom.furniture || []), newItem] 
                        });
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      + ADD
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(selectedRoom.furniture || []).map((item, idx) => (
                      <div key={item.id} className="p-2 bg-white border border-slate-200 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <select 
                            value={item.type}
                            onChange={(e) => {
                              const newFurn = [...(selectedRoom.furniture || [])];
                              newFurn[idx].type = e.target.value;
                              updateRoom(selectedRoom.id, { furniture: newFurn });
                            }}
                            className="text-[10px] font-bold bg-transparent border-none p-0 focus:ring-0"
                          >
                            <option value="desk">Desk/Chair</option>
                            <option value="shelf">Shelf</option>
                            <option value="chair">Single Chair</option>
                            <option value="tree">Tree</option>
                            <option value="bush">Bush</option>
                            <option value="whiteboard">Whiteboard</option>
                            <option value="teacher_desk">Teacher Desk</option>
                            <option value="projector">Projector</option>
                            <option value="trash_can">Trash Can</option>
                            <option value="cabinet">Cabinet</option>
                            <option value="cafeteria_table">Cafeteria Table</option>
                            <option value="bench">Bench</option>
                            <option value="counter">Counter</option>
                            <option value="park_bench">Park Bench</option>
                            <option value="street_light">Street Light</option>
                            <option value="recycle_bin">Recycle Bin</option>
                            <option value="water_fountain">Water Fountain</option>
                            <option value="soccer_goal">Soccer Goal</option>
                            <option value="volleyball_net">Volleyball Net</option>
                            <option value="basketball_hoop">Basketball Hoop</option>
                            <option value="bleachers">Bleachers</option>
                            <option value="car">Car</option>
                            <option value="school_bus">School Bus</option>
                            <option value="door">Door</option>
                            <option value="window">Window</option>
                            <option value="fence">Fence</option>
                          </select>
                          <button 
                            onClick={() => {
                              const newFurn = (selectedRoom.furniture || []).filter(f => f.id !== item.id);
                              updateRoom(selectedRoom.id, { furniture: newFurn });
                            }}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-400 uppercase">Pos X</label>
                            <input 
                              type="number" step="0.1"
                              value={item.x}
                              onChange={(e) => {
                                const newFurn = [...(selectedRoom.furniture || [])];
                                newFurn[idx].x = parseFloat(e.target.value);
                                updateRoom(selectedRoom.id, { furniture: newFurn });
                              }}
                              className="w-full p-1 border border-slate-100 rounded text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-400 uppercase">Pos Y</label>
                            <input 
                              type="number" step="0.1"
                              value={item.y}
                              onChange={(e) => {
                                const newFurn = [...(selectedRoom.furniture || [])];
                                newFurn[idx].y = parseFloat(e.target.value);
                                updateRoom(selectedRoom.id, { furniture: newFurn });
                              }}
                              className="w-full p-1 border border-slate-100 rounded text-[10px]"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-400 uppercase">Rot (°)</label>
                            <input 
                              type="number" step="15"
                              value={item.rotation}
                              onChange={(e) => {
                                const newFurn = [...(selectedRoom.furniture || [])];
                                newFurn[idx].rotation = parseFloat(e.target.value);
                                updateRoom(selectedRoom.id, { furniture: newFurn });
                              }}
                              className="w-full p-1 border border-slate-100 rounded text-[10px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Manipulação 3D</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTransformMode('translate')}
                      className={cn(
                        "flex-1 p-2 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1",
                        transformMode === 'translate' ? "bg-blue-600 text-white border-blue-700" : "bg-white text-slate-600 border-slate-200"
                      )}
                    >
                      <Move className="w-3 h-3" /> Mover
                    </button>
                    <button
                      onClick={() => setTransformMode('rotate')}
                      className={cn(
                        "flex-1 p-2 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1",
                        transformMode === 'rotate' ? "bg-blue-600 text-white border-blue-700" : "bg-white text-slate-600 border-slate-200"
                      )}
                    >
                      <RotateCcw className="w-3 h-3" /> Girar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
                    Rotation <span>{selectedRoom.rotation || 0}°</span>
                  </label>
                  <input 
                    type="range" min="0" max="360" step="15" 
                    value={selectedRoom.rotation || 0} 
                    onChange={(e) => updateRoom(selectedRoom.id, { rotation: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button 
                    onClick={() => enterRoom(selectedRoom)}
                    className="col-span-2 p-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                  >
                    <Eye className="w-3 h-3" />
                    ENTER ROOM
                  </button>
                  <button 
                    onClick={() => duplicateRoom(selectedRoom)}
                    className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    DUPLICATE
                  </button>
                  <button 
                    onClick={() => deleteRoom(selectedRoom.id)}
                    className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rooms</h3>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {filteredRooms.map(room => (
                  <div 
                    key={room.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg text-xs transition-all border group",
                      selectedId === room.id ? "bg-blue-50 border-blue-200" : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                    )}
                  >
                    <button
                      onClick={() => setSelectedId(room.id)}
                      className="flex-1 text-left flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-700">{room.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mr-2">{room.width}x{room.height}</span>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const pos = new THREE.Vector3(room.x, 1.6 + (room.floor || 0) * FLOOR_HEIGHT, -room.y);
                          setTeleportRequest({ position: pos, lookAt: pos.clone().add(new THREE.Vector3(1, 0, 0)) });
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        title="Focar na Sala"
                      >
                        <Maximize className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Excluir Sala"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredRooms.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center py-4 italic">No rooms found</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <MousePointer2 className="w-4 h-4" />
            <span>Select a room to edit</span>
          </div>
          <button 
            onClick={exportData}
            className="w-full mt-4 p-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            <Box className="w-3 h-3" />
            EXPORT DATA (CSV)
          </button>
        </div>
      </div>
    </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-slate-100 h-screen w-full">
        {/* Controls Overlay */}
        <div className="absolute inset-x-0 top-4 md:top-6 px-4 md:px-6 z-10 flex justify-between items-start pointer-events-none">
          {/* Left Controls: View Management */}
          <div className="flex gap-2 flex-wrap max-w-[45%] pointer-events-auto">
            <button 
              onClick={() => setViewMode(viewMode === '3d' ? 'top' : '3d')}
              className="bg-white/90 backdrop-blur p-2 md:p-3 rounded-xl shadow-lg border border-white hover:bg-white transition-all flex items-center gap-2 text-xs md:text-sm font-medium"
            >
              {viewMode === '3d' ? <Layers className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />}
              <span className="hidden lg:inline">{viewMode === '3d' ? 'Top View' : '3D Perspective'}</span>
            </button>
            <button 
              onClick={resetCamera}
              className="bg-white/90 backdrop-blur p-2 md:p-3 rounded-xl shadow-lg border border-white hover:bg-white transition-all flex items-center gap-2 text-xs md:text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
              <span className="hidden lg:inline">Resetar</span>
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('export-glb'))}
              className="bg-white/90 backdrop-blur p-2 md:p-3 rounded-xl shadow-lg border border-white hover:bg-white transition-all flex items-center gap-2 text-xs md:text-sm font-medium"
              title="Exportar Modelo 3D (GLB)"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" />
              <span className="hidden lg:inline">Exportar</span>
            </button>
          </div>

          {/* Right Controls: Features & Interaction */}
          <div className="flex gap-2 flex-wrap justify-end max-w-[50%] pointer-events-auto md:mr-16">
            <button 
              onClick={takeScreenshot}
              className="bg-white/90 backdrop-blur p-2 md:p-3 rounded-xl shadow-lg border border-white hover:bg-white transition-all flex items-center gap-2 text-xs md:text-sm font-medium"
              title="Capturar Foto"
            >
              <Camera className="w-4 h-4 md:w-5 md:h-5 text-pink-600" />
            </button>
            
            <div className="flex bg-white/90 backdrop-blur p-1 rounded-xl shadow-lg border border-white">
              <button 
                onClick={() => setWeather('sunny')}
                className={cn("p-1 md:p-2 rounded-lg transition-all", weather === 'sunny' ? "bg-amber-100 text-amber-600" : "text-slate-400")}
                title="Ensolarado"
              >
                <Sun className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={() => setWeather('rainy')}
                className={cn("p-1 md:p-2 rounded-lg transition-all", weather === 'rainy' ? "bg-blue-100 text-blue-600" : "text-slate-400")}
                title="Chuvoso"
              >
                <Droplets className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={() => setWeather('snowy')}
                className={cn("p-1 md:p-2 rounded-lg transition-all", weather === 'snowy' ? "bg-slate-100 text-slate-600" : "text-slate-400")}
                title="Nevando"
              >
                <Activity className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <button 
              onClick={() => setShowLife(!showLife)}
              className={cn(
                "bg-white/90 backdrop-blur p-2 md:p-3 rounded-xl shadow-lg border border-white hover:bg-white transition-all flex items-center gap-2 text-xs md:text-sm font-medium",
                showLife ? "text-green-600" : "text-slate-400"
              )}
              title="Mostrar Alunos"
            >
              <Activity className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Camera Presets Selector */}
            <div className="relative group">
              <button className="bg-white/90 backdrop-blur p-2 md:p-3 rounded-xl shadow-lg border border-white hover:bg-white transition-all flex items-center gap-2 text-xs md:text-sm font-medium">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                <span className="hidden sm:inline">Ir para...</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                <button 
                  onClick={() => jumpTo(0, -44)}
                  className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-xs flex items-center gap-2"
                >
                  <Home className="w-3 h-3 text-blue-500" /> Entrada Alunos
                </button>
                <button 
                  onClick={() => jumpTo(35, 10)}
                  className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-xs flex items-center gap-2"
                >
                  <Activity className="w-3 h-3 text-green-500" /> Quadras Esportivas
                </button>
                <button 
                  onClick={() => jumpTo(-5, 0)}
                  className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-xs flex items-center gap-2"
                >
                  <Layers className="w-3 h-3 text-amber-500" /> Pátio Central
                </button>
                <button 
                  onClick={() => jumpTo(-25, 40)}
                  className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-xs flex items-center gap-2"
                >
                  <Box className="w-3 h-3 text-slate-500" /> Estacionamento
                </button>
              </div>
            </div>

          </div>

          <button 
            onClick={() => setShowMiniMap(!showMiniMap)}
            className={cn(
              "fixed top-24 right-6 bg-white/90 backdrop-blur p-2 md:p-3 rounded-xl shadow-lg border border-white hover:bg-white transition-all flex items-center justify-center z-[60]",
              showMiniMap ? "text-indigo-600" : "text-slate-400"
            )}
            title="Mostrar Mini-Mapa"
          >
            <Map className="w-[20px] h-[20px]" />
          </button>

          <button 
            onClick={() => {
              setIsMeasuring(!isMeasuring);
              if (!isMeasuring) setMeasurePoints([]);
            }}
            className={cn(
              "fixed top-40 right-6 bg-white/90 backdrop-blur p-2 md:p-3 rounded-xl shadow-lg border border-white hover:bg-white transition-all flex flex-col items-center justify-center z-[60] gap-1",
              isMeasuring ? "text-red-600 bg-red-50 border-red-200" : "text-slate-400"
            )}
            title="Ferramenta de Medição"
          >
            <Ruler className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">Medir</span>
          </button>
        </div>

        {/* Dashboard Overlay */}
        <div className="fixed bottom-6 left-6 z-20 flex gap-2">
          <VRButton store={xrStore} />
        </div>
        {showDashboard && (
          <div className="absolute top-6 right-6 z-20 w-80 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </h2>
              <button onClick={() => setShowDashboard(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Área Total Construída</p>
                <p className="text-2xl font-black text-slate-800">
                  {rooms.reduce((acc, r) => acc + (r.width * r.height), 0).toFixed(0)} m²
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Estimated Capacity</p>
                <p className="text-2xl font-black text-blue-700">
                  {Math.floor(rooms.filter(r => r.type === 'classroom').reduce((acc, r) => acc + (r.width * r.height), 0) / 1.5)} students
                </p>
                <p className="text-[10px] text-blue-400 mt-1">Based on 1.5m² per student in classrooms</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Classrooms</p>
                  <p className="text-xl font-bold text-slate-700">{rooms.filter(r => r.type === 'classroom').length}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Banheiros</p>
                  <p className="text-xl font-bold text-slate-700">{rooms.filter(r => r.type === 'service' && r.name.toLowerCase().includes('wc')).length}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Áreas Comuns</p>
                  <p className="text-xl font-bold text-slate-700">{rooms.filter(r => r.type === 'common' || r.type === 'playground' || r.type === 'cafeteria').length}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Administrativo</p>
                  <p className="text-xl font-bold text-slate-700">{rooms.filter(r => r.type === 'admin').length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3D Scene */}
        <KeyboardControls
          map={[
            { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
            { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
            { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
            { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
          ]}
        >
          <Canvas 
            shadows={{ type: THREE.PCFShadowMap }} 
            dpr={[1, 2]}
            gl={{ 
              precision: 'mediump',
              powerPreference: 'high-performance',
              antialias: true,
              preserveDrawingBuffer: true
            }}
            onPointerMissed={() => { setSelectedId(null); setSelectedFurnitureId(null); }}
          >
            <SceneExporter setViewMode={setViewMode} setShowRoof={setShowRoof} />
            <XR store={xrStore}>
              <Compass />
              {showMiniMap && (
                <MiniMap 
                  rooms={rooms} 
                  selectedId={selectedId} 
                  onTeleport={(pos) => setTeleportRequest({ position: pos, lookAt: pos.clone().add(new THREE.Vector3(1, 0, 0)) })} 
                />
              )}
              <WalkthroughHelp visible={isWalkthrough} />
              <SceneManager 
                rooms={rooms} 
                selectedId={selectedId} 
                isWalkthrough={isWalkthrough} 
                isAutoTour={isAutoTour} 
                updateRoom={updateRoom} 
                transformMode={transformMode}
              />
              <Teleporter request={teleportRequest} onComplete={() => setTeleportRequest(null)} />
              <PerspectiveCamera 
                makeDefault 
                position={viewMode === '3d' ? [0, 60, 80] : [0, 100, 0]} 
                fov={45} 
              />
              {!isWalkthrough && !isAutoTour && (
                <OrbitControls 
                  enableDamping 
                  dampingFactor={0.05}
                  minPolarAngle={viewMode === 'top' ? 0 : 0}
                  maxPolarAngle={viewMode === 'top' ? 0 : Math.PI / 2.1}
                  maxDistance={200}
                  ref={orbitControlsRef}
                />
              )}
              {isWalkthrough && !isAutoTour && (
                <>
                  <MouseLookControls />
                  <Player rooms={rooms} />
                </>
              )}
              {isAutoTour && (
                <AutoTourController rooms={rooms} onComplete={() => setIsAutoTour(false)} />
              )}
              <TourRecorder isAutoTour={isAutoTour} onTourComplete={() => setIsAutoTour(false)} />
              
              <ambientLight intensity={isEmergency ? 0.1 : 0.4} />
              <directionalLight 
                position={[sunX, sunY, 10]} 
                intensity={isEmergency ? 0.1 : (sunY > 0 ? 1.5 : 0.1)} 
                castShadow 
                shadow-mapSize={[2048, 2048]}
                color={isEmergency ? "#ff0000" : (sunY < 5 ? "#fdba74" : "#ffffff")}
              />
              
              {!isEmergency && <Sky sunPosition={[sunX, sunY, 10]} />}
              
              <Environment preset={isEmergency ? "night" : "city"} />
  
              {showFog && <fog attach="fog" args={[isEmergency ? '#450a0a' : '#f1f5f9', 10, 50]} />}
  
              <RulerTool 
                active={isMeasuring} 
                points={measurePoints.map(p => [p.x, p.y, p.z]) as any} 
                onAddPoint={(p) => setMeasurePoints([...measurePoints, new THREE.Vector3(...p)])}
                onClear={() => setMeasurePoints([])}
              />
              
              <mesh 
                visible={false} 
                rotation={[-Math.PI / 2, 0, 0]} 
                onPointerDown={(e) => {
                  if (isMeasuring) {
                    e.stopPropagation();
                    const p = e.point;
                    if (measurePoints.length >= 2) {
                      setMeasurePoints([p]);
                    } else {
                      setMeasurePoints([...measurePoints, p]);
                    }
                  }
                }}
              >
                <planeGeometry args={[200, 200]} />
              </mesh>
  
              <CalibrationTool
                active={isCalibrating}
                points={calibrationPoints}
                onPoint={handleCalibrationPoint}
              />
  
              <Heatmap rooms={rooms} active={isHeatmap} />
              <EvacuationRoutes rooms={rooms} pois={POIS} active={isEmergency} />
  
              <TourManager 
                active={isTouring} 
                waypoints={tourWaypoints} 
                onComplete={() => setIsTouring(false)} 
              />
  
              <WeatherEffects weather={weather} sunY={sunY} />
              {showLife && <StudentCharacters rooms={rooms} />}
  
              <group name="export-group">
                {/* Scene elements omitted for brevity in chunk but they will remain */}
              {/* Street Labels */}
              <StreetLabel name="Rua Bruno Samarco" position={[0, 0.1, -48]} />
              <StreetLabel name="Rua Dr. Gomes Neto" position={[0, 0.1, 48]} />
              <StreetLabel name="Av. Rio Grande" position={[-48, 0.1, 0]} rotation={Math.PI / 2} />
              <StreetLabel name="Av. Washington Luís" position={[48, 0.1, 0]} rotation={Math.PI / 2} />

              {/* Street Cars */}
              <Car position={[20, 0, -48]} rotation={0} color="#14b8a6" />
              <Car position={[-10, 0, 48]} rotation={Math.PI} color="#8b5cf6" />
              <Car position={[-48, 0, 15]} rotation={-Math.PI / 2} color="#f43f5e" />
              <Car position={[48, 0, -25]} rotation={Math.PI / 2} color="#eab308" />

              {/* Legends and Floating Texts */}
              <LegendBoard />
              <ColorLegend />
              
              {/* Large Area Labels */}
              <FloatingText text="Quadra descoberta\n792,00m2" position={[25, 0.2, -35]} color="#ffffff" />
              <FloatingText text="Quadra descoberta\n792,00m2" position={[40, 0.2, -15]} rotation={-Math.PI / 6} color="#ffffff" />
              <FloatingText text="Quadra coberta\n792,00m2" position={[30, 0.2, 20]} rotation={-Math.PI / 4} color="#1e293b" />
              <FloatingText text="Auditório\n355,40m2" position={[15, 0.2, 25]} color="#1e293b" />
              <FloatingText text="Zeladoria 74,00m2" position={[25, 0.2, 40]} rotation={Math.PI / 2} color="#1e293b" />
              <FloatingText text="Entrada de alunos" position={[0, 0.2, 45]} color="#1e293b" />
              <FloatingText text="Estacionamento" position={[-15, 0.2, -45]} color="#1e293b" />
              <FloatingText text="Pátio Coberto" position={[5, 0.2, -15]} color="#1e293b" />
              <FloatingText text="Pátio Coberto" position={[-5, 0.2, 15]} color="#1e293b" />

              {refImage && refConfig.visible && (
                <Suspense fallback={null}>
                  <ReferencePlane image={refImage} config={refConfig} />
                </Suspense>
              )}
              {rooms.filter(r => r && visibleFloors.includes(r.floor || 0)).map(room => (
                <Room 
                  key={room.id} 
                  data={room} 
                  isSelected={selectedId === room.id}
                  onSelect={() => { setSelectedId(room.id); setSelectedFurnitureId(null); }}
                  renderMode={renderMode}
                  showFurniture={showFurniture}
                  showRoof={showRoof}
                  isTransparent={isTransparent || activeFloor > (room.floor || 0)}
                  selectedFurnitureId={selectedFurnitureId}
                  onSelectFurniture={(furnId) => {
                    setSelectedId(room.id);
                    setSelectedFurnitureId(furnId);
                  }}
                  onUpdateFurniturePosition={handleUpdateFurniturePosition}
                  isNight={isNight}
                />
              ))}
              
              {/* People */}
              {showLife && (
                <DynamicLife rooms={rooms} sunTime={sunTime} sunPaused={sunPaused} />
              )}
              
              {/* POIs */}
              {showPOIs && POIS.map(poi => (
                <POI key={poi.id} data={poi} isEmergency={isEmergency} />
              ))}

              {/* Human Scale */}
              <Human position={[7, 0, 6]} />

              {/* Ground Plane (Grass outside) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial map={getTexture('grass', 50, 50)} />
              </mesh>

              {/* School Ground (Paved) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
                <planeGeometry args={[90, 90]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
              </mesh>
              
              <Grid 
                infiniteGrid 
                fadeDistance={150} 
                fadeStrength={5} 
                cellSize={1} 
                sectionSize={5} 
                sectionColor="#cbd5e1" 
                cellColor="#e2e8f0" 
              />
            </group>

            <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={150} blur={2} far={4.5} />

            {isNight && (
              <EffectComposer>
                <Bloom 
                  intensity={1.5} 
                  luminanceThreshold={0.2} 
                  luminanceSmoothing={0.9} 
                  mipmapBlur 
                />
              </EffectComposer>
            )}
            </XR>
          </Canvas>
        </KeyboardControls>

        {/* UI Overlay */}
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur text-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-700 shadow-2xl">
            <div className="flex gap-4 md:gap-6">
              <div>
                <p className="text-xl md:text-2xl font-bold">{rooms.length}</p>
                <p className="text-[9px] md:text-[10px] text-slate-400 uppercase">Rooms</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">
                  {rooms.reduce((acc, r) => acc + (r.width * r.height), 0).toFixed(0)}m²
                </p>
                <p className="text-[9px] md:text-[10px] text-slate-400 uppercase">Área Total</p>
              </div>
              <div className="border-l border-slate-700 pl-4 md:pl-6">
                <p className="text-xl md:text-2xl font-bold text-orange-400">{Math.floor(sunTime)}:00</p>
                <p className="text-[9px] md:text-[10px] text-slate-400 uppercase">Solar Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clock UI */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 md:top-6 z-10 flex items-center gap-4 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur text-white px-4 py-1 md:px-6 md:py-2 rounded-full border border-slate-700 shadow-xl flex items-center gap-3 md:gap-4">
            <div className="relative w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white/20">
              <div 
                className="absolute top-1/2 left-1/2 w-[1.5px] md:w-0.5 h-2 md:h-3 bg-white origin-bottom -translate-x-1/2 -translate-y-full"
                style={{ transform: `rotate(${(sunTime / 12) * 360}deg)` }}
              />
              <div 
                className="absolute top-1/2 left-1/2 w-[1.5px] md:w-0.5 h-1.5 md:h-2 bg-orange-400 origin-bottom -translate-x-1/2 -translate-y-full"
                style={{ transform: `rotate(${(sunTime % 12) * 30}deg)` }}
              />
            </div>
            <div className="text-lg md:text-xl font-mono font-bold tracking-wider">
              {Math.floor(sunTime).toString().padStart(2, '0')}:00
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Modal */}
      <GalleryModal 
        isOpen={isGalleryOpen}
        photos={selectedRoomPhotos}
        roomName={selectedRoom?.name || ''}
        onClose={() => setIsGalleryOpen(false)}
      />
      {showCalibrationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-600 text-white">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Calibrar Escala
              </h2>
              <button onClick={() => setShowCalibrationModal(false)} className="hover:bg-white/20 p-1 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Você selecionou dois pontos na planta. Qual é a distância real entre esses pontos em metros?
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Distância Real (Metros)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={calibrationDistance}
                    onChange={(e) => setCalibrationDistance(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Ex: 10"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">m</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowCalibrationModal(false)}
                  className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={applyCalibration}
                  className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  APLICAR ESCALA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
