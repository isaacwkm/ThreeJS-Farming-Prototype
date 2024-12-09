
// Renderer.js
import * as THREE from "three";

class Renderer {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoverCallback = null;
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.domElement = this.renderer.domElement
        document.body.appendChild(this.domElement);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

        this.camera = new THREE.PerspectiveCamera(
            60, // FOV
            window.innerWidth / window.innerHeight,
            0.1, // Near clipping
            1000 // Far clipping
        );

        this.scene.add(this.camera);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);

        this.domElement.addEventListener("mousemove", (event) => {
            const rect = this.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Trigger hover checking
            this.checkHover();
        });
    }

    bindResizeEvent() {
        window.addEventListener("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    addToScene(object) {
        this.scene.add(object);
    }

    removeFromScene(object) {
        this.scene.remove(object);
    }

    setCameraPosition(x, y, z) {
        this.camera.position.set(x, y, z);
    }

    lookAt(x, y, z) {
        this.camera.lookAt(x, y, z);
    }

    onClick(callback) {
        this.renderer.domElement.addEventListener("click", (event) => {
            // Translate mouse coordinates into normalized device coordinates
            const rect = this.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1,
            );
            // Set raycaster from these coordinates
            this.raycaster.setFromCamera(mouse, this.camera);

            // Check for intersections
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);
            if (intersects.length > 0) {
                const intersect = intersects[0];
                callback(intersect); // Pass the intersection data to the callback
            }
        });
    }

    onHover(callback) {
        this.hoverCallback = callback;
    }

    checkHover() {
        if (!this.hoverCallback) return;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersect = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersect.length > 0 ) {
            this.hoverCallback(intersect[0]);
        }
    }


}

export default Renderer;
