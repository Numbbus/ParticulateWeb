import Matrix from './matrix.js' ;
import { Database } from './database.js';

import { 
    Sand, Dirt, Stone, Water, Ash, Bedrock, Obsidian, Ice, Wood, Tnt, Steam, Fire, Smoke,
    SandSpawner, DirtSpawner, AshSpawner, WaterSpawner, SteamSpawner, FireSpawner,
    VoidBlock, VoidSolidsBlock, VoidLiquidsBlock, VoidGassesBlock,
} from "./particles/particles.js";

import * as particles from "./particles/particles.js";

import { Button } from "https://cdn.jsdelivr.net/npm/@pixi/ui@2.3.2/+esm";

const { Application, EventSystem, Text, Container, Graphics, Point  } = PIXI;

import "https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js"

import { registerAll, get } from './registry.js';

let maxWidth = 1500;
let maxHeight = 500;

let mouseDown = false;
let mouseX = 0;
let mouseY = 0;

let previouseMouseX = null;
let previouseMouseY = null;

let brushSize = 1;

let selectedParticle = Sand;

let selectedCategory = "solidsMenu";

let mouseOver = false;

let paused = false;
let override = false;

let tileSize = undefined;

const database = new Database();

let saveName = null;
let username = null;

registerAll(particles);



(async () => {
    console.log( navigator.userAgent );
    const margin = 30;

    const app = new Application();
    await app.init({
        view: document.querySelector("#pixi"),
        width: Math.min(window.innerWidth - margin * 2, maxWidth),
        height: Math.min(window.innerHeight - margin * 2, maxHeight)
    });

    const hammer = new Hammer.Manager(app.view);
    const pinch = new Hammer.Pinch();
    hammer.add(pinch);

    let initialBrushSize = brushSize;
    let pinching = false;

    hammer.on('pinchstart', (ev) => {
        initialBrushSize = brushSize;
        pinching = true;
    });

    hammer.on('pinchend', (ev) => {
        pinching = false;
    })

    hammer.on('pinchmove', (ev) => {
        // ev.scale is relative to pinchstart
        let newBrushSize =  Math.floor(initialBrushSize * ev.scale);
        brushSize = newBrushSize != 0 ? newBrushSize : 1;
        topBarText.brushSizeText.text = `Brush Size: ${brushSize}`;
    });

    const containers = {
        playArea: new Container(),
        ui: new Container(),
        savesMenu: new Container(),
        loadMenu: new Container(),
    };


    addToStage(containers.playArea, containers.ui, containers.savesMenu, containers.loadMenu);

    // set background color and size of container
    console.log(app.screen.width, app.screen.height);

    containers.savesMenu.addChild(new Graphics().rect(-5, -5, 510, 410).fill(0xffffff));
    containers.savesMenu.addChild(new Graphics().rect(0, 0, 500, 400).fill(0x000000));

    containers.loadMenu.addChild(new Graphics().rect(-5, -5, 510, 410).fill(0xffffff));
    containers.loadMenu.addChild(new Graphics().rect(0, 0, 500, 400).fill(0x000000));

    containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0x555555));

    let titleText = new Text('Save Or Publish', {
            fontFamily: 'Arial',
            fontSize: 40,
            fill: 0xffffff,
        });

    titleText.position.x = (containers.savesMenu.width / 2) - titleText.width / 2;
    titleText.position.y = 20

    containers.savesMenu.addChild(titleText);

    let saveNameText = new Text('Save Name', {
            fontFamily: 'Arial',
            fontSize: 30,
            fill: 0xffffff,
        });

    saveNameText.position.x = (containers.savesMenu.width / 2) - saveNameText.width / 2;
    saveNameText.position.y = 110

    containers.savesMenu.addChild(saveNameText);

    let usernameText = new Text('Username', {
            fontFamily: 'Arial',
            fontSize: 30,
            fill: 0xffffff,
        });

    usernameText.position.x = (containers.savesMenu.width / 2) - usernameText.width / 2;
    usernameText.position.y = 210

    containers.savesMenu.addChild(usernameText);

    defineSavesMenu();

    defineLoadMenu();

    // Hide cursor when over play area
    containers.playArea.cursor = 'none';
    containers.playArea.interactive = true; // Make sure it's interactive
    containers.playArea.on("pointerover", () => {
        containers.playArea.cursor = 'none';
    });

    containers.playArea.on("pointerout", () => {
        containers.playArea.cursor = 'none'; // stays none over play area
    });

    let matrix = new Matrix(app, containers)

    tileSize = matrix.getTileSize();

    app.ticker.add(gameLoop);

    function gameLoop(){

        if( !paused ){
            matrix.updateGrid();
        }
        if(mouseDown && !pinching){
            if(brushSize == 1){
                matrix.traverseMatrixAndCreate(previouseMouseX, previouseMouseY, mouseX, mouseY, selectedParticle, override);
            }else{
                const coords = matrix.traverseMatrix(previouseMouseX, previouseMouseY, mouseX, mouseY);
                matrix.fillBrushArea(selectedParticle, brushSize, coords, override);
            }
        }
    }

    let outline = new Graphics().rect(0,0, tileSize, tileSize).stroke({ width: 1, color: 0xff0000 });
    outline.pivot.set(0, 0);
    containers.ui.addChild(outline);

    createNewMenu();

    // Mouse and keyboard inputs
    app.renderer.events = new EventSystem(app.renderer);
    containers.playArea.eventMode = "static";
    containers.playArea.hitArea = app.screen;

    containers.playArea.on("pointerover", (event) => {
        mouseOver = true;
    });

    containers.playArea.on("pointerout", (event) => {
        mouseOver = false;
    });

    containers.playArea.on("pointerdown", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;

        mouseX = Math.trunc(event.global.x / matrix.getTileSize()) - Math.floor(brushSize / 2);
        mouseY = Math.trunc(event.global.y / matrix.getTileSize()) - Math.floor(brushSize / 2);

        document.getElementById('mouseCoordsDiv').innerText = `X: ${mouseX} Y: ${mouseY}`;

        mouseDown = true;
    
    });

    containers.playArea.on("pointermove", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;

        mouseX = Math.trunc(event.global.x / matrix.getTileSize()) - Math.floor(brushSize / 2);
        mouseY = Math.trunc(event.global.y / matrix.getTileSize()) -  Math.floor(brushSize / 2);

        document.getElementById('mouseCoordsDiv').innerText = `X: ${mouseX} Y: ${mouseY}`;

        outline.clear();
        outline.rect(mouseX * tileSize, mouseY * tileSize, tileSize*brushSize, tileSize*brushSize).stroke({ width: 1, color: 0xff0000 }); 

        let hovered = matrix.withinBounds(mouseX, mouseY) ? matrix.getParticle(mouseX, mouseY) : null;

        document.getElementById('hoveredParticleDiv').innerText = `Hovered: ${hovered == null || hovered == undefined ? 'None' : hovered.constructor.name }`;
    });

    containers.playArea.on("pointerup", (event) => {
        mouseDown = false;
    });

    containers.playArea.on('wheel', (event) => {
        if(event.deltaY < 0){
            brushSize++;
        }else if(event.deltaY > 0 ){
            brushSize = brushSize > 1 ? brushSize-1 : 1; 
        }

        document.getElementById('brushSizeDiv').innerText = `Brush Size: ${brushSize}`;

        outline.clear();
        outline.rect(mouseX * tileSize, mouseY * tileSize, tileSize*brushSize, tileSize*brushSize).stroke({ width: 1, color: 0xff0000 });
        outline.pivot.set(0, 0);
        containers.ui.addChild(outline);
    });
    
    window.addEventListener('keydown', (event) => {
        if(mouseOver){
            //console.log(event.key); 
            if(event.key == ' '){ paused = !paused; topBarText.pausedText.visible = paused; }
            else if(event.key == 'r'){ resetMatrix(); }
            else if(event.key == 'ArrowRight' && paused){ matrix.updateGrid(); }
            //else if(event.key == 's'){ savePlayArea(); }
        }
        
    });

    function addToStage(){
        for(let i = 0; i < arguments.length; i++){
            let child = arguments[i];
            if(child && child.emit){
                app.stage.addChild(arguments[i]);
            }
            else{
                console.error('Invalid Child: ', child);
            }
            
        }
    }

    // Add a listener to the ticker to update the FPS display
    let updateFps = true;
    app.ticker.add(() => {
        if(updateFps){
            document.getElementById('fpsDiv').innerText = `FPS: ${app.ticker.FPS.toFixed(0)}`;
            updateFps = false;
        }else{
            updateFps = true;
        }
        
    });

    function resetMatrix(){
        containers.playArea.removeChildren().forEach(child => child.destroy({ children: true }));
        containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0x555555));
        matrix = new Matrix(app, containers); 
    }

    function updateCatagories(){
        const particlesContainer = document.getElementById('particlesContainer');

        let selectedCatagory = document.querySelector(`.selectedCategoryButton`);
        if(selectedCatagory){
            selectedCatagory.classList.remove('selectedCategoryButton');
        }

        const selectedMenu = selectedCategory;

        const categoryButtons = document.querySelectorAll('.categoryButton');
        for (const btn of categoryButtons) {
            if (btn.onclick && btn.onclick.toString().includes(`"${selectedCategory}"`)) {
            btn.classList.add('selectedCategoryButton');
            break;
            }
        }

        for( const child of particlesContainer.children){
            child.style.display = child.dataset.menu === selectedMenu ? 'block' : 'none';
        }
    }

    const dropArea = document.querySelector("#pixi");

    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();

        const file = e.dataTransfer.files[0];

        if(!file){return;}

        const reader = new FileReader();
        reader.readAsText(file);

        reader.onload = function(event) {
            matrix.resetMatrix();
            const text = event.target.result;

            const lines = text.split('\n');

            lines.forEach(line => {
                let data = line.split(',');

                if(matrix.withinBounds(data[1], data[2])){
                    matrix.createParticle(Number(data[1]), Number(data[2]), get(data[0]), false);
                } 
            });

        }
    })

    const elem = document.getElementById('pixi');
 
    elem.addEventListener('mouseover', () => {
        document.body.style.overflow = 'hidden';
    });

    elem.addEventListener('mouseout', () => {
        document.body.style.overflow = ''; 
    });

    function saveAndDownloadPlayArea(){
        let text = '';

        for(let r=0; r < matrix.getRows(); r++){
            for(let c = 0; c < matrix.getCols(); c++){
                let p = matrix.getParticle(c, r);
                if(p != null){
                    text += `${p.constructor.name},${p.getX()},${p.getY()}\n`;
                }
            }
        }

        const blob = new Blob([text], {type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${saveName}-${username}-save.txt`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    async function downloadAndApplyPlayArea(id){
        matrix.resetMatrix();
        const doc = await database.readDocById('ParticulateSaves', id);
        
        const text = doc.save;

        const lines = text.split('\n');

        lines.forEach(line => {
            let data = line.split(',');

            if(matrix.withinBounds(data[1], data[2])){
                matrix.createParticle(Number(data[1]), Number(data[2]), get(data[0]), false);
            } 
        });

        updateVisibilityOfLoadMenu();
    }

    function saveAndPublishPlayArea(){
        let text = '';

        for(let r=0; r < matrix.getRows(); r++){
            for(let c = 0; c < matrix.getCols(); c++){
                let p = matrix.getParticle(c, r);
                if(p != null){
                    text += `${p.constructor.name},${p.getX()},${p.getY()}\n`;
                }
            }
        }

        database.createDoc('ParticulateSaves', 'name', saveName, 'username', username, 'save', text);
    }

    function defineSavesMenu() {
        const savesMenu = containers.savesMenu;

        // Center container
        savesMenu.x = app.screen.width / 2;
        savesMenu.y = app.screen.height / 3;
        savesMenu.pivot.x = savesMenu.width / 2;
        savesMenu.pivot.y = savesMenu.height / 2;
        savesMenu.interactive = true;
        savesMenu.cursor = 'auto';

        // Create input
        const saveNameInput = document.createElement("input");
        saveNameInput.id = "saveNameInput";
        saveNameInput.type = "text";
        saveNameInput.style.position = "absolute";
        saveNameInput.style.zIndex = 10;
        document.body.appendChild(saveNameInput);

        const usernameInput = document.createElement("input");
        usernameInput.id = "usernameInput";
        usernameInput.type = "text";
        usernameInput.style.position = "absolute";
        usernameInput.style.zIndex = 10;
        document.body.appendChild(usernameInput);


        const bounds = savesMenu.getBounds();
        const canvasRect = app.view.getBoundingClientRect();

        saveNameInput.style.left = (saveNameInput.offsetWidth / 4) + canvasRect.left + bounds.x + "px";
        saveNameInput.style.top = 150 + canvasRect.top + bounds.y + "px";
        saveNameInput.style.width = "300px";
        saveNameInput.style.height = "50px";

        usernameInput.style.left =  (usernameInput.offsetWidth / 4) + canvasRect.left + bounds.x + "px";
        usernameInput.style.top = 250 + canvasRect.top + bounds.y + "px";
        usernameInput.style.width = "300px";
        usernameInput.style.height = "50px";

        /*
        // Define buttons
        let xButton = createButton('X', {bg: 0xff0000, w: 20, h: 20, toggleable: false});
        xButton.view.on('pointerdown', (e) =>{ updateVisibilityOfSaveMenu(); paused = false; });
        xButton.view.position.set(0, 0);
        savesMenu.addChild(xButton.view);

        let saveAndDownloadBtn = createButton('Save And Download', {bg: 0xff0000, w: 200, h: 30, toggleable: false});
        saveAndDownloadBtn.view.on('pointerdown', (e) =>{ saveAndDownloadPlayArea(); updateVisibilityOfSaveMenu(); });
        saveAndDownloadBtn.view.position.set(20, savesMenu.height - saveAndDownloadBtn.view.height * 2);
        savesMenu.addChild(saveAndDownloadBtn.view);

        let saveAndPublishBtn = createButton('Save And Publish', {bg: 0xff0000, w: 200, h: 30, toggleable: false});
        saveAndPublishBtn.view.on('pointerdown', (e) =>{ saveAndPublishPlayArea(); updateVisibilityOfSaveMenu(); });
        saveAndPublishBtn.view.position.set(280, savesMenu.height - saveAndPublishBtn.view.height * 2);
        savesMenu.addChild(saveAndPublishBtn.view);*/

        updateVisibilityOfSaveMenu();

    }

    function updateVisibilityOfSaveMenu(){
        let savesMenu = containers.savesMenu;

        savesMenu.visible = !(savesMenu.visible);
        titleText.visible = !(titleText.visible);
        saveNameText.visible = !(saveNameText.visible);
        usernameText.visible = !(usernameText.visible);

        document.getElementById('saveNameInput').hidden = !(document.getElementById('saveNameInput').hidden);
        document.getElementById('usernameInput').hidden = !(document.getElementById('usernameInput').hidden);
    }

    async function defineLoadMenu(){
        
        let loadMenu = containers.loadMenu;
        const bounds = loadMenu.getBounds();
        const canvasRect = app.view.getBoundingClientRect();

        /*
        let xButton = createButton('X', {bg: 0xff0000, w: 20, h: 20, toggleable: false});
        xButton.view.on('pointerdown', (e) =>{ updateVisibilityOfLoadMenu(); paused = false; });
        xButton.view.position.set(0, 0);
        loadMenu.addChild(xButton.view);*/

        // Center container
        loadMenu.x = app.screen.width / 2;
        loadMenu.y = app.screen.height / 3;
        loadMenu.pivot.x = loadMenu.width / 2;
        loadMenu.pivot.y = loadMenu.height / 2;
        loadMenu.interactive = true;
        loadMenu.cursor = 'auto';

        const globalPos = loadMenu.toGlobal(new Point(0, 0));

        // Search Bar
        const searchBar = document.createElement("input");
        searchBar.id = "searchBar";
        searchBar.type = "text";
        searchBar.style.position = "absolute";
        searchBar.style.zIndex = 10;
        document.body.appendChild(searchBar);

        searchBar.style.left = canvasRect.left + globalPos.x + (searchBar.offsetWidth / 4) + "px";
        searchBar.style.top = canvasRect.top + globalPos.y + (searchBar.offsetHeight / 4) + "px";

        searchBar.style.width = "300px";
        searchBar.style.height = "50px";

        

        const parentDiv = document.createElement("div");
        parentDiv.id = 'parentDiv';

        parentDiv.classList.add('scrollable-div');
        parentDiv.style.position = "absolute";
        parentDiv.style.zIndex = 10;

        parentDiv.style.width = bounds.width + "px";
        parentDiv.style.height = bounds.height - 90 +"px";

        parentDiv.style.left = canvasRect.left + globalPos.x + "px";
        parentDiv.style.top = canvasRect.top + globalPos.y + 80 + "px";

        parentDiv.innerHTML = "<div class='text-center mt-5'> Loading... </div>"

        const allSaves = await database.readAllDocs('ParticulateSaves');

        parentDiv.innerHTML = '';
        
        allSaves.forEach( save => {
            parentDiv.innerHTML += 
            `<div class="row fs-5"> 
                <div class='col-lg-6 ps-5'> 
                    <p class="p-2"> ${save.name} by: ${save.username} </p> 
                </div> 
                <div class="col-lg-6 ps-5"> 
                    <button class="btn btn-dark mt-1" onclick = 'downloadAndApplyPlayArea("${save.id}")'> Download </button> 
                </div> 
                <hr />
            </div>`;
        })

        document.body.appendChild(parentDiv);

        updateVisibilityOfLoadMenu();
    }

    function updateVisibilityOfLoadMenu(){
        
        let loadMenu = containers.loadMenu;
        let parentDiv = document.getElementById('parentDiv');
        let searchBar = document.getElementById('searchBar');

        loadMenu.visible = !(loadMenu.visible);

        parentDiv.hidden = !(parentDiv.hidden);
        searchBar.hidden = !(searchBar.hidden);
    }
    
    async function updateLoadMenu(){
        parentDiv.innerHTML = "<div class='text-center mt-5'> Loading </div>"

        const allSaves = await database.readAllDocs('ParticulateSaves');

        parentDiv.innerHTML = '';
        
        allSaves.forEach( save => {
            parentDiv.innerHTML += 
            `<div class="row fs-5"> 
                <div class='col-lg-6 ps-5'> 
                    <p class="p-2"> ${save.name} by: ${save.username} </p> 
                </div> 
                <div class="col-lg-6 ps-5"> 
                    <button class="btn btn-dark mt-1" onclick = 'downloadAndApplyPlayArea("${save.id}")'> Download </button> 
                </div> 
                <hr />
            </div>`;
        })

        updateVisibilityOfLoadMenu();
    }

    document.getElementById('saveNameInput').addEventListener('input', (event) => {
        saveName = event.target.value;
    });

    document.getElementById('usernameInput').addEventListener('input', (event) => {
        username = event.target.value;
    });

    document.getElementById('searchBar').addEventListener('input', async (event) => {
        parentDiv.innerHTML = "<div class='text-center mt-5'> Loading </div>"

        const allSaves = await database.findAllWith('ParticulateSaves', 'name', event.target.value);

        parentDiv.innerHTML = '';
        
        allSaves.forEach( save => {
            parentDiv.innerHTML += 
            `<div class="row fs-5"> 
                <div class='col-lg-6 ps-5'> 
                    <p class="p-2"> ${save.name} by: ${save.username} </p> 
                </div> 
                <div class="col-lg-6 ps-5"> 
                    <button class="btn btn-dark mt-1" onclick = 'downloadAndApplyPlayArea("${save.id}")'> Download </button> 
                </div> 
                <hr />
            </div>`;
        })
    });

    window.downloadAndApplyPlayArea = function(id) {
        console.log(id);
        downloadAndApplyPlayArea(id);
    };

    window.addEventListener('resize', () => {
        //console.log(`Width: ${window.innerWidth}, Height: ${window.innerHeight}`);
        createNewMenu();
    });

    function createNewMenu(){
        const canvasRect = app.view.getBoundingClientRect();

        let menuDiv = document.getElementById('menuDiv');

        if(!menuDiv){
            menuDiv = document.createElement("div");
            menuDiv.id = 'menuDiv';
            menuDiv.classList.add('menuBorder');
            menuDiv.style.position = "absolute";
            menuDiv.style.zIndex = 10;
            document.getElementById('menuContainer').appendChild(menuDiv);
            
        }

        menuDiv.style.width = app.screen.width + 8 + "px";
        menuDiv.style.left = canvasRect.left + "px";
        menuDiv.style.top = (canvasRect.top + app.screen.height) + 8 + "px";
        menuDiv.style.backgroundColor = "rgb(0,0,0)";

        const statsConfig = {
            fpsDiv: { id: 'fpsDiv', label: 'FPS', classes: [], initialText: () => `FPS: ${app.ticker.FPS.toFixed(0)}` },
            mouseCoordsDiv: { id: 'mouseCoordsDiv', label: 'Coords', classes: [], initialText: 'x: 000 y: 000' },
            brushSizeDiv: { id: 'brushSizeDiv', label: 'Brush', classes: [], initialText: 'Brush Size: 1' },
            selectedParticleDiv: { id: 'selectedParticleDiv', label: 'Selected', classes: [], initialText: 'Selected: Sand', noWrap: true },
            hoveredParticleDiv: { id: 'hoveredParticleDiv', label: 'Hovered', classes: [], initialText: 'Hovered: None', noWrap: true },
        };

        const controlsConfig = {
            pause: { text: 'Pause', class: 'controlsButton', bg: '#000', classes: ['controlsButton'], onclick: () => { paused = !paused; } },
            reset: { text: 'Reset', class: 'controlsButton', bg: '#000', classes: ['controlsButton'], onclick: () => { resetMatrix(); } },
            override: { text: 'Override', class: 'controlsButton', bg: '#000', classes: ['controlsButton'], txtColor: '#FFFFFF', onclick: () => { override = !override; } },
        };

        const toolsConfig = {
            eraser: { text: 'Eraser', class: 'toolsButton', bg: '#FF5CFA', classes: ['toolsButton'], onclick: () => { selectedParticle = null; } },
            save: { text: 'Save', class: 'toolsButton', bg: '#00FF00', classes: ['toolsButton'], onclick: () => { updateVisibilityOfSaveMenu(); paused = true; } },
            load: { text: 'Load', class: 'toolsButton', bg: '#00FFFF', classes: ['toolsButton'], onclick: () => { updateVisibilityOfLoadMenu(); paused = true; } },
        };

        const catagoriesConfig = {
            solids: { text: 'Solids', class: 'categoryButton', classes: ['categoryButton', 'selectedCategoryButton'], onclick: () => { selectedCategory = "solidsMenu"; updateCatagories(); } },
            liquids: { text: 'Liquids', class: 'categoryButton', txtColor: '#FFFFFF', classes: ['categoryButton'], onclick: () => { selectedCategory = "liquidsMenu"; updateCatagories(); } },
            gases: { text: 'Gases', class: 'categoryButton', classes: ['categoryButton'], onclick: () => { selectedCategory = "gasesMenu"; updateCatagories(); } },
            spawners: { text: 'Spawners', class: 'categoryButton', txtColor: '#FFFFFF', classes: ['categoryButton'], onclick: () => { selectedCategory = "spawnersMenu"; updateCatagories(); } },
            voids: { text: 'Void Blocks', class: 'categoryButton', txtColor: '#FFFFFF', classes: ['categoryButton'], onclick: () => { selectedCategory = "voidsMenu"; updateCatagories(); } },
            misc: { text: 'Misc', class: 'categoryButton', classes: ['categoryButton'], onclick: () => { selectedCategory = "miscMenu"; updateCatagories(); } },
        };

        const allParticleButtons = {
            solidsMenu: {
                sand: { text: 'Sand', class: 'particleButton', bg: '#DBD49D', classes: ['particleButton'], onclick: () => { selectedParticle = Sand; } },
                dirt: { text: 'Dirt', class: 'particleButton', bg: '#964B00', classes: ['particleButton'], onclick: () => { selectedParticle = Dirt; } },
                stone: { text: 'Stone', class: 'particleButton', bg: '#808080', classes: ['particleButton'], onclick: () => { selectedParticle = Stone; } },
                ash: { text: 'Ash', class: 'particleButton', bg: '#C8C8C8', classes: ['particleButton'], onclick: () => { selectedParticle = Ash; } },
                bedrock: { text: 'Bedrock', class: 'particleButton', bg: '#3A3A3A', txtColor: '#FFFFFF', classes: ['particleButton'], onclick: () => { selectedParticle = Bedrock; } },
                obsidian: { text: 'Obsidian', class: 'particleButton', bg: '#181818', txtColor: '#FFFFFF', classes: ['particleButton'], onclick: () => { selectedParticle = Obsidian; } },
                ice: { text: 'Ice', class: 'particleButton', bg: '#B4FFFF', classes: ['particleButton'], onclick: () => { selectedParticle = Ice; } },
                wood: { text: 'Wood', class: 'particleButton', bg: '#914815', txtColor: '#FFFFFF', classes: ['particleButton'], onclick: () => { selectedParticle = Wood; } },
                tnt: { text: 'TNT', class: 'particleButton', bg: '#FF1E1E', txtColor: '#FFFFFF', classes: ['particleButton'], onclick: () => { selectedParticle = Tnt; } },
            },
            liquidsMenu: {
                water: { text: 'Water', class: 'particleButton', bg: '#045AFF', classes: ['particleButton'], onclick: () => { selectedParticle = Water; } },
            },
            gasesMenu: {
                steam: { text: 'Steam', class: 'particleButton', bg: '#FFFFFF', classes: ['particleButton'], onclick: () => { selectedParticle = Steam; } },
                fire: { text: 'Fire', class: 'particleButton', bg: '#FF4500', classes: ['particleButton'], onclick: () => { selectedParticle = Fire; } },
                smoke: { text: 'Smoke', class: 'particleButton', bg: '#A9A9A9', classes: ['particleButton'], onclick: () => { selectedParticle = Smoke; } },
            },
            spawnersMenu: {
                sandSpawner: { text: 'Sand Spawner', class: 'particleButton', bg: '#D2B48C', classes: ['particleButton'], onclick: () => { selectedParticle = SandSpawner; } },
                dirtSpawner: { text: 'Dirt Spawner', class: 'particleButton', bg: '#8B4513', classes: ['particleButton'], onclick: () => { selectedParticle = DirtSpawner; } },
                ashSpawner: { text: 'Ash Spawner', class: 'particleButton', bg: '#000000', classes: ['particleButton'], onclick: () => { selectedParticle = AshSpawner; } },
                waterSpawner: { text: 'Water Spawner', class: 'particleButton', bg: '#0000FF', classes: ['particleButton'], onclick: () => { selectedParticle = WaterSpawner; } },
                steamSpawner: { text: 'Steam Spawner', class: 'particleButton', bg: '#FFFFFF', classes: ['particleButton'], onclick: () => { selectedParticle = SteamSpawner; } },
                fireSpawner: { text: 'Fire Spawner', class: 'particleButton', bg: '#FF4500', classes: ['particleButton'], onclick: () => { selectedParticle = FireSpawner; } },
            },
            voidsMenu: {
                voidBlock: { text: 'Void Block', class: 'particleButton', bg: '#000000', classes: ['particleButton'], onclick: () => { selectedParticle = VoidBlock; } },
                voidSolidsBlock: { text: 'Void Solids Block', class: 'particleButton', bg: '#808080', classes: ['particleButton'], onclick: () => { selectedParticle = VoidSolidsBlock; } },
                voidLiquidsBlock: { text: 'Void Liquids Block', class: 'particleButton', bg: '#0000FF', classes: ['particleButton'], onclick: () => { selectedParticle = VoidLiquidsBlock; } },
                voidGassesBlock: { text: 'Void Gases Block', class: 'particleButton', bg: '#FFFFFF', classes: ['particleButton'], onclick: () => { selectedParticle = VoidGassesBlock; } },
            },
        };

        createSection(menuDiv, 'statsDiv', statsConfig, true);
        createSection(menuDiv, 'controlsDiv', controlsConfig, false);
        createSection(menuDiv, 'toolsDiv', toolsConfig, false);
        createSection(menuDiv, 'catagoriesDiv', catagoriesConfig, false);
        
        const particlesContainer = document.getElementById('particlesContainer') || document.createElement('div');
        particlesContainer.id = 'particlesContainer';
        particlesContainer.style.position = 'relative';
        if(!document.getElementById('particlesContainer')) menuDiv.appendChild(particlesContainer);

        Object.keys(allParticleButtons).forEach(menu => {
            createSection(particlesContainer, `${menu}Div`, allParticleButtons[menu], false, menu);
        });

        let container = document.getElementById('container');

        container.style.marginTop = menuDiv.getBoundingClientRect().height+ 20 + "px";
        particlesContainer.classList.add('m-1');
    }

    function createSection(parent, sectionId, config, isStats, menuName){
        let section = document.getElementById(sectionId);
        
        if(!section){
            section = document.createElement("div");
            section.id = sectionId;
            section.classList.add('fs-5');
            section.style.display = 'flex';
            section.style.flexWrap = 'wrap';
            section.style.zIndex = 10;
            
            if(menuName) {
                section.setAttribute('data-menu', menuName);
                section.style.display = menuName === selectedCategory ? 'flex' : 'none';
                section.style.position = 'relative';
                section.style.width = '100%';
            }

            if(isStats){
                Object.values(config).forEach(item => {
                    const div = document.createElement("div");
                    div.id = item.id;
                    div.style.flex = '1';
                    div.style.minWidth = '150px'; 
                    if(item.noWrap) { div.style.whiteSpace = "nowrap"; }
                    div.innerText = typeof item.initialText === 'function' ? item.initialText() : item.initialText;
                    section.appendChild(div);
                });
            } else {
                const buttonsCol = document.createElement("div");
                buttonsCol.classList.add('fs-3');

                Object.values(config).forEach(item => {
                    const btn = document.createElement("button");
                    btn.innerText = item.text;
                    btn.style.backgroundColor = item.bg;
                    btn.onclick = item.onclick;
                    btn.classList.add(item.class, 'button');
                    item.classes.forEach(cls => btn.classList.add(cls));
                    buttonsCol.appendChild(btn);
                });

                section.appendChild(buttonsCol);
            }

            parent.appendChild(section);

        }
    }


})();

