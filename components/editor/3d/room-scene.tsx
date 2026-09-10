"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ProjectItem, RoomEntity, RoomModel } from "@/types";
import { productById } from "@/data/catalog";
import { CONFIDENCE } from "@/lib/spatial/reconstruction";

/** Paint a surface amber only when it clearly needs a look — not for the
 *  whole "verify recommended" band, which would tint the entire room. */
function surfaceFlagged(e: Pick<RoomEntity, "confidence" | "validationStatus">): boolean {
  if (e.validationStatus === "verified") return false;
  return e.validationStatus === "needs_verification" || e.confidence < CONFIDENCE.verifyRecommended;
}

const FT = 1 / 12; // inches → feet, for sane camera distances
const APPLIED_FALLBACK = "#c9c4bb";
const BARE_FLOOR = "#d9d4ca";
const BARE_WALL = "#eceae4";

function swatchColor(productId: string | undefined): string | null {
  if (!productId) return null;
  const p = productById(productId);
  if (!p) return null;
  return p.swatch.match(/#[0-9a-fA-F]{6}/)?.[0] ?? APPLIED_FALLBACK;
}

interface Props {
  model: RoomModel;
  items: ProjectItem[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  walkMode: boolean;
}

export function RoomScene({ model, items, selectedEntityId, onSelectEntity, walkMode }: Props) {
  const centroid = useMemo(() => {
    const xs = model.floorPolygon.map((p) => p.x);
    const zs = model.floorPolygon.map((p) => p.z);
    return {
      x: ((Math.max(...xs) + Math.min(...xs)) / 2) * FT,
      z: ((Math.max(...zs) + Math.min(...zs)) / 2) * FT,
    };
  }, [model.floorPolygon]);

  const span = Math.max(model.bounds.widthIn, model.bounds.lengthIn) * FT;

  const materialFor = (entityId: string) =>
    swatchColor(items.find((i) => i.roomEntityId === entityId)?.productId) ?? null;

  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.75]}
      camera={{ position: [centroid.x + span * 0.9, span * 0.85, centroid.z + span * 0.9], fov: 45 }}
      onPointerMissed={() => onSelectEntity(null)}
    >
      <color attach="background" args={["#f4f5f6"]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[span, span * 1.5, span * 0.5]} intensity={0.55} />
      <hemisphereLight args={["#ffffff", "#d8d5cd", 0.5]} />

      <group>
        {model.entities.map((e) => {
          if (e.type === "floor" || e.type === "ceiling") {
            return (
              <SurfacePlane
                key={e.id}
                entity={e}
                polygon={model.floorPolygon}
                elevationIn={e.type === "floor" ? 0 : model.ceilingHeightIn}
                color={materialFor(e.id) ?? BARE_FLOOR}
                selected={selectedEntityId === e.id}
                needsReview={model.calibration.status !== "uncalibrated" && surfaceFlagged(e)}
                onSelect={() => onSelectEntity(e.id)}
                dim={e.type === "ceiling"}
              />
            );
          }
          if (e.type === "wall") {
            const idx = model.entities.filter((x) => x.type === "wall").indexOf(e);
            const a = model.floorPolygon[idx];
            const b = model.floorPolygon[(idx + 1) % model.floorPolygon.length];
            return (
              <WallPlane
                key={e.id}
                entity={e}
                a={a}
                b={b}
                heightIn={model.ceilingHeightIn}
                openings={model.entities.filter((o) => e.openingIds?.includes(o.id))}
                normal={e.geometry.plane?.normal ?? { x: 0, y: 0, z: 1 }}
                color={materialFor(e.id) ?? BARE_WALL}
                selected={selectedEntityId === e.id}
                needsReview={model.calibration.status !== "uncalibrated" && surfaceFlagged(e)}
                onSelect={() => onSelectEntity(e.id)}
              />
            );
          }
          return null;
        })}
      </group>

      <gridHelper args={[span * 3, Math.round(span * 3), "#dddbd4", "#e9e7e1"]} position={[centroid.x, -0.01, centroid.z]} />
      <OrbitControls
        makeDefault
        target={[centroid.x, model.ceilingHeightIn * FT * 0.4, centroid.z]}
        enablePan={!walkMode}
        minDistance={span * 0.25}
        maxDistance={span * 3}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}

function highlight(selected: boolean, needsReview: boolean) {
  if (selected) return { color: "#1f4d40", opacity: 0.9 };
  if (needsReview) return { color: "#c98a3c", opacity: 0.55 };
  return null;
}

function SurfacePlane({
  entity,
  polygon,
  elevationIn,
  color,
  selected,
  needsReview,
  onSelect,
  dim,
}: {
  entity: RoomEntity;
  polygon: { x: number; z: number }[];
  elevationIn: number;
  color: string;
  selected: boolean;
  needsReview: boolean;
  onSelect: () => void;
  dim?: boolean;
}) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    polygon.forEach((p, i) => (i === 0 ? shape.moveTo(p.x * FT, p.z * FT) : shape.lineTo(p.x * FT, p.z * FT)));
    shape.closePath();
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [polygon]);

  const hl = highlight(selected, needsReview);
  const [hover, setHover] = useState(false);

  return (
    <mesh
      geometry={geom}
      position={[0, elevationIn * FT, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      <meshStandardMaterial
        color={hl?.color ?? (hover && !dim ? "#dfe6e2" : color)}
        transparent={dim || !!hl}
        opacity={hl?.opacity ?? (dim ? 0.12 : 1)}
        side={THREE.DoubleSide}
        roughness={0.95}
      />
      <RoleTag entity={entity} />
    </mesh>
  );
}

function WallPlane({
  entity,
  a,
  b,
  heightIn,
  openings,
  normal,
  color,
  selected,
  needsReview,
  onSelect,
}: {
  entity: RoomEntity;
  a: { x: number; z: number };
  b: { x: number; z: number };
  heightIn: number;
  openings: RoomEntity[];
  normal: { x: number; y: number; z: number };
  color: string;
  selected: boolean;
  needsReview: boolean;
  onSelect: () => void;
}) {
  const lenFt = Math.hypot(b.x - a.x, b.z - a.z) * FT;
  const hFt = heightIn * FT;
  const mid: [number, number, number] = [((a.x + b.x) / 2) * FT, hFt / 2, ((a.z + b.z) / 2) * FT];
  const angle = Math.atan2(b.z - a.z, b.x - a.x);
  const hl = highlight(selected, needsReview);
  const [hover, setHover] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  // dollhouse cutaway: fade the wall between the camera and the room interior
  useFrame(({ camera }) => {
    if (!matRef.current || selected) return;
    const toCam = new THREE.Vector3(camera.position.x - mid[0], 0, camera.position.z - mid[2]).normalize();
    const inward = new THREE.Vector3(normal.x, 0, normal.z).normalize();
    const facing = toCam.dot(inward); // >0 camera is inside the room relative to this wall
    const target = facing < -0.1 ? 0.06 : facing < 0.15 ? 0.4 : hover ? 1 : 0.92;
    matRef.current.opacity += (target - matRef.current.opacity) * 0.25;
    matRef.current.depthWrite = matRef.current.opacity > 0.6;
  });

  return (
    <group ref={groupRef} position={mid} rotation={[0, -angle, 0]}>
      <mesh
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
      >
        <planeGeometry args={[lenFt, hFt]} />
        <meshStandardMaterial
          ref={matRef}
          color={hl?.color ?? color}
          transparent
          opacity={hl?.opacity ?? 0.92}
          side={THREE.DoubleSide}
          roughness={0.95}
        />
      </mesh>
      {openings.map((o) => {
        const w = (o.dimensions.widthIn ?? 0) * FT;
        const h = (o.dimensions.heightIn ?? 0) * FT;
        const ox = (o.geometry.position?.x ?? 0) * FT - lenFt / 2 + w / 2;
        const oy = (o.geometry.position?.y ?? 0) * FT - hFt / 2 + h / 2;
        return (
          <mesh key={o.id} position={[ox, oy, 0.01]}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial color={o.type === "door" ? "#4a4a4a" : "#9fb8c9"} transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      <RoleTag entity={entity} />
    </group>
  );
}

/** Invisible carrier for the entity id — used nowhere visually, keeps types tidy. */
function RoleTag({ entity }: { entity: RoomEntity }) {
  return <group name={entity.id} visible={false} />;
}
