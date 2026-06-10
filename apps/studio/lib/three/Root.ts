// @ts-nocheck
import { ACESFilmicToneMapping, Clock,PerspectiveCamera, Scene, Vector2, Vector3 } from "three/webgpu";
import { IAnimatedElement } from "./interfaces/IAnimatedElement";
import { PostProcessing, WebGPURenderer } from "three/webgpu";
import { pass } from "three/tsl"; // r184: `pass` is a TSL function, not a three/webgpu export
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
import { LinkedParticles } from "./LinkedParticles";


export class Root {

    static instance: Root;
    animatedElements: IAnimatedElement[] = [];
    static registerAnimatedElement(element: IAnimatedElement) {
        if (Root.instance == null) {
            throw new Error("Root instance not found");
        }
        if (Root.instance.animatedElements.indexOf(element) == -1) {
            Root.instance.animatedElements.push(element);
        }
    }

    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {

        this.canvas = canvas;

        if (Root.instance != null) {
            console.warn("Root instance already exists");
            return;
        }
        Root.instance = this;
    }

    async init() {

        this.initRenderer();
        this.initCamera();
        this.initPost();
        await this.initScene();


        this.clock.start();
        this.renderer!.setAnimationLoop(this.animate.bind(this));

        return new Promise<void>((resolve) => {
            resolve();
        });
    }

    renderer?: WebGPURenderer;
    clock: Clock = new Clock(false);
    post?: PostProcessing;
    initRenderer() {

        if (WebGPU.isAvailable() === false) { // doesn't work with WebGL2
            throw new Error('No WebGPU support');
        }

        this.renderer = new WebGPURenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        console.log("Renderer :", this.renderer);
        window.addEventListener('resize', this.onResize.bind(this));
    }

    camera: PerspectiveCamera = new PerspectiveCamera(70, 1, .01, 1000);
    autoRotate: boolean = true;
    autoRotateSpeed: number = 2.0; // degrees per second

    initCamera() {
        const aspect: number = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
        this.camera.position.set(0, 3, 10);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();
    }

    postProcessing?: PostProcessing;
    bloomPass;
    initPost() {

        const {scene, camera, renderer} = this;
        const scenePass = pass(scene, camera);
        this.postProcessing = new PostProcessing( renderer!);
        this.postProcessing.outputNode = scenePass;

    }

    scene: Scene = new Scene();
    fx:LinkedParticles;
    async initScene() {
        this.fx = new LinkedParticles(this.scene, this.camera, this.renderer!, this.postProcessing);
        await this.fx.init();
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer!.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer!.setSize(width, height);
        this.renderer!.domElement.style.width = `${width}px`;
        this.renderer!.domElement.style.height = `${height}px`;
    }

    elapsedFrames = 0;
    animate() {
        const dt: number = this.clock.getDelta();
        const elapsed: number = this.clock.getElapsedTime();

        // Auto-rotate camera
        if (this.autoRotate) {
            const radius = Math.sqrt(
                this.camera.position.x * this.camera.position.x +
                this.camera.position.z * this.camera.position.z
            );
            const angle = this.autoRotateSpeed * dt * (Math.PI / 180); // convert to radians
            const currentAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
            const newAngle = currentAngle + angle;

            this.camera.position.x = radius * Math.cos(newAngle);
            this.camera.position.z = radius * Math.sin(newAngle);
            this.camera.lookAt(0, 0, 0);
        }

        this.animatedElements.forEach((element) => {
            element.update(dt, elapsed);
        });
        this.postProcessing!.render();

        this.elapsedFrames++;
    }

}
