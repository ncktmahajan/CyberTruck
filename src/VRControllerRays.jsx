import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function VRControllerRays() {
  const { gl, scene } = useThree();

  useEffect(() => {
    if (!gl.xr || !gl.xr.enabled) return;

    try {
      const controller1 = gl.xr.getController(0);
      const controller2 = gl.xr.getController(1);

      // Create ray lines
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -5),
      ]);

      const material = new THREE.LineBasicMaterial({
        color: 0x00dcc8,
        linewidth: 2,
      });

      const line1 = new THREE.Line(geometry, material);
      const line2 = new THREE.Line(geometry, material.clone());

      controller1.add(line1);
      controller2.add(line2);

      // Add controller grips with visual markers
      const grip1 = gl.xr.getControllerGrip(0);
      const grip2 = gl.xr.getControllerGrip(1);

      const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
      const markerMaterial = new THREE.MeshStandardMaterial({
        color: 0x00dcc8,
        emissive: 0x00dcc8,
        emissiveIntensity: 0.8,
      });

      const marker1 = new THREE.Mesh(markerGeometry, markerMaterial);
      const marker2 = new THREE.Mesh(markerGeometry, markerMaterial.clone());

      grip1.add(marker1);
      grip2.add(marker2);

      scene.add(controller1);
      scene.add(controller2);
      scene.add(grip1);
      scene.add(grip2);

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
