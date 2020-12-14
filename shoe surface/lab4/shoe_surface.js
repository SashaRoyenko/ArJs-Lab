window.onload = function () {
    init();
    animate();
}

let shoeSurfaceMesh, trackballControl;
let onRenderFcts = [];
let lastTimeMsec = null


function init() {
    render = new THREE.WebGLRenderer({alpha: 1, antialias: true, clearColor: 0xffffff});
    render.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(render.domElement);
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight);
    camera.position.set(0, 0, 0);
    scene.add(camera);

    shoeSurfaceMesh = getShoeSurfaceMesh(false, true);
    shoeSurfaceMesh.scale.set(0.2, 0.2, 0.2);

    initAr();

    scene.add(markerRoot)
    scene.add(smoothedRoot)

    scene.add(shoeSurfaceMesh);

    smoothedRoot.add(shoeSurfaceMesh);
}

function shoeSurface(u, v, vector) {
    vector.x = u;
    vector.y = v;
    vector.z = Math.pow(u, 3) / 3 - Math.pow(v, 2) / 2;
    vector.multiplyScalar(4)
}

function shoeSurfaceWithInterval(u, v, vector) {
    // u and v goes from 0 to 1 in order to change it we do like in random
    min = -2
    max = 1
    u = u * (max - min + 1) + min
    v = v * (max - min + 1) + min
    vector.x = u;
    vector.y = v;
    vector.z = Math.pow(u, 3) / 3 - Math.pow(v, 2) / 2;
    return vector;
}

function animate(nowMsec) {
    requestAnimationFrame(animate);
    rotateMesh(shoeSurfaceMesh);
    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
    var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
    lastTimeMsec = nowMsec;
    onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000)
    })
}

function getMaterial(isWireframe) {
    return new THREE.MeshNormalMaterial({side: 2, wireframe: isWireframe})
}

function getMesh(geometry, material) {
    return new THREE.Mesh(geometry, material)
}

function rotateMesh(mesh) {
    mesh.rotation.y += 0.002;
    mesh.rotation.x += 0.006;
}

function getShoeSurfaceMesh(isWireframe, isWithInterval) {
    geometry = new THREE.ParametricGeometry(isWithInterval ? shoeSurfaceWithInterval : shoeSurface, 20, 20);
    material = getMaterial(isWireframe)
    return getMesh(geometry, material);
}

function resize() {
    arToolkitSource.onResizeElement()
    arToolkitSource.copyElementSizeTo(render.domElement)
    if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
    }
}

function initAr() {
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
    })

    arToolkitSource.init(function onReady() {
        resize()
    })

    window.addEventListener('resize', function () {
        resize();
    })

    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'camera.dat',
        detectionMode: 'mono',
        maxDetectionRate: 30,
        canvasWidth: 80 * 3,
        canvasHeight: 60 * 3,
    })

    arToolkitContext.init(function onCompleted() {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    })

    onRenderFcts.push(function () {
        if (arToolkitSource.ready === false) return

        arToolkitContext.update(arToolkitSource.domElement)
    })

    markerRoot = new THREE.Group

    artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: 'pattern',
        patternUrl: 'pattern.patt'
    })

    smoothedRoot = new THREE.Group()

    var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
        lerpPosition: 0.4,
        lerpQuaternion: 0.3,
        lerpScale: 1,
    })

    onRenderFcts.push(function () {
        smoothedControls.update(markerRoot)
    })


    stats = new Stats();

    onRenderFcts.push(function () {
        render.render(scene, camera);
        stats.update();
    })
}