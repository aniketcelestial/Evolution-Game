import * as BABYLON from '@babylonjs/core';

export function createAntModel(scene: BABYLON.Scene, size = 1, name = 'ant-model') {
    const root = new BABYLON.TransformNode(name, scene);

    const head = BABYLON.MeshBuilder.CreateSphere(name + '-head', { diameter: 0.35 * size, segments: 16 }, scene);
    const thorax = BABYLON.MeshBuilder.CreateSphere(name + '-thorax', { diameter: 0.28 * size, segments: 16 }, scene);
    const abdomen = BABYLON.MeshBuilder.CreateSphere(name + '-abdomen', { diameter: 0.42 * size, segments: 16 }, scene);

    head.parent = root;
    thorax.parent = root;
    abdomen.parent = root;

    head.position.set(0.18 * size, 0, 0);
    thorax.position.set(0, 0, 0);
    abdomen.position.set(-0.28 * size, 0, 0);

    // legs: 3 per side
    for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 3; i++) {
            const leg = BABYLON.MeshBuilder.CreateCylinder(`${name}-leg-${side}-${i}`, { diameter: 0.04 * size, height: 0.42 * size, tessellation: 6 }, scene);
            leg.parent = root;
            const offsetZ = (i - 1) * 0.12 * size;
            leg.position.set(0.02 * size, -0.06 * size, offsetZ);
            leg.rotation.z = Math.PI / 2 * side * 0.7;
            leg.rotation.x = 0.6 * (side);
        }
    }

    // antennae
    for (let a = -1; a <= 1; a += 2) {
        const ant = BABYLON.MeshBuilder.CreateCylinder(`${name}-ant-${a}`, { diameter: 0.03 * size, height: 0.28 * size, tessellation: 6 }, scene);
        ant.parent = root;
        ant.position.set(0.36 * size, 0.12 * size, 0.05 * a * size);
        ant.rotation.z = -0.9 * a;
        ant.rotation.x = 0.35;
    }

    const mat = new BABYLON.StandardMaterial(name + '-mat', scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString('#6b3b1a');
    mat.specularColor = BABYLON.Color3.FromHexString('#111111');
    [head, thorax, abdomen].forEach(m => (m.material = mat));

    return root;
}

export function createBeeModel(scene: BABYLON.Scene, size = 1, name = 'bee-model') {
    const root = new BABYLON.TransformNode(name, scene);

    const head = BABYLON.MeshBuilder.CreateSphere(name + '-head', { diameter: 0.32 * size, segments: 12 }, scene);
    const thorax = BABYLON.MeshBuilder.CreateSphere(name + '-thorax', { diameter: 0.38 * size, segments: 12 }, scene);
    const abdomen = BABYLON.MeshBuilder.CreateSphere(name + '-abdomen', { diameter: 0.46 * size, segments: 12 }, scene);
    head.parent = root; thorax.parent = root; abdomen.parent = root;
    head.position.set(0.18 * size, 0, 0);
    thorax.position.set(0, 0, 0);
    abdomen.position.set(-0.28 * size, 0, 0);

    // stripes on abdomen: create two thin rings via scaled torus
    const stripe1 = BABYLON.MeshBuilder.CreateTorus(name + '-stripe1', { diameter: 0.32 * size, thickness: 0.07 * size, tessellation: 12 }, scene);
    const stripe2 = BABYLON.MeshBuilder.CreateTorus(name + '-stripe2', { diameter: 0.22 * size, thickness: 0.06 * size, tessellation: 12 }, scene);
    stripe1.parent = root; stripe2.parent = root;
    stripe1.position.copyFrom(abdomen.position); stripe2.position.copyFrom(abdomen.position);

    // wings
    const wingL = BABYLON.MeshBuilder.CreatePlane(name + '-wingL', { width: 0.42 * size, height: 0.18 * size }, scene);
    const wingR = wingL.clone(name + '-wingR');
    wingL.parent = root; wingR.parent = root;
    wingL.position.set(0.06 * size, 0.12 * size, -0.12 * size);
    wingR.position.set(0.06 * size, 0.12 * size, 0.12 * size);
    wingL.rotation.x = -0.6; wingR.rotation.x = -0.6;

    const bodyMat = new BABYLON.StandardMaterial(name + '-mat', scene);
    bodyMat.diffuseColor = BABYLON.Color3.FromHexString('#ffd24d');
    bodyMat.specularColor = BABYLON.Color3.FromHexString('#222222');
    abdomen.material = bodyMat; thorax.material = bodyMat; head.material = bodyMat;

    const blackMat = new BABYLON.StandardMaterial(name + '-mat-black', scene);
    blackMat.diffuseColor = BABYLON.Color3.Black();
    stripe1.material = blackMat; stripe2.material = blackMat;

    const wingMat = new BABYLON.StandardMaterial(name + '-wingMat', scene);
    wingMat.alpha = 0.55; wingMat.diffuseColor = BABYLON.Color3.FromHexString('#eaf6ff');
    wingL.material = wingMat; wingR.material = wingMat;

    return root;
}

export function createSnakeModel(scene: BABYLON.Scene, length = 6, size = 1, name = 'snake-model') {
    // build a simple smooth tube approximating a snake body
    const path: BABYLON.Vector3[] = [];
    for (let i = 0; i < length; i++) {
        path.push(new BABYLON.Vector3(i * 0.28 * size, 0, Math.sin(i * 0.8) * 0.08 * size));
    }

    const tube = BABYLON.MeshBuilder.CreateTube(name + '-tube', { path, radius: 0.14 * size, tessellation: 16, updatable: false }, scene);
    const head = BABYLON.MeshBuilder.CreateSphere(name + '-head', { diameter: 0.28 * size, segments: 12 }, scene);
    head.position.copyFrom(path[path.length - 1].add(new BABYLON.Vector3(0.12 * size, 0, 0)));
    const mat = new BABYLON.StandardMaterial(name + '-mat', scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString('#8b2b2b');
    tube.material = mat; head.material = mat;

    const root = new BABYLON.TransformNode(name, scene);
    tube.parent = root; head.parent = root;
    return root;
}

export function createSlitherTube(scene: BABYLON.Scene, path: BABYLON.Vector3[], size = 1, name = 'slither-tube', instance?: BABYLON.Mesh) {
    // Create a tapered tube along given path. Caller should supply a short, sampled path.
    const options: any = {
        path,
        radius: 0.18 * size,
        tessellation: 20,
        radiusFunction: (i: number) => {
            const t = i / Math.max(1, path.length - 1);
            return 0.18 * size * (1 - 0.5 * t);
        },
        updatable: !!instance,
    };
    if (instance) options.instance = instance;

    const tube = BABYLON.MeshBuilder.CreateTube(name, options, scene) as BABYLON.Mesh;

    if (!tube.material) {
        const mat = new BABYLON.StandardMaterial(name + '-mat', scene);
        mat.diffuseColor = BABYLON.Color3.FromHexString('#00c86b');
        mat.specularPower = 8;
        tube.material = mat;
    }
    return tube;
}

// Try to load a glTF/.glb model if available. Returns the root node on success, or null on failure.
export async function tryLoadGLTF(scene: BABYLON.Scene, url: string, nameHint = 'model') : Promise<BABYLON.TransformNode | null> {
    try {
        // Use a dynamic variable import so bundlers won't statically require the module.
        const loaderName = '@babylonjs/loaders';
        await import(loaderName);
        const parts = url.split('/');
        const file = parts.pop() || url;
        const rootUrl = parts.length ? parts.join('/') + '/' : '';
        const result = await BABYLON.SceneLoader.ImportMeshAsync('', rootUrl, file, scene);
        const root = new BABYLON.TransformNode(nameHint + '-gltf-root', scene);
        result.meshes.forEach(m => (m.parent = root));
        return root;
    } catch (e) {
        return null;
    }
}
