import * as THREE from 'three'
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
    videoControls: document.querySelector(".video-controls") as HTMLDivElement,
    selectOption: document.querySelector(".render-style"),
    danmakuPlayer: document.querySelector(".danmaku-player") as HTMLDivElement,
    advDanmakuPlayer: document.querySelector(".adv-danmaku-player") as HTMLCanvasElement,
};
let danmaku: ThreeManager;
loader.parse("./1234.xml").then(function(danmakuDataArray: IDanmakuDataInterface[]) {
    danmaku = new ThreeManager(elements.advDanmakuPlayer, elements.video, danmakuDataArray);
});
elements.playPauseBtn.addEventListener("click", function() {
    if (elements.video.paused === true) {
        elements.video.play();
        // danmaku.loadText();
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

elements.mainBox.addEventListener("mouseover", function() {
    elements.videoControls.style.opacity = "1";
});
elements.mainBox.addEventListener("mouseout", function() {
    elements.videoControls.style.opacity = "0";
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
        this.danmakuArray = this.danmakuDataArray.map(danmaku => new ThreeRender(danmaku, this));
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
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
    }

    loadText(): void{
        for(let i = 0; i < this.danmakuArray.length ; i++){
            let danmaku = this.danmakuArray[i];
            if (!danmaku.renderFlag && this.video.currentTime >= danmaku.danmakuData.playTime) {
                if (!danmaku.isInited) {
                    danmaku.init();
                    this.textFontLoader.load('fonts/Arial_Regular.json', font => {
                        var xMid: number;
                        var shapes = font.generateShapes( danmaku.danmakuData.content.text, 100, 1 );
                        danmaku.geometry = new THREE.ShapeBufferGeometry( shapes );
                        danmaku.geometry.computeBoundingBox();
                        xMid = - 0.5 * ( danmaku.geometry.boundingBox.max.x - danmaku.geometry.boundingBox.min.x );
                        danmaku.geometry.translate( xMid, 0, 0 );
                        danmaku.mesh = new THREE.Mesh( danmaku.geometry, danmaku.material );
                        this.scene.add( danmaku.mesh );
                    })
                    danmaku.isInited = true;
                }
                let opacityRate: number = danmaku.opacitySpeed * (this.timeDiff / 1000);
                danmaku.material.opacity -= opacityRate;
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
                if (danmaku.totalShowTime / 1000 >= danmaku.duration) {
                    danmaku.renderFlag = true;
                    this.scene.remove(danmaku.mesh);
                }
            }
        }
        this.renderer.render(this.scene, this.perspectiveCamera);
    }

    render(): void {
        this.timeDiffCompute();
        // this.danmakuRender();
        this.loadText();
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
        for (let i = 0, len = this.danmakuArray.length; i < len; i++) {
            let danmaku = this.danmakuArray[i] as ThreeRender;
            if (!danmaku.renderFlag && this.video.currentTime >= danmaku.danmakuData.playTime) {
                if (!danmaku.isInited) {
                    danmaku.init();
                    danmaku.isInited = true;
                }
                let opacityRate: number = danmaku.opacitySpeed * (this.timeDiff / 1000);
                danmaku.material.opacity -= opacityRate;
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
                if (danmaku.totalShowTime / 1000 >= danmaku.duration) {
                    danmaku.renderFlag = true;
                    this.scene.remove(danmaku.groupParent);
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
                danmaku.material.opacity -= opacityRate;
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
}

// class ThreeRender{
//     danmakuData: IDanmakuDataInterface;
//     manager: ThreeManager;
//     isInited: boolean = false;                      // 是否初始化
//     width: number = 0;                              // 文字宽度
//     height: number = 0;                             // 文字高度
//     x: number;                                      // x轴位移
//     y: number;                                      // y轴位移
//     renderFlag: boolean = false;                    // 渲染标识
//     canvasWidth: number;                            // 纹理宽度
//     canvasHeight: number;                           // 纹理高度
//     canvas: HTMLCanvasElement = document.createElement("canvas");
//     totalShowTime: number = 0;                      // 显示时间
//     opacitySpeed: number = 0;                       // 透明度变化速度
//     xSpeed: number = 0;                             // x轴位移变化速度
//     ySpeed: number = 0;                             // y轴位移变化速度
//     duration: number;
//     animateTime: number;                            // 运动时间
//     delayTime: number;        
//     texture: THREE.Texture;
//     material: THREE.MeshBasicMaterial;
//     geometry: THREE.PlaneGeometry;
//     mesh: THREE.Mesh;
//     groupParent: THREE.Object3D = new THREE.Object3D();

//     constructor(danmakuData: IDanmakuDataInterface, manager: ThreeManager){
//         this.danmakuData = danmakuData;
//         this.manager = manager;
//         this.duration = this.danmakuData.content.duration;
//         this.animateTime = this.danmakuData.content.aTime / 1000;
//         this.delayTime = this.danmakuData.content.delay / 1000;
//         this.opacitySpeed =
//             (this.danmakuData.content.startOpacity -
//                 this.danmakuData.content.endOpacity) /
//             this.duration;
//         this.xSpeed =
//             (this.danmakuData.content.startX -
//                 this.danmakuData.content.endX) /
//             this.animateTime;
//         this.ySpeed =
//             (this.danmakuData.content.startY -
//                 this.danmakuData.content.endY) /
//             this.animateTime;
//         let preNode = document.createElement("pre");
//         let preCssText = `display: inline-block; text-align: left; font: bold ${this.danmakuData.fontSize}px/1.125 ${
//             this.danmakuData.content.family
//         }, Arial, Helvetica, sans-serif;`;
//         preNode.style.cssText = preCssText;
//         preNode.innerHTML = this.danmakuData.content.text;
//         document.body.appendChild(preNode);
//         this.width = preNode.clientWidth;
//         this.height = preNode.clientHeight;
//         this.canvasWidth = THREE.Math.ceilPowerOfTwo(this.width);
//         this.canvasHeight = THREE.Math.ceilPowerOfTwo(this.height);
//         this.canvas.width = this.canvasWidth;
//         this.canvas.height = this.canvasHeight;
//         document.body.appendChild(this.canvas);
//         let context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
//         context.textAlign = "left";
//         context.textBaseline = "hanging";
//         context.font = `bold ${this.danmakuData.fontSize}px ${
//             this.danmakuData.content.family
//         }`;
//         if (this.danmakuData.color === "#000000") {
//             context.shadowColor = "rgb(68, 68, 68)";
//         } else {
//             context.shadowColor = "rgb(0, 0, 0)";
//         }
//         context.shadowBlur = 2;
//         context.fillStyle = this.danmakuData.color;
//         this.wrapText(context);
//         document.body.removeChild(preNode);
//         document.body.removeChild(this.canvas);
//         this.texture = new THREE.Texture(this.canvas);
//         this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
//         this.geometry = new THREE.PlaneGeometry(this.canvasWidth, this.canvasHeight);
//         this.mesh = new THREE.Mesh(this.geometry, this.material);
//         this.texture.needsUpdate = true;
//     }

//     wrapText(context: CanvasRenderingContext2D): void {
//         let lineText = this.danmakuData.content.text.split("\r");
//         let lineTextArray = [];
//         for (let i = 0, len = lineText.length; i < len; i++) {
//             if (lineText[i]) lineTextArray.push(lineText[i]);
//         }
//         let startX: number = (this.canvasWidth - this.width) / 2;
//         let startY: number = (this.canvasHeight - this.danmakuData.fontSize * lineTextArray.length) / 2;
//         for (let i = 0, len = lineTextArray.length; i < len; i++) {
//             if (lineTextArray[i] === "&amp;") {
//                 lineTextArray[i] = "&";
//             }
//             let patternOne = /\/&gt;/g,
//                 patternTwo = /&lt;/g;
//             if (patternOne.test(lineTextArray[i]) || patternTwo.test(lineTextArray[i])) {
//                 lineTextArray[i] = lineTextArray[i].replace(/\/&gt;/g, "/>").replace(/&lt;/g, "<");
//             }
//             context.fillText(lineTextArray[i], startX, startY, this.width);
//             startY += this.danmakuData.fontSize;
//         }
//     }

//     init() {
//         this.material.opacity = this.danmakuData.content.startOpacity;
//         this.x =
//             -this.manager.renderCanvasWidth / 2 + this.danmakuData.content.startX;
//         this.y =
//             this.manager.renderCanvasHeight / 2 - this.danmakuData.content.startY;
//         this.groupParent.position.set(this.x, this.y, 0);
//         this.groupParent.add(this.mesh);
//         this.mesh.position.set(this.width / 2, -this.height / 2, 0);
//         this.manager.scene.add(this.groupParent);
//         this.groupParent.rotation.reorder("XZY");
//         this.groupParent.rotation.set(
//             0,
//             -THREE.Math.degToRad(this.danmakuData.content.rotateY),
//             -THREE.Math.degToRad(this.danmakuData.content.rotateZ),
//         );
//     }

//     animate(): void {
//         this.groupParent.position.set(this.x, this.y, 0);
//         this.mesh.position.set(this.width / 2, -this.height / 2, 0);
//         this.groupParent.rotation.reorder("XZY");
//         this.groupParent.rotation.set(
//             0,
//             -THREE.Math.degToRad(this.danmakuData.content.rotateY),
//             -THREE.Math.degToRad(this.danmakuData.content.rotateZ),
//         );
//     }
// }

class ThreeRender{
    danmakuData: IDanmakuDataInterface;
    manager: ThreeManager;
    isInited: boolean = false;                      // 是否初始化
    width: number = 0;                              // 文字宽度
    height: number = 0;                             // 文字高度
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
    material: THREE.MeshBasicMaterial;
    geometry: THREE.ShapeBufferGeometry;
    mesh: THREE.Mesh;
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
        let preNode = document.createElement("pre");
        let preCssText = `display: inline-block; text-align: left; font: bold ${this.danmakuData.fontSize}px/1.125 ${
            this.danmakuData.content.family
        }, Arial, Helvetica, sans-serif;`;
        preNode.style.cssText = preCssText;
        preNode.innerHTML = this.danmakuData.content.text;
        document.body.appendChild(preNode);
        this.width = preNode.clientWidth;
        this.height = preNode.clientHeight;
        document.body.removeChild(preNode);
        this.material = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, color: this.danmakuData.color, side: THREE.DoubleSide });
    }

    init() {
        this.material.opacity = this.danmakuData.content.startOpacity;
        this.x =
            -this.manager.renderCanvasWidth / 2 + this.danmakuData.content.startX;
        this.y =
            this.manager.renderCanvasHeight / 2 - this.danmakuData.content.startY;
    }

    animate(): void {
        // this.groupParent.position.set(this.x, this.y, 0);
        // this.mesh.position.set(this.width / 2, -this.height / 2, 0);
        // this.groupParent.rotation.reorder("XZY");
        // this.groupParent.rotation.set(
        //     0,
        //     -THREE.Math.degToRad(this.danmakuData.content.rotateY),
        //     -THREE.Math.degToRad(this.danmakuData.content.rotateZ),
        // );
    }
}

