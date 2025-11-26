import { useThree, useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function CameraRig({ seat, controls }) {
  const { camera, gl } = useThree();

  const seatPositions = {
    driver: new THREE.Vector3(0.5, 1.5, 0.4),
    passenger: new THREE.Vector3(-0.5, 1.5, 0.4),
    rear_left: new THREE.Vector3(0.6, 1.5, -0.2),
    rear_right: new THREE.Vector3(-0.6, 1.5, -0.2),
    default: new THREE.Vector3(3, 1.5, 5),
  };

  const yaw = useRef(0);
  const pitch = useRef(0);
  const PITCH_LIMIT = Math.PI / 4;
  const prevTouch = useRef({ x: 0, y: 0 });

  // Reset yaw/pitch when exiting car
  useEffect(() => {
    if (!seat) {
      yaw.current = 0;
      pitch.current = 0;
    }
  }, [seat]);

  // Mouse / Touch Look
  useEffect(() => {
    if (!seat) return;

    function onMove(e) {
      if (!seat) return;

      let dx = 0;
      let dy = 0;

      if (e.movementX !== undefined) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (e.touches) {
        const t = e.touches[0];
        dx = t.clientX - prevTouch.current.x;
        dy = t.clientY - prevTouch.current.y;

        prevTouch.current = { x: t.clientX, y: t.clientY };
      }

      yaw.current -= dx * 0.002;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - dy * 0.002,
        -PITCH_LIMIT,
        PITCH_LIMIT
      );
    }

    function onTouchStart(e) {
      if (e.touches.length)
        prevTouch.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
    }

    function onTouchEnd() {
      prevTouch.current = { x: 0, y: 0 };
    }

    gl.domElement.addEventListener("mousemove", onMove);
    gl.domElement.addEventListener("touchstart", onTouchStart);
    gl.domElement.addEventListener("touchmove", onMove);
    gl.domElement.addEventListener("touchend", onTouchEnd);

    return () => {
      gl.domElement.removeEventListener("mousemove", onMove);
      gl.domElement.removeEventListener("touchstart", onTouchStart);
      gl.domElement.removeEventListener("touchmove", onMove);
      gl.domElement.removeEventListener("touchend", onTouchEnd);
    };
  }, [seat]);

  // Animate camera
  useFrame(() => {
    if (!controls.current) return;

    if (!seat) {
      controls.current.enabled = true;
      return;
    }

    controls.current.enabled = false;

    const target = seatPositions[seat];
    camera.position.lerp(target, 0.08);

    const dir = new THREE.Vector3(
      Math.sin(yaw.current) * Math.cos(pitch.current),
      Math.sin(pitch.current),
      Math.cos(yaw.current) * Math.cos(pitch.current)
    );

    camera.lookAt(camera.position.clone().add(dir));
    camera.fov = 70;
    camera.updateProjectionMatrix();
  });

  return null;
}
