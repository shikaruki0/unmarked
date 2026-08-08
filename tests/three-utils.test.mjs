import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { disposeObjectTree } from '../src/three-utils.js';

function makeMatchScene() {
  // Mirrors the structure main.js builds per match: a group containing several
  // meshes, nested groups, lights, and sprites with canvas textures.
  const matchGroup = new THREE.Group();
  const fxGroup = new THREE.Group();

  for (let i = 0; i < 3; i += 1) {
    const generator = new THREE.Group();
    generator.add(new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1, 1, 10),
      new THREE.MeshStandardMaterial({ color: 0x273a36 }),
    ));
    const light = new THREE.PointLight(0xfc4c50, 0.58, 5.5, 2);
    light.position.set(0, 1.4, 0);
    generator.add(light);
    matchGroup.add(generator);
  }

  for (let i = 0; i < 7; i += 1) {
    const bot = new THREE.Group();
    bot.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.3), new THREE.MeshStandardMaterial({ color: 0x506763 })));
    bot.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), new THREE.MeshStandardMaterial({ color: 0xb98269 })));
    matchGroup.add(bot);
  }

  const pickup = new THREE.Group();
  pickup.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.6),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(document.createElement('canvas')) }),
  ));
  pickup.add(new THREE.PointLight(0xf7bd4e, 0.5, 2.8, 2));
  matchGroup.add(pickup);

  for (let i = 0; i < 4; i += 1) {
    const pulse = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.18, 18),
      new THREE.MeshBasicMaterial({ color: 0x7fffc8, transparent: true, opacity: 0.5 }),
    );
    fxGroup.add(pulse);
  }

  return { matchGroup, fxGroup };
}

// node:test has no DOM by default. Provide just enough canvas surface for the
// CanvasTexture used in the pickup material so the helper's texture path runs.
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText() {} }), width: 0, height: 0 }) };
}

test('disposeObjectTree detaches children and disposes geometries, materials, and textures', () => {
  const { matchGroup, fxGroup } = makeMatchScene();
  const totalMeshes = 3 * 1 + 7 * 2 + 1 + 4; // generators + bots + pickup + pulses

  const matchStats = disposeObjectTree(matchGroup);
  const fxStats = disposeObjectTree(fxGroup);

  assert.equal(matchGroup.children.length, 0, 'match group is emptied');
  assert.equal(fxGroup.children.length, 0, 'fx group is emptied');
  assert.ok(matchStats.disposedGeometries > 0, 'match geometries are disposed');
  assert.ok(matchStats.disposedMaterials > 0, 'match materials are disposed');
  assert.ok(matchStats.disposedTextures >= 1, 'pickup canvas texture is disposed');
  assert.equal(fxStats.disposedGeometries, 4, 'four pulse rings are disposed');
  // Every mesh created should have its geometry disposed exactly once.
  assert.equal(matchStats.disposedGeometries + fxStats.disposedGeometries, totalMeshes);
});

test('disposeObjectTree removes match-created lights attached inside groups', () => {
  // Regression for the original bug: generator PointLights were added directly
  // to the scene and never removed, so 3 lights leaked per restart. With them
  // parented to the generator group, disposing the group must remove them too.
  const { matchGroup } = makeMatchScene();
  const lightsBefore = [];
  matchGroup.traverse((obj) => { if (obj.isPointLight) lightsBefore.push(obj); });
  assert.equal(lightsBefore.length, 4, 'three generator lights plus one pickup aura exist');

  disposeObjectTree(matchGroup);

  const lightsAfter = [];
  matchGroup.traverse((obj) => { if (obj.isPointLight) lightsAfter.push(obj); });
  assert.equal(lightsAfter.length, 0, 'no match lights remain attached after disposal');
});

test('simulating repeated match restarts does not accumulate lights or children', () => {
  // This is the closest pure-logic reproduction of the reported leak: rebuild
  // and clear the match groups N times exactly as startMatch/clearMatch do, and
  // assert that nothing accumulates on the persistent "scene".
  const scene = new THREE.Scene();
  const staticGroup = new THREE.Group();
  scene.add(staticGroup);
  // A static facility light must survive clearMatch (it is not match-owned).
  staticGroup.add(new THREE.PointLight(0x3ba87d, 1.25, 10));

  const restartCount = 6;
  for (let i = 0; i < restartCount; i += 1) {
    const matchGroup = new THREE.Group();
    const fxGroup = new THREE.Group();
    scene.add(matchGroup, fxGroup);
    const built = makeMatchScene();
    built.matchGroup.children.forEach((child) => matchGroup.add(child));
    built.fxGroup.children.forEach((child) => fxGroup.add(child));

    // Simulate clearMatch(): dispose and detach, then remove the groups.
    disposeObjectTree(matchGroup);
    disposeObjectTree(fxGroup);
    scene.remove(matchGroup, fxGroup);
  }

  const pointLights = [];
  scene.traverse((obj) => { if (obj.isPointLight) pointLights.push(obj); });
  assert.equal(pointLights.length, 1, 'only the static facility light remains after repeated restarts');
  // Static geometry must be untouched: only the one static light + its parent.
  assert.equal(scene.children.length, 1, 'no match groups remain on the scene');
  assert.equal(staticGroup.children.length, 1, 'static content was not disposed by match cleanup');
});

test('disposeObjectTree tolerates empty groups and nullish input', () => {
  assert.deepEqual(disposeObjectTree(new THREE.Group()), { disposedGeometries: 0, disposedMaterials: 0, disposedTextures: 0, removedChildren: 0 });
  assert.deepEqual(disposeObjectTree(null), { disposedGeometries: 0, disposedMaterials: 0, disposedTextures: 0, removedChildren: 0 });
});
