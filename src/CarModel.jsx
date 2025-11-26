import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

export default function CarModel({
  onSeatRequest,
  currentSeat,
  headLightsOn,
  rearLightsOn,
  carRef,
  headLightRef,
  rearLightRef,
  speed,
}) {
  const { scene } = useGLTF("cyber truck.glb");

  // Door rotation target refs
  const targets = {
    LF: useRef(0),
    RF: useRef(0),
    LR: useRef(0),
    RR: useRef(0),
    Frunk: useRef(0),
  };

  const trunkTarget = useRef(0);

  // Open/close states
  const [openLF, setOpenLF] = useState(false);
  const [openRF, setOpenRF] = useState(false);
  const [openLR, setOpenLR] = useState(false);
  const [openRR, setOpenRR] = useState(false);
  const [openFrunk, setOpenFrunk] = useState(false);
  const [openTrunk, setOpenTrunk] = useState(false);

  const trunkMeshRef = useRef(null);
  const lightMaterials = useRef({});
  const frontLightMesh = useRef(null);
  const rearLightMesh = useRef(null);

  // === Helper: find a node by name ===
  const find = (name) => {
    let found = null;
    scene.traverse((n) => {
      if (n.name === name) found = n;
    });
    return found;
  };

  // === Initial traversal: setup lights, trunk mesh, shadows ===
  useEffect(() => {
    scene.traverse((node) => {
      // TRUNK morph mesh
      if (node.name === "Trunk" && node.morphTargetInfluences) {
        trunkMeshRef.current = node;
        if (trunkMeshRef.current.morphTargetInfluences[0] === undefined) {
          trunkMeshRef.current.morphTargetInfluences[0] = 0;
        }
      }

      // Assign correct meshes
      if (node.name === "Front_Light") frontLightMesh.current = node;
      if (node.name === "Rear_Light") rearLightMesh.current = node;

      // Light materials
      if (node.isMesh && (node.name === "Front_Light" || node.name === "Rear_Light")) {
        const mat = node.material.clone();
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
        lightMaterials.current[node.name] = mat;
        node.material = mat;
      }

      // Enable full shadows
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
  }, [scene]);

  // === Update emissive materials based on headlight/rear light toggle ===
  useEffect(() => {
    const headMat = lightMaterials.current["Front_Light"];
    const rearMat = lightMaterials.current["Rear_Light"];

    if (headMat) {
      headMat.emissiveIntensity = headLightsOn ? 2.5 : 0;
      headMat.emissive.set(headLightsOn ? 0xffffff : 0x000000);
    }

    if (rearMat) {
      rearMat.emissiveIntensity = rearLightsOn ? 3 : 0;
      rearMat.emissive.set(rearLightsOn ? 0xff0000 : 0x000000);
    }
  }, [headLightsOn, rearLightsOn]);

  // === Auto-close door when a seat is entered ===
  useEffect(() => {
    if (!currentSeat) return;

    const doorMap = {
      driver: { ref: targets.LF, set: setOpenLF },
      passenger: { ref: targets.RF, set: setOpenRF },
      rear_left: { ref: targets.LR, set: setOpenLR },
      rear_right: { ref: targets.RR, set: setOpenRR },
    };

    const door = doorMap[currentSeat];
    if (door) {
      const id = setTimeout(() => {
        door.ref.current = 0;
        door.set(false);
      }, 500);

      return () => clearTimeout(id);
    }
  }, [currentSeat]);

  // ================================================================
  // 🔥 FRAME LOOP
  // ================================================================
  useFrame(() => {
    // DOORS
    const lf = find("LF_Door");
    const rf = find("RF_Door");
    const lr = find("LR_Door");
    const rr = find("RR_Door");
    const fr = find("Frunk");

    if (lf) lf.rotation.y = THREE.MathUtils.lerp(lf.rotation.y, targets.LF.current, 0.12);
    if (rf) rf.rotation.y = THREE.MathUtils.lerp(rf.rotation.y, targets.RF.current, 0.12);
    if (lr) lr.rotation.y = THREE.MathUtils.lerp(lr.rotation.y, targets.LR.current, 0.12);
    if (rr) rr.rotation.y = THREE.MathUtils.lerp(rr.rotation.y, targets.RR.current, 0.12);
    if (fr) fr.rotation.x = THREE.MathUtils.lerp(fr.rotation.x, targets.Frunk.current, 0.12);

    // TRUNK morph
    if (trunkMeshRef.current) {
      trunkMeshRef.current.morphTargetInfluences[0] = THREE.MathUtils.lerp(
        trunkMeshRef.current.morphTargetInfluences[0] ?? 0,
        trunkTarget.current,
        0.12
      );
    }

    // === Wheel rotation ===
    const rot = speed * 0.15;

    if (speed > 0) {
      const flt = find("FL_Tire");
      const frt = find("FR_Tire");
      const rlt = find("RL_Tire");
      const rrt = find("RR_Tire");

      if (flt) flt.rotation.x -= rot;
      if (frt) frt.rotation.x -= rot;
      if (rlt) rlt.rotation.x -= rot;
      if (rrt) rrt.rotation.x -= rot;
    }

if (frontLightMesh.current && headLightRef.current) {
  // Get original position from GLTF
  frontLightMesh.current.getWorldPosition(headLightRef.current.position);

  // SHIFT FORWARD (Z+) OR ANY DIRECTION
  headLightRef.current.position.z += 1.2;  // forward offset
  headLightRef.current.position.y += 0.2;  // slightly up (optional)

  // Aim forward
  headLightRef.current.target.position.set(
    headLightRef.current.position.x,
    headLightRef.current.position.y - 0.1,
    headLightRef.current.position.z + 10
  );
  headLightRef.current.target.updateMatrixWorld();
}

if (rearLightMesh.current && rearLightRef.current) {
  // Get original world position
  rearLightMesh.current.getWorldPosition(rearLightRef.current.position);

  // SHIFT BACKWARD (Z−) OR ANY DIRECTION
  rearLightRef.current.position.z -= 1.2; // backward offset
  rearLightRef.current.position.y += 0.1; // slight up

  // Aim backwards
  rearLightRef.current.target.position.set(
    rearLightRef.current.position.x,
    rearLightRef.current.position.y - 0.1,
    rearLightRef.current.position.z - 10
  );
  rearLightRef.current.target.updateMatrixWorld();
}

  });

  // ================================================================
  // CLICK LOGIC
  // ================================================================
  const targetNames = ["LF_Door", "RF_Door", "LR_Door", "RR_Door", "Frunk", "Trunk"];

  const findClickable = (obj) => {
    let cur = obj;
    while (cur) {
      if (targetNames.includes(cur.name)) return cur;
      cur = cur.parent;
    }
    return null;
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();

    const hit = findClickable(e.object);
    if (!hit) return;

    const name = hit.name;

    // DOOR MAP
    const doors = {
      LF_Door: { set: setOpenLF, state: openLF, ref: targets.LF, angle: -Math.PI / 2, seat: "driver" },
      RF_Door: { set: setOpenRF, state: openRF, ref: targets.RF, angle: Math.PI / 2, seat: "passenger" },
      LR_Door: { set: setOpenLR, state: openLR, ref: targets.LR, angle: -Math.PI / 2, seat: "rear_left" },
      RR_Door: { set: setOpenRR, state: openRR, ref: targets.RR, angle: Math.PI / 2, seat: "rear_right" },
    };

    // DOOR CLICK LOGIC
    if (doors[name]) {
      const d = doors[name];

      // Already inside → switch seat
      if (currentSeat) {
        onSeatRequest(d.seat);
        return;
      }

      // If door open → enter seat
      if (d.state) {
        onSeatRequest(d.seat);
        return;
      }

      // Otherwise open the door
      d.set(true);
      d.ref.current = d.angle;
      return;
    }

    // FRUNK
    if (name === "Frunk") {
      setOpenFrunk((o) => {
        targets.Frunk.current = !o ? -Math.PI / 3 : 0;
        return !o;
      });
      return;
    }

    // TRUNK
    if (name === "Trunk") {
      setOpenTrunk((o) => {
        trunkTarget.current = !o ? 1 : 0;
        return !o;
      });
      return;
    }
  };

  return (
    <primitive
      object={scene}
      ref={carRef}
      scale={1}
      onPointerDown={handlePointerDown}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    />
  );
}
