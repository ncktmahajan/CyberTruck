import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function VRControllers() {
  const { gl, scene } = useThree();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!gl.xr || !gl.xr.enabled) return;

    try {
      const controller1 = gl.xr.getController(0);
      const controller2 = gl.xr.getController(1);

      const grip1 = gl.xr.getControllerGrip(0);
      const grip2 = gl.xr.getControllerGrip(1);

      const geometry = new THREE.SphereGeometry(0.05, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: 0x00dcc8,
        emissive: 0x00dcc8,
        emissiveIntensity: 0.5,
      });

      const marker1 = new THREE.Mesh(geometry, material);
      const marker2 = new THREE.Mesh(geometry, material.clone());

      grip1.add(marker1);
      grip2.add(marker2);

      scene.add(controller1);
      scene.add(controller2);
      scene.add(grip1);
      scene.add(grip2);

      setInitialized(true);

      return () => {
        scene.remove(controller1);
        scene.remove(controller2);
        scene.remove(grip1);
        scene.remove(grip2);
      };
    } catch (err) {
      console.warn("VR controllers not available:", err);
    }
  }, [gl, scene]);

  return null;
}
