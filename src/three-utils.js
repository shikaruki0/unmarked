/**
 * Three.js resource helpers shared by the browser runtime and node tests.
 *
 * Why this exists:
 * When a match restarts we remove many meshes from the scene. Simply calling
 * group.remove(...) detaches them from the scene graph, but the GPU memory
 * behind their geometries, materials, and textures is not freed automatically.
 * Over several restarts that memory (and any lights attached directly to the
 * scene) would accumulate and cause the known "match-restart leak".
 */

/**
 * Recursively dispose every GPU resource owned by an object and its children,
 * then detach all of its children.
 *
 * Safe to call on Groups, Meshes, Lights, Sprites, or any Object3D. It does not
 * remove the root itself from its parent (the caller decides that), but it
 * leaves the root with no children and no GPU-owned resources attached.
 *
 * @param {import('three').Object3D} root
 * @returns {{ disposedGeometries: number, disposedMaterials: number, disposedTextures: number, removedChildren: number }}
 */
export function disposeObjectTree(root) {
  const stats = { disposedGeometries: 0, disposedMaterials: 0, disposedTextures: 0, removedChildren: 0 };
  if (!root) return stats;

  // A Set guards against the same geometry/material/texture being shared by
  // several meshes (e.g. the floor/wall materials) so we never double-dispose.
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) {
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) {
        if (material) materials.add(material);
      }
    }
  });

  for (const material of materials) {
    // Every texture slot on a material must be disposed, not just material.map.
    for (const value of Object.values(material)) {
      if (value && value.isTexture) textures.add(value);
    }
    if (typeof material.dispose === 'function') material.dispose();
    stats.disposedMaterials += 1;
  }

  for (const texture of textures) {
    if (typeof texture.dispose === 'function') texture.dispose();
    stats.disposedTextures += 1;
  }

  for (const geometry of geometries) {
    if (typeof geometry.dispose === 'function') geometry.dispose();
    stats.disposedGeometries += 1;
  }

  while (root.children.length) {
    root.remove(root.children[0]);
    stats.removedChildren += 1;
  }

  return stats;
}
