import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function VRTeleport() {
  const { gl, camera, scene } = useThree();
  const teleportMarkerRef = useRef();
  const arcLineRef = useRef();
  const playerPositionRef = useRef(new THREE.Vector3(0, 0, 5));

  useEffect(() => {
    if (!gl.xr || !gl.xr.enabled) return;

    const controller1 = gl.xr.getController(0);
    const controller2 = gl.xr.getController(1);

    const onSelectStart = (event) => {
      const controller = event.target;
      const tempMatrix = new THREE.Matrix4();
      tempMatrix.identity().extractRotation(controller.matrixWorld);

      const raycaster = new THREE.Raycaster();
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      // Check intersection with ground
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, intersectPoint);

      if (intersectPoint && teleportMarkerRef.current) {
        teleportMarkerRef.current.position.copy(intersectPoint);
        teleportMarkerRef.current.visible = true;
        
        // Create arc line
        if (arcLineRef.current) {
          const points = [];
          const start = raycaster.ray.origin;
          const end = intersectPoint;
          const segments = 20;
          
          for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3();
            point.lerpVectors(start, end, t);
            point.y += Math.sin(t * Math.PI) * 0.5; // Arc height
            points.push(point);
          }
          
          arcLineRef.current.geometry.setFromPoints(points);
          arcLineRef.current.visible = true;
        }
      }
    };

    const onSelectEnd = (event) => {
      if (teleportMarkerRef.current && teleportMarkerRef.current.visible) {
        // Haptic feedback
        const gamepad = event.target.gamepad;
        if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators[0]) {
          gamepad.hapticActuators[0].pulse(0.8, 150);
        }
        
        // Teleport player
        const newPos = teleportMarkerRef.current.position.clone();
        newPos.y = 1.6; // Eye level
        playerPositionRef.current.copy(newPos);
        
        // Update camera base reference space
        const offsetPosition = { x: -newPos.x, y: -newPos.y, z: -newPos.z, w: 1 };
        const offsetRotation = { x: 0, y: 0, z: 0, w: 1 };
        const transform = new XRRigidTransform(offsetPosition, offsetRotation);
        const session = gl.xr.getSession();
        
        if (session) {
          session.requestReferenceSpace('local').then((refSpace) => {
            gl.xr.setReferenceSpace(refSpace.getOffsetReferenceSpace(transform));
          });
        }

        teleportMarkerRef.current.visible = false;
        if (arcLineRef.current) arcLineRef.current.visible = false;
      }
    };

    controller1.addEventListener("selectstart", onSelectStart);
    controller1.addEventListener("selectend", onSelectEnd);
    controller2.addEventListener("selectstart", onSelectStart);
    controller2.addEventListener("selectend", onSelectEnd);

    return () => {
      controller1.removeEventListener("selectstart", onSelectStart);
      controller1.removeEventListener("selectend", onSelectEnd);
      controller2.removeEventListener("selectstart", onSelectStart);
      controller2.removeEventListener("selectend", onSelectEnd);
    };
  }, [gl, scene]);

  return (
    <>
      {/* Teleport marker */}
      <mesh
        ref={teleportMarkerRef}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.7} />
      </mesh>
      
      {/* Arc line */}
      <line ref={arcLineRef} visible={false}>
        <bufferGeometry />
        <lineBasicMaterial color="#00dcc8" linewidth={2} />
      </line>
    </>
  );
}
