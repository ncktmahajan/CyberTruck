import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export default function VRManager({ onGLReady }) {
  const { gl } = useThree();

  useEffect(() => {
    if (gl && onGLReady) {
      onGLReady(gl);
    }
  }, [gl, onGLReady]);

  return null;
}
