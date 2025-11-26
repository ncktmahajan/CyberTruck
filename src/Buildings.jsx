import React, { useMemo, useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { InstancedMesh, Object3D, Matrix4 } from "three";
import * as THREE from "three";

/**
 * Props:
 *  - sideSpacing: horizontal offset from road center (positive)
 *  - rows: how many buildings per side
 *  - spacingZ: distance between consecutive buildings
 *  - depth: how far along Z the buildings fill (positive number)
 *  - speed: current game speed (affects scroll)
 *  - modelUrls: array of model urls to randomly choose from (strings)
 */
export default function BuildingsGLTF({
  sideSpacing = 10,
  rows = 30,
  spacingZ = 20,
  speed = 0,
  modelUrls = ["/models/building_1.glb"],
}) {
  // We'll load all models up-front
  const gltfs = useMemo(() => modelUrls.map((u) => useGLTF(u)), [modelUrls]);
  // If you only want first model, you can use useGLTF directly instead of above.

  // Number of instances per side (rows)
  const total = rows;

  // Refs for left & right instanced meshes
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  // A reusable Object3D for setting instance matrices
  const temp = useMemo(() => new Object3D(), []);
  const dummyMatrix = useMemo(() => new Matrix4(), []);

  // Build initial positions data (mutable)
  const instances = useMemo(() => {
    const arr = [];
    for (let i = 0; i < total; i++) {
      // z ranges from 0 to rows*spacingZ
      const baseZ = -i * spacingZ; // negative so they sit ahead of camera (adjust to your coordinate system)
      arr.push({
        z: baseZ,
        // small offset random so they don't line up perfectly
        offsetX: (Math.random() - 0.5) * 2,
        scale: 0.8 + Math.random() * 1.6,
        modelIndex: Math.floor(Math.random() * modelUrls.length),
      });
    }
    return arr;
  }, [total, spacingZ, modelUrls.length]);

  // Initialize instance matrices once after models load
  useEffect(() => {
    // Wait for GLTF content loaded
    if (!gltfs || gltfs.length === 0) return;
    // For left side
    if (leftRef.current) {
      let i = 0;
      for (const inst of instances) {
        temp.position.set(-sideSpacing + inst.offsetX, inst.scale * 0.5 * 10, inst.z);
        temp.scale.set(inst.scale, inst.scale, inst.scale);
        temp.rotation.y = (Math.random() - 0.5) * 0.2; // slight yaw variation
        temp.updateMatrix();
        leftRef.current.setMatrixAt(i, temp.matrix);
        i++;
      }
      leftRef.current.instanceMatrix.needsUpdate = true;
    }

    // For right side
    if (rightRef.current) {
      let i = 0;
      for (const inst of instances) {
        temp.position.set(sideSpacing + inst.offsetX, inst.scale * 0.5 * 10, inst.z);
        temp.scale.set(inst.scale, inst.scale, inst.scale);
        temp.rotation.y = (Math.random() - 0.5) * 0.2;
        temp.updateMatrix();
        rightRef.current.setMatrixAt(i, temp.matrix);
        i++;
      }
      rightRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [gltfs, instances, sideSpacing]);

  // Scroll logic — move instances forward relative to camera using speed.
  // When an instance passes behind the camera (z > recycleZ), we push it far ahead.
  useEffect(() => {
    // We'll update matrices each animation frame using requestAnimationFrame
    let raf = null;
    const recycleDistance = total * spacingZ; // when z > threshold, recycle
    const update = (time) => {
      // delta-based movement (approx)
      // convert speed to world units per second factor (tweak multiplier if needed)
      const dt = 1 / 60; // approximate frame time — acceptable for this simple updater
      const move = dt * (speed * 0.1); // tune 0.1 multiplier to taste

      // Update both sides and instance z positions
      let updatedLeft = false;
      let updatedRight = false;

      // left
      if (leftRef.current) {
        for (let i = 0; i < instances.length; i++) {
          instances[i].z += move;
          if (instances[i].z > spacingZ * 2) {
            // moved behind camera; recycle ahead
            instances[i].z -= recycleDistance;
            // randomize some properties on recycle
            instances[i].offsetX = (Math.random() - 0.5) * 2;
            instances[i].scale = 0.8 + Math.random() * 1.6;
          }
          temp.position.set(-sideSpacing + instances[i].offsetX, instances[i].scale * 0.5 * 10, instances[i].z);
          temp.scale.set(instances[i].scale, instances[i].scale, instances[i].scale);
          temp.rotation.y = (Math.random() - 0.5) * 0.2;
          temp.updateMatrix();
          leftRef.current.setMatrixAt(i, temp.matrix);
          updatedLeft = true;
        }
        if (updatedLeft) leftRef.current.instanceMatrix.needsUpdate = true;
      }

      // right
      if (rightRef.current) {
        for (let i = 0; i < instances.length; i++) {
          // use same instance z so both sides match
          temp.position.set(sideSpacing + instances[i].offsetX, instances[i].scale * 0.5 * 10, instances[i].z);
          temp.scale.set(instances[i].scale, instances[i].scale, instances[i].scale);
          temp.rotation.y = (Math.random() - 0.5) * 0.2;
          temp.updateMatrix();
          rightRef.current.setMatrixAt(i, temp.matrix);
          updatedRight = true;
        }
        if (updatedRight) rightRef.current.instanceMatrix.needsUpdate = true;
      }

      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [speed, instances, sideSpacing, spacingZ, total]);

  // Render two instanced meshes using a simple bounding-box geometry for frustum/lighting
  // We will use a basic box geometry; actual mesh content used for shadows should be baked
  return (
    <group>
      {/* Left side instanced boxes (will be replaced visually by the GLTF if you prefer) */}
      <instancedMesh ref={leftRef} args={[null, null, total]} castShadow receiveShadow>
        <boxBufferGeometry args={[10, 20, 10]} />
        <meshStandardMaterial color="#7b7b7b" />
      </instancedMesh>

      <instancedMesh ref={rightRef} args={[null, null, total]} castShadow receiveShadow>
        <boxBufferGeometry args={[10, 20, 10]} />
        <meshStandardMaterial color="#7b7b7b" />
      </instancedMesh>
    </group>
  );
}
