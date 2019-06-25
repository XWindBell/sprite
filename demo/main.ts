import * as THREE from 'three'
import { Sphere } from 'three';
interface IMode7DanmakuContentInterface {
    startX: number;
    startY: number;
    startOpacity: number;
    endOpacity: number;
    duration: number;
    text: string;
    rotateZ: number;
    rotateY: number;
    endX: number;
    endY: number;
    aTime: number;
    delay: number;
    stroked?: string;
    linearSpeedup?: boolean;
    family: string;
}
interface IDanmakuDataInterface {
    playTime: number;
    mode?: number;
    fontSize: number;
    color: string;
    sendTime?: number;
    dmPool?: number;
    userHash?: string;
    dmId?: number;
    content: IMode7DanmakuContentInterface;
}
let loader = {
    parse(xmlFile: string) {
        return new Promise(function(resolve) {
            let danmakuDataArray = [];
            let xmlHttp = new window["XMLHttpRequest"]();
            xmlHttp.open("GET", xmlFile, true);
            xmlHttp.send();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState === XMLHttpRequest.DONE && xmlHttp.status === 200) {
                    let xmlDom;
                    if (xmlHttp.responseXML) {
                        xmlDom = xmlHttp.responseXML;
                    } else {
                        let xml = xmlHttp.responseText;
                        let xmlStr = xml.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, "");
                        xmlDom = new DOMParser().parseFromString(xmlStr, "text/html");
                    }
                    let item = xmlDom.getElementsByTagName("i")[0];
                    let d = item.getElementsByTagName("d");
                    for (let i = 0; i < d.length; i++) {
                        let attributes = d[i].getAttribute("p");
                        let attributeArray = attributes.split(",");
                        let mode = parseInt(attributeArray[1], 10);
                        if (mode === 7) {
                            let content = d[i].innerHTML.replace(/^\s+|\s+$/g, "");
                            let contentPattern = /^\[(.*?)\]$/g;
                            if (contentPattern.test(content)) {
                                let contentArray = JSON.parse(content);
                                let seopacityArray = contentArray[2].split("-").map(function(value) {
                                    return parseFloat(value);
                                });
                                let mode7Content = {
                                    startX: parseFloat(contentArray[0]),
                                    startY: parseFloat(contentArray[1]),
                                    startOpacity: seopacityArray[0],
                                    endOpacity: seopacityArray[1],
                                    duration: parseFloat(contentArray[3]),
                                    text: contentArray[4].replace(/(\/n|\\n|\n|\r\n)/g, "\r"),
                                    rotateZ: parseInt(contentArray[5], 10),
                                    rotateY: parseInt(contentArray[6], 10),
                                    endX: parseFloat(contentArray[7]),
                                    endY: parseFloat(contentArray[8]),
                                    aTime: parseInt(contentArray[9], 10),
                                    delay: parseInt(contentArray[10], 10),
                                    family: contentArray[12],
                                };
                                let mode7DanmakuData = {
                                    playTime: parseFloat(attributeArray[0]),
                                    mode: mode,
                                    fontSize: parseInt(attributeArray[2], 10),
                                    color: "#" + ("000000" + parseInt(attributeArray[3], 10).toString(16)).slice(-6),
                                    dmId: parseInt(attributeArray[7], 10),
                                    content: mode7Content,
                                };
                                danmakuDataArray.push(mode7DanmakuData);
                            }
                        }
                    }
                    danmakuDataArray.sort((pre, next) => {
                        return pre.playTime - next.playTime;
                    });
                    resolve(danmakuDataArray);
                }
            };
        });
    },
    assign(...args: any[]): any {
        if (args.length <= 1) return args[0];
        let output = args[0] != null ? Object(args[0]) : {};
        args.forEach((value, index) => {
            if (index === 0) return;
            if (value != null) {
                for (let prop in value) {
                    if (value.hasOwnProperty(prop)) {
                        output[prop] = value[prop];
                    }
                }
            }
        });
        return output;
    }
};
let elements = {
    mainBox: document.querySelector(".main-box"),
    video: document.querySelector(".video") as HTMLVideoElement,
    playPauseBtn: document.querySelector(".play-btn"),
    onOffBtn: document.querySelector(".on-off-btn"),
    durationDiv: document.querySelector(".duration") as HTMLElement,
    currentTimeDiv: document.querySelector(".current-time") as HTMLElement,
    currentDiv: document.querySelector(".current") as HTMLElement,
    prograss: document.querySelector(".prograss"),
    fullScreenBtn: document.querySelector(".full-screen"),
    input: document.querySelector(".input") as HTMLInputElement,
    sendBtn: document.querySelector(".send-btn"),
    selectOption: document.querySelector(".render-style"),
    danmakuPlayer: document.querySelector(".danmaku-player") as HTMLDivElement,
    advDanmakuPlayer: document.querySelector(".adv-danmaku-player") as HTMLCanvasElement,
};
let danmaku: ThreeManager;
loader.parse("./1234.xml").then(function(danmakuDataArray: IDanmakuDataInterface[]) {
    danmaku = new ThreeManager(elements.advDanmakuPlayer, elements.video, danmakuDataArray);
    danmaku.textGeometry();
});
elements.playPauseBtn.addEventListener("click", function() {
    if (elements.video.paused === true) {
        elements.video.play();
        danmaku.render();
        elements.playPauseBtn.classList.add("pause-btn");
        elements.playPauseBtn.classList.remove("play-btn");
    } else {
        elements.video.pause();
        elements.playPauseBtn.classList.remove("pause-btn");
        elements.playPauseBtn.classList.add("play-btn");
    }
});
elements.video.addEventListener("canplay", function() {
    var duration = elements.video.duration;
    let durationShow = [parseInt(((duration / 60) % 60).toString(), 10), parseInt((duration % 60).toString(), 10)]
        .join(":")
        .replace(/\b(\d)\b/g, "0$1");
    elements.durationDiv.innerText = durationShow;
});
elements.video.addEventListener("timeupdate", function() {
    let duration = elements.video.duration;
    let currentTime = elements.video.currentTime;
    let current_text = [parseInt(((currentTime / 60) % 60).toString(), 10), parseInt((currentTime % 60).toString(), 10)]
        .join(":")
        .replace(/\b(\d)\b/g, "0$1");
    let pValue = (currentTime / duration) * 100;
    elements.currentTimeDiv.innerText = current_text;
    elements.currentDiv.style.width = pValue + "%";
});

elements.video.addEventListener("ended", function() {
    elements.playPauseBtn.classList.remove("pause-btn");
    elements.playPauseBtn.classList.add("play-btn");
    elements.currentTimeDiv.innerText = "00:00";
    elements.currentDiv.style.width = '0';
    elements.video.currentTime = 0;
});
elements.prograss.addEventListener("click", function(e) {
    let duration = elements.video.duration;
    let width = this.offsetWidth;
    let event = e || window.event;
    let x = event['offsetX'];
    elements.video.currentTime = (x / width) * duration;
    if (elements.video.paused === true) {
        elements.video.play();
        elements.playPauseBtn.classList.add("pause-btn");
        elements.playPauseBtn.classList.remove("play-btn");
    }
    if (danmaku.isShow) {
        danmaku.reset();
        danmaku.render();
    }
});
elements.fullScreenBtn.addEventListener("click", function() {
    if (document.fullscreen === false) {
        elements.mainBox.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

class ThreeManager{
    renderCanvas: HTMLCanvasElement;
    video: HTMLVideoElement;
    danmakuDataArray: IDanmakuDataInterface[];
    renderCanvasWidth: number;
    renderCanvasHeight: number;
    perspectiveCamera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    danmakuArray: ThreeRender[];
    prevTime: number;
    timeDiff: number = 0;
    isShow: boolean = true;
    textFontLoader: THREE.FontLoader = new THREE.FontLoader();

    constructor(renderCanvas: HTMLCanvasElement, video: HTMLVideoElement, danmakuDataArray: IDanmakuDataInterface[]){
        this.renderCanvas = renderCanvas;
        this.video = video;
        this.danmakuDataArray = danmakuDataArray;
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
        this.danmakuArray = this.danmakuDataArray.map(danmaku => new ThreeRender(danmaku, this));
    }

    render(): void {
        this.timeDiffCompute();
        this.danmakuRender();
        if (!this.video.paused) {
            requestAnimationFrame(this.render.bind(this));
        } else {
            this.prevTime = 0;
            this.timeDiff = 0;
        }
        // @ts-ignore
        rendererStats.update(this.renderer);
    }

    timeDiffCompute(): void {
        let currentTime;
        if (this.prevTime) {
            currentTime = performance.now();
            this.timeDiff = currentTime - this.prevTime;
            this.prevTime = currentTime;
        } else {
            this.prevTime = performance.now();
        }
    }

    danmakuRender(): void {
        for(let i = 0; i < this.danmakuArray.length ; i++){
            let danmaku = this.danmakuArray[i];
            if (!danmaku.renderFlag && this.video.currentTime >= danmaku.danmakuData.playTime) {
                if (!danmaku.isInited) {
                    danmaku.init();
                    danmaku.isInited = true;
                }
                let opacityRate: number = danmaku.opacitySpeed * (this.timeDiff / 1000);
                danmaku.textMaterial.opacity -= opacityRate;
                danmaku.lineMaterial.opacity -= opacityRate;
                danmaku.totalShowTime += this.timeDiff;
                if (
                    danmaku.totalShowTime / 1000 >= danmaku.delayTime &&
                    danmaku.totalShowTime / 1000 <= danmaku.delayTime + danmaku.animateTime
                ) {
                    let xRate: number = danmaku.xSpeed * (this.timeDiff / 1000);
                    let yRate: number = danmaku.ySpeed * (this.timeDiff / 1000);
                    danmaku.x -= xRate;
                    danmaku.y += yRate;
                    danmaku.animate();
                }
                if(danmaku.totalShowTime / 1000 >= danmaku.delayTime + danmaku.animateTime && danmaku.totalShowTime <= danmaku.duration){
                    danmaku.x = - this.renderCanvasWidth / 2 + danmaku.danmakuData.content.endX;
                    danmaku.y = this.renderCanvasHeight / 2 - danmaku.danmakuData.content.endY;
                    danmaku.animate();
                }
                if (danmaku.totalShowTime / 1000 >= danmaku.duration) {
                    danmaku.renderFlag = true;
                    this.scene.remove(danmaku.groupParent);
                    danmaku.textGeometrys.forEach(textGeometry => {
                        textGeometry.dispose()
                    })
                    danmaku.lineGeometrys.forEach(linegeometry => {
                        linegeometry.dispose();
                    })
                }
            }
        }
        this.renderer.render(this.scene, this.perspectiveCamera);
    }

    reset(): void {
        let currentTime = this.video.currentTime;
        while (this.scene.children.length) {
            this.scene.remove(this.scene.children[0]);
        }
        for (let i = 0, len = this.danmakuArray.length; i < len; i++) {
            let danmaku = this.danmakuArray[i] as ThreeRender;
            danmaku.renderFlag = false;
            danmaku.totalShowTime = 0;
            if (currentTime < danmaku.danmakuData.playTime) {
                danmaku.isInited = false;
            } else if (
                currentTime >= danmaku.danmakuData.playTime &&
                currentTime <= danmaku.danmakuData.playTime + danmaku.duration
            ) {
                danmaku.isInited = true;
                danmaku.init();
                let diffTime: number = currentTime - danmaku.danmakuData.playTime;
                let opacityRate: number = danmaku.opacitySpeed * diffTime;
                danmaku.textMaterial.opacity -= opacityRate;
                danmaku.lineMaterial.opacity -= opacityRate;
                danmaku.totalShowTime = diffTime * 1000;
                let animationTime: number;
                if (diffTime - danmaku.delayTime <= danmaku.animateTime) {
                    animationTime = diffTime - danmaku.delayTime;
                } else {
                    animationTime = danmaku.animateTime;
                }
                let xRate: number = danmaku.xSpeed * animationTime;
                let yRate: number = danmaku.ySpeed * animationTime;
                danmaku.x -= xRate;
                danmaku.y += yRate;
                danmaku.animate();
            } else {
                danmaku.renderFlag = true;
                danmaku.totalShowTime = danmaku.duration * 1000;
            }
        }
        this.renderer.render(this.scene, this.perspectiveCamera);
    }

    // textGeometry绘制文字模型
    textGeometry(): void{
        this.textFontLoader.load('fonts/SimHei_Regular.json', font => {
            let defaultOptions = {
                font: font,
                height: 0,
                curveSegments: 12,
                bevelEnabled: false
            };
            for(let i = 0; i < this.danmakuArray.length; i++){
                let danmaku = this.danmakuArray[i];
                let textOption = {
                    size: danmaku.danmakuData.fontSize
                };
                textOption = loader.assign(defaultOptions, textOption);
                let textHeight: number;
                let initY = 0;
                let textGroup = new THREE.Object3D();
                let texts = danmaku.danmakuData.content.text.split('\r');
                for(let i = 0; i < texts.length; i++){
                    if(texts[i]){
                        let textGeometry = new THREE.TextBufferGeometry(texts[i], textOption);
                        textGeometry.computeBoundingBox();
                        textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
                        let textMesh = new THREE.Mesh(textGeometry, danmaku.textMaterial);
                        textMesh.position.set(0, -textHeight - initY, 0);
                        textGroup.add(textMesh);
                        danmaku.textGeometrys.push(textGeometry);
                        danmaku.textMeshs.push(textMesh);
                        initY += textHeight;
                    }
                }
                danmaku.groupParent.add(textGroup);
            }
            console.log('success');
        });
    }

    // shapeGeometry绘制文字模型
    shapeGeometry(): void{
        this.textFontLoader.load('fonts/SimHei_Regular.json', font => {
            let defaultOptions = {
                font: font,
                height: 0,
                curveSegments: 12,
                bevelEnabled: false
            };
            for(let i = 0; i < this.danmakuArray.length; i++){
                let danmaku = this.danmakuArray[i];
                let textOption = {
                    size: danmaku.danmakuData.fontSize
                };
                textOption = loader.assign(defaultOptions, textOption);
                let textHeight: number;
                let texts = danmaku.danmakuData.content.text.split('\r');
                let initY: number = 0;
                let textGroup = new THREE.Object3D();
                for(let i = 0; i < texts.length; i++){
                    if(texts[i]){
                        let shapes = font.generateShapes( texts[i], danmaku.danmakuData.fontSize, 1 );
                        let textGeometry = new THREE.ShapeBufferGeometry( shapes );
                        textGeometry.computeBoundingBox();
                        textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
                        let textMesh = new THREE.Mesh( textGeometry, danmaku.textMaterial );
                        textMesh.position.set(0, -textHeight - initY, 0);
                        textGroup.add(textMesh);
                        danmaku.textGeometrys.push(textGeometry);
                        danmaku.textMeshs.push(textMesh);
                        initY += textHeight;
                    }
                }
                danmaku.groupParent.add(textGroup);
            }
        })
    }
}

class ThreeRender{
    danmakuData: IDanmakuDataInterface;
    manager: ThreeManager;
    isInited: boolean = false;                      // 是否初始化
    x: number;                                      // x轴位移
    y: number;                                      // y轴位移
    renderFlag: boolean = false;                    // 渲染标识
    totalShowTime: number = 0;                      // 显示时间
    opacitySpeed: number = 0;                       // 透明度变化速度
    xSpeed: number = 0;                             // x轴位移变化速度
    ySpeed: number = 0;                             // y轴位移变化速度
    duration: number;
    animateTime: number;                            // 运动时间
    delayTime: number;        
    texture: THREE.Texture;
    textMaterial: THREE.MeshBasicMaterial;
    textGeometrys: THREE.BufferGeometry[] = [];
    textMeshs: THREE.Mesh[] = [];
    lineMaterial: THREE.LineBasicMaterial;
    lineGeometrys: THREE.BufferGeometry[] = [];
    lineMeshs: THREE.Line[] = [];
    groupParent: THREE.Object3D = new THREE.Object3D();

    constructor(danmakuData: IDanmakuDataInterface, manager: ThreeManager){
        this.danmakuData = danmakuData;
        this.manager = manager;
        this.duration = this.danmakuData.content.duration;
        this.animateTime = this.danmakuData.content.aTime / 1000;
        this.delayTime = this.danmakuData.content.delay / 1000;
        this.opacitySpeed =
            (this.danmakuData.content.startOpacity -
                this.danmakuData.content.endOpacity) /
            this.duration;
        this.xSpeed =
            (this.danmakuData.content.startX -
                this.danmakuData.content.endX) /
            this.animateTime;
        this.ySpeed =
            (this.danmakuData.content.startY -
                this.danmakuData.content.endY) /
            this.animateTime;
        this.textMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, color: this.danmakuData.color, side: THREE.DoubleSide });
        let lineColor: string;
        if(this.danmakuData.color === '#000000'){
            lineColor = '#686868';
        }else{
            lineColor = '#000000';
        }
        this.lineMaterial = new THREE.LineBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, color: lineColor, side: THREE.DoubleSide });
    }

    init() {
        this.textMaterial.opacity = this.danmakuData.content.startOpacity;
        this.lineMaterial.opacity = this.danmakuData.content.startOpacity;
        this.x =
            -this.manager.renderCanvasWidth / 2 + this.danmakuData.content.startX;
        this.y =
            this.manager.renderCanvasHeight / 2 - this.danmakuData.content.startY;
        this.groupParent.position.set(this.x, this.y, 0);
        this.manager.scene.add(this.groupParent);
        this.groupParent.rotation.reorder("XZY");
        this.groupParent.rotation.set(
            0,
            -THREE.Math.degToRad(this.danmakuData.content.rotateY),
            -THREE.Math.degToRad(this.danmakuData.content.rotateZ),
        );
    }

    animate(): void {
        this.groupParent.position.set(this.x, this.y, 0);
        this.groupParent.rotation.reorder("XZY");
        this.groupParent.rotation.set(
            0,
            -THREE.Math.degToRad(this.danmakuData.content.rotateY),
            -THREE.Math.degToRad(this.danmakuData.content.rotateZ),
        );
    }
}

