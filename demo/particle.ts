import * as THREE from 'three';
interface IParticleData {
    x: number;
    y: number;
    style: string;
    color: string;
    opacity: number;
}
class ParticleManager{
    renderCanvas: HTMLCanvasElement;
    renderCanvasWidth: number;
    renderCanvasHeight: number;
    perspectiveCamera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    particleData: ParticleData;
    particleOfLeft = [];
    particleOfRight = [];
    prevTime: number;
    timeDiff: number = 0;
    paused: boolean;
    constructor(renderCanvas: HTMLCanvasElement){
        this.renderCanvas = renderCanvas;
        this.renderCanvasWidth = this.renderCanvas.parentElement.clientWidth;
        this.renderCanvasHeight = this.renderCanvas.parentElement.clientHeight;
        this.renderCanvas.width = this.renderCanvasWidth;
        this.renderCanvas.height = this.renderCanvasHeight;
        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            canvas: this.renderCanvas,
            alpha: true
        });
        this.renderer.setSize(this.renderCanvasWidth, this.renderCanvasHeight);
        this.renderCanvas.parentNode.appendChild(this.renderer.domElement);
        this.scene = new THREE.Scene();
        this.perspectiveCamera = new THREE.PerspectiveCamera(
            90,
            this.renderCanvasWidth / this.renderCanvasHeight,
            1,
            3000,
        );
        this.perspectiveCamera.position.z = Math.min(this.renderCanvasWidth, this.renderCanvasHeight) / 2;
        this.particleData = new ParticleData();
        this.staticCanvas();
        const particleDataOfLeft = this.particleData.leftImgDataList;
        const particleDataOfRight = this.particleData.rightImgDataList;
        for(let i = particleDataOfLeft.length-1; i > -1; i--){
            this.particleOfLeft[i] = [];
            for(let j = 0; j < particleDataOfLeft[i].length; j++){
                this.particleOfLeft[i].push(new Particle(this, particleDataOfLeft[i][j], i * 30 + j * Math.random()*6 + 400));
            }
        }
        for(let i = 0; i < particleDataOfRight.length; i++){
            this.particleOfRight[i] = [];
            for(let j = 0; j < particleDataOfRight[i].length; j++){
                this.particleOfRight[i].push(new Particle(this, particleDataOfRight[i][j], i * 20 + j * Math.random()*6));
            }
        }
        this.renderer.render(this.scene, this.perspectiveCamera);
    }

    staticCanvas(): void {
        const width = this.particleData.width;
        const height = this.particleData.height;
        const texture = new THREE.Texture(this.particleData.canvas);
        texture.needsUpdate = true;
        const planeGeometry = new THREE.PlaneBufferGeometry(width, height);
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        })
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        planeMaterial.opacity = 0.07;
        this.scene.add(plane);
    }

    timeDiffCompute(): void {
        let currentTime: number;
        if (this.prevTime) {
            currentTime = performance.now();
            this.timeDiff = currentTime - this.prevTime;
            this.prevTime = currentTime;
        } else {
            this.prevTime = performance.now();
        }
    }

    render() {
        this.timeDiffCompute();
        this.particleRender(this.particleOfRight);
        this.particleRender(this.particleOfLeft)
        if(this.paused) {
            requestAnimationFrame(this.render.bind(this));
        }
        this.renderer.render(this.scene, this.perspectiveCamera);
    }

    setPaused(paused: boolean) {
        this.paused = paused;
    }

    animate(particle: Particle) {
        particle.showTime += this.timeDiff;
        if(particle.showTime >= particle.delay && particle.showTime <= particle.delay + particle.duration) {
            const opacityRate = particle.sOpacity * this.timeDiff;
            particle.particleMaterial.opacity -= opacityRate;
            particle.particle.position.x += Math.random() * this.timeDiff / 4;
            particle.particle.position.y = Math.random() < 0.5 ? particle.particle.position.y - Math.random() * this.timeDiff / 6 : particle.particle.position.y + Math.random() * this.timeDiff / 6;
        } else if(particle.showTime > particle.delay + particle.duration){
            this.scene.remove(particle.particle);
            particle.particleGeometry.dispose();
            particle.particleMaterial.dispose();
        }
    }

    particleRender(particleBinaryList) {
        for(let i = 0; i < particleBinaryList.length; i++) {
            const particleList = particleBinaryList[i] as Particle[];
            particleList.map(particle => this.animate(particle));
        }
    }
}

class ParticleData {
    img: HTMLImageElement;
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    leftImgDataList = [];
    rightImgDataList = [];
    constructor() {
        this.img = document.getElementsByTagName('img')[0];
        this.width = this.img.width;
        this.height = this.img.height;
        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'test';
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        const ctx = this.canvas.getContext('2d');
        ctx.drawImage(this.img, 0, 0, this.width, this.height);
        const imgData = ctx.getImageData(0, 0, this.width, this.height);
        this.calculate(this.width, this.height, imgData);
        ctx.clearRect(0, 0, this.width, this.height);
        for(let i = 0; i < this.rightImgDataList.length; i++) {
            for(let j = 0; j < this.rightImgDataList[i].length; j++){
                let particle = this.rightImgDataList[i][j];
                ctx.fillStyle = particle.style;
                ctx.fillRect(particle.x, particle.y, 1, 1);
            } 
        } 
        for(let i = 0; i < this.leftImgDataList.length; i++) {
            for(let j = 0; j < this.leftImgDataList[i].length; j++){
                let particle = this.leftImgDataList[i][j];
                ctx.fillStyle = particle.style;
                ctx.fillRect(particle.x, particle.y, 1, 1);
            }
        }
    }

    calculate(w: number, h: number, imgData: ImageData) {
        let left_index = 0;
        let right_index = 0;
		const cols = w, rows = h;
		var pos = 0;
		var data = imgData.data;
		for(var i = cols / 2 - 1; i >= 0; i--) {
            this.leftImgDataList[left_index] = [];
			for(var j = 0; j < rows; j++) {
				pos = (j*w + i)*4;
				if(data[pos+3] > 0){
					let particle: IParticleData;
                    let style = `rgba(${data[pos]}, ${data[pos+1]}, ${data[pos+2]}, ${data[pos+3]/255})`;
                    let color = `rgb(${data[pos]}, ${data[pos+1]}, ${data[pos+2]})`;
                    let opacity = data[pos+3]/255;
                    particle = {
                        x: i,
                        y: j,
                        style: style,
                        color: color,
                        opacity: opacity
                    }
					this.leftImgDataList[left_index].push(particle);
				}
            }
            left_index++;
        }
        this.leftImgDataList = this.leftImgDataList.filter(item => item.length > 0);
        for(var i = cols - 1; i >= cols / 2; i--) {
            this.rightImgDataList[right_index] = [];
			for(var j = 0; j < rows; j++) {
				pos = (j*w + i)*4;
				if(data[pos+3] > 0){
					let particle: IParticleData;
					let style = `rgba(${data[pos]}, ${data[pos+1]}, ${data[pos+2]}, ${data[pos+3]/255})`;
                    let color = `rgb(${data[pos]}, ${data[pos+1]}, ${data[pos+2]})`;
                    let opacity = data[pos+3]/255;
                    particle = {
                        x: i,
                        y: j,
                        style: style,
                        color: color,
                        opacity: opacity
                    }
					this.rightImgDataList[right_index].push(particle);
				}
            }
            right_index++;
        }
        this.rightImgDataList = this.rightImgDataList.filter(item => item.length > 0);
	}
}

class Particle {
    duration: number = 2000;
    sOpacity: number;
    particleManager: ParticleManager;
    particleData: IParticleData;
    particleGeometry: THREE.BufferGeometry;
    particleMaterial: THREE.PointsMaterial;
    particle: THREE.Points;
    showTime: number = 0;
    delay: number;
    constructor(particleManager: ParticleManager, particleData: IParticleData, delay: number) {
        this.particleManager = particleManager;
        this.particleData = particleData;
        this.delay = delay;
        this.particleGeometry = new THREE.BufferGeometry();
        const positionData = new Float32Array([particleData.x-64, -particleData.y+64, 0]);
        this.particleGeometry.addAttribute('position', new THREE.BufferAttribute(positionData, 3));
        this.particleMaterial = new THREE.PointsMaterial({
            color: particleData.color,
            transparent: true,
        })
        this.particle = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.particleManager.scene.add(this.particle);
        this.sOpacity = this.particleData.opacity / this.duration;
    }
}
export default ParticleManager;