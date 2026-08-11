// Interactive 3D avatar viewer (web). True .glb rendering with 360° orbit, zoom,
// and NAME-BASED socket attachment: gear .glb models are mounted onto named
// sockets on the avatar (or onto an equipped backpack's pocket sockets). The
// base avatar is never regenerated — gear is added/removed as child objects.
//
// Uses only `three` + `@react-three/fiber` (no drei) to keep the dependency
// surface small and reliable across web + Expo.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { type Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  type Avatar3DDefinition, type Gear3DMetadata, type GearTransform3D, type WaterBottlePosition,
} from "@shared/avatar-3d";
import { type MountInstruction } from "@shared/avatar-equipment-resolver";
import { BOTTLE_POSITIONS } from "@/lib/avatar-3d-catalog";

function applyTransform(obj: Object3D, t: GearTransform3D) {
  obj.position.set(...t.position);
  obj.rotation.set(...t.rotation);
  obj.scale.set(...t.scale);
}

/** Loads an avatar .glb and exposes its cloned root once ready. */
function AvatarBody({ url, onReady }: { url: string; onReady: (root: Object3D | null) => void }) {
  const gltf = useLoader(GLTFLoader, url);
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf]);
  useEffect(() => { onReady(cloned); return () => onReady(null); }, [cloned, onReady]);
  return <primitive object={cloned} />;
}

/** Attaches one gear .glb onto a target socket (on the avatar, or on a backpack
 *  that has registered itself). Cleans up on unmount/removal. */
function AttachedGear({
  mount, avatarRoot, backpacks, onRegisterBackpack,
}: {
  mount: MountInstruction;
  avatarRoot: Object3D | null;
  backpacks: Record<string, Object3D>;
  onRegisterBackpack: (id: string, obj: Object3D | null) => void;
}) {
  const { gear } = mount;
  const gltf = useLoader(GLTFLoader, gear.modelUrl);
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf]);

  let socketName = gear.primarySocket;
  let transform: GearTransform3D = gear.defaultTransform;
  let parent: Object3D | null = avatarRoot;
  if (gear.slot === "water_bottle" && mount.position) {
    const pp = BOTTLE_POSITIONS[mount.position as WaterBottlePosition];
    if (pp) {
      socketName = pp.socket; transform = pp.transform;
      if (pp.onBackpack && mount.parentGearId) parent = backpacks[mount.parentGearId] ?? null;
    }
  }

  useEffect(() => {
    if (!parent) return;
    const socket = parent.getObjectByName(socketName) ?? parent;
    socket.add(cloned);
    applyTransform(cloned, transform);
    if (gear.slot === "backpack") onRegisterBackpack(gear.id, cloned);
    return () => {
      socket.remove(cloned);
      if (gear.slot === "backpack") onRegisterBackpack(gear.id, null);
    };
  }, [cloned, parent, socketName, gear.id, gear.slot]); // eslint-disable-line

  return null;
}

function Scene({ avatar, mounts }: { avatar: Avatar3DDefinition; mounts: MountInstruction[] }) {
  const [avatarRoot, setAvatarRoot] = useState<Object3D | null>(null);
  const [backpacks, setBackpacks] = useState<Record<string, Object3D>>({});
  const registerBackpack = (id: string, obj: Object3D | null) =>
    setBackpacks((m) => { const n = { ...m }; if (obj) n[id] = obj; else delete n[id]; return n; });

  // Mount backpacks first so pocket children can find their parent.
  const ordered = useMemo(
    () => [...mounts].sort((a, b) => (b.slot === "backpack" ? 1 : 0) - (a.slot === "backpack" ? 1 : 0)),
    [mounts],
  );

  return (
    <group position={[0, -0.6, 0]}>
      <AvatarBody url={avatar.modelUrl} onReady={setAvatarRoot} />
      {avatarRoot && ordered.map((m) => (
        <AttachedGear
          key={m.slot + ":" + m.gear.id + ":" + (m.position ?? "")}
          mount={m}
          avatarRoot={avatarRoot}
          backpacks={backpacks}
          onRegisterBackpack={registerBackpack}
        />
      ))}
    </group>
  );
}

function CameraRig({ controlsRef, reducedMotion }: { controlsRef: React.MutableRefObject<ThreeOrbitControls | null>; reducedMotion?: boolean }) {
  const { camera, gl, scene } = useThree();
  // Dev-only handle so automated checks can inspect the live scene graph.
  useEffect(() => { if (import.meta.env.DEV) (window as any).__r3fScene = scene; }, [scene]);
  useEffect(() => {
    const c = new ThreeOrbitControls(camera, gl.domElement);
    c.enablePan = false;
    c.minDistance = 1.4; c.maxDistance = 4;
    c.minPolarAngle = Math.PI / 6; c.maxPolarAngle = Math.PI - Math.PI / 3;
    c.enableDamping = true; c.dampingFactor = 0.08;
    c.autoRotate = !reducedMotion; c.autoRotateSpeed = 0.9;
    c.target.set(0, 0.2, 0); c.update();
    controlsRef.current = c;
    return () => { c.dispose(); controlsRef.current = null; };
  }, [camera, gl, reducedMotion, controlsRef]);
  useFrame(() => controlsRef.current?.update());
  return null;
}

export interface Avatar3DViewerProps {
  avatar: Avatar3DDefinition;
  mounts: MountInstruction[];
  className?: string;
  reducedMotion?: boolean;
}

export default function Avatar3DViewer({ avatar, mounts, className = "", reducedMotion }: Avatar3DViewerProps) {
  const controls = useRef<ThreeOrbitControls | null>(null);
  return (
    <div className={`relative ${className}`} data-testid="avatar-3d-viewer">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.85, 2.3], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.95} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <directionalLight position={[-3, 2, -2]} intensity={0.4} />
        <Suspense fallback={null}>
          <Scene avatar={avatar} mounts={mounts} />
        </Suspense>
        <CameraRig controlsRef={controls} reducedMotion={reducedMotion} />
      </Canvas>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" data-testid="avatar-3d-cameras">
        {([["Front", 0], ["Side", Math.PI / 2], ["Back", Math.PI]] as [string, number][]).map(([label, angle]) => (
          <button
            key={label}
            onClick={() => {
              const c = controls.current; if (!c) return;
              const r = 2.3;
              c.object.position.set(Math.sin(angle) * r, 0.85, Math.cos(angle) * r);
              c.update();
            }}
            className="px-2.5 py-1 rounded-full bg-white/85 text-gray-700 text-xs font-bold shadow"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
