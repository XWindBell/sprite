import ParticleManager from './particle';
const canvasEle = document.getElementsByClassName('canvas')[0] as HTMLCanvasElement;
let paused = false;
const particleManager = new ParticleManager(canvasEle);
canvasEle.addEventListener('click', function(){
    paused = !paused;
    particleManager.setPaused(paused);
    particleManager.render();
})