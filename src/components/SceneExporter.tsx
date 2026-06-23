import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export function SceneExporter({ setViewMode, setShowRoof }: { setViewMode: (mode: '3d' | 'top') => void, setShowRoof: (show: boolean) => void }) {
  const { scene, gl, camera } = useThree();

  useEffect(() => {
    const handleExportGLB = () => {
      const exportGroup = scene.getObjectByName('export-group');
      if (!exportGroup) {
        console.error('Export group not found');
        return;
      }

      // Temporarily hide objects with unsupported textures (e.g., Troika Text SDF textures)
      const hiddenObjects: any[] = [];
      exportGroup.traverse((child: any) => {
        if (child.isMesh) {
          let hasInvalidTexture = false;
          
          // Check for Troika Text
          if (child.textRenderInfo || (child.material && child.material.uniforms && child.material.uniforms.troika_sdfTexture)) {
            hasInvalidTexture = true;
          }

          // Check all textures in material
          if (!hasInvalidTexture && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            for (const mat of materials) {
              Object.values(mat).forEach((value: any) => {
                if (value && value.isTexture && value.image) {
                  const img = value.image;
                  const isValid = img instanceof HTMLImageElement || 
                                  img instanceof HTMLCanvasElement || 
                                  img instanceof ImageBitmap || 
                                  (typeof OffscreenCanvas !== 'undefined' && img instanceof OffscreenCanvas);
                  if (!isValid) {
                    hasInvalidTexture = true;
                  }
                }
              });
            }
          }

          if (hasInvalidTexture && child.visible) {
            child.visible = false;
            hiddenObjects.push(child);
          }
        }
      });
      
      const exporter = new GLTFExporter();
      exporter.parse(
        exportGroup,
        (gltf) => {
          // Restore visibility
          hiddenObjects.forEach(obj => obj.visible = true);

          const blob = new Blob([gltf as ArrayBuffer], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.style.display = 'none';
          link.href = url;
          link.download = 'maquete.glb';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        (error) => {
          // Restore visibility
          hiddenObjects.forEach(obj => obj.visible = true);
          console.error('An error happened during GLTF export:', error);
        },
        { binary: true }
      );
    };

    const handleExportPNG = () => {
      // 1. Set to Top View & Hide Roof
      setViewMode('top');
      setShowRoof(false);

      // 2. Wait for next frame to ensure changes are rendered
      setTimeout(() => {
        // 3. Temporarily increase resolution for high-res screenshot
        const originalPixelRatio = gl.getPixelRatio();
        gl.setPixelRatio(3); // High res (3x)
        gl.render(scene, camera);

        // 4. Capture
        const dataURL = gl.domElement.toDataURL('image/png', 1.0);

        // 5. Revert resolution
        gl.setPixelRatio(originalPixelRatio);

        // 6. Download
        const link = document.createElement('a');
        link.download = 'planta-baixa-alta-resolucao.png';
        link.href = dataURL;
        link.click();
      }, 500); // Give it a moment to transition camera and hide roof
    };

    window.addEventListener('export-glb', handleExportGLB);
    window.addEventListener('export-png', handleExportPNG);

    return () => {
      window.removeEventListener('export-glb', handleExportGLB);
      window.removeEventListener('export-png', handleExportPNG);
    };
  }, [scene, gl, camera, setViewMode, setShowRoof]);

  return null;
}
