import Matrix from './matrix.js' ;
import { Database } from './database.js';

import * as particles from "./particles/particles.js";
import * as modifiers from "./modifiers.js";

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

let selectedParticle = particles.Sand;

let selectedCategory = "solidsMenu";

let mouseOver = false;

let paused = false;
let override = false;

let tileSize = undefined;

const database = new Database();

let saveName = null;
let username = null;

let view = 'normal';

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
    };

    addToStage(containers.playArea, containers.ui);

    containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0x555555));

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
            matrix.updateGrid(view);
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

        let p = matrix.getParticle(mouseX, mouseY);
        if(p){
            console.log(p.burning);
        }
    
    });

    app.ticker.add(() => {
        outline.position.set(mouseX * tileSize, mouseY * tileSize);

        let hovered = matrix.withinBounds(mouseX, mouseY)
            ? matrix.getParticle(mouseX, mouseY)
            : null;

        mouseCoordsDiv.innerText = `X: ${mouseX} Y: ${mouseY}`;
        hoveredParticleDiv.innerText = `Hovered: ${hovered ? hovered.constructor.name : 'None'}`;
        particleTempDiv.innerText = hovered ? `Temp: ${Math.floor(hovered.getTemp())}C°` : '';
    });

    containers.playArea.on("pointermove", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;

        mouseX = Math.trunc(event.global.x / matrix.getTileSize()) - Math.floor(brushSize / 2);
        mouseY = Math.trunc(event.global.y / matrix.getTileSize()) -  Math.floor(brushSize / 2);
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
        outline.rect(0, 0, tileSize * brushSize, tileSize * brushSize)
            .stroke({ width: 1, color: 0xff0000 });
    });
    
    window.addEventListener('keydown', (event) => {
        if(mouseOver){
            console.log(event.key); 
            if(event.key == ' '){ paused = !paused; updateControlButton(document.querySelector('#Pause')); }
            else if(event.key == 'r'){ resetMatrix(); }
            else if(event.key == 'ArrowRight' && paused){ matrix.updateGrid(view); }
            else if(event.key == '1'){
                view = 'normal'; 
                changeViewToNormal();
                updateControlButton(document.getElementById('Thermal View'));
            }
            else if(event.key == '2'){ view = 'thermal'; updateControlButton(document.getElementById('Thermal View')); }
            
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

    function updateSelectedParticle(btn){
        if(btn == null || btn == undefined){ return; }

        if( btn.classList.contains('selectableParticleButton') ){ 
            let selectedParticle = document.querySelector(`.selectedParticleButton`);
            if(selectedParticle){
                selectedParticle.classList.remove('selectedParticleButton');
            }
            btn.classList.add('selectedParticleButton');
            document.querySelector('#selectedParticleDiv').innerText = `Selected: ${btn.innerText}`;
        }
    }

    function updateControlButton(btn){
        if(btn == null || btn == undefined){ return; }

        if( btn.classList.contains('controlButtonOn') ){
            btn.classList.remove('controlButtonOn');
            btn.classList.add('controlsButton');
        }else{
            btn.classList.add('controlButtonOn');
            btn.classList.remove('controlsButton');
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
        const canvasRect = app.view.getBoundingClientRect();
        
        const parentDiv = document.createElement("div");
        parentDiv.id = 'saveMenu';
        parentDiv.style.left = canvasRect.left + canvasRect.width / 2 - 250 + "px";
        parentDiv.style.top = canvasRect.top + canvasRect.height / 2 - 200 + "px";
        parentDiv.style.width = "500px";
        parentDiv.style.height = "400px";

        parentDiv.style.pointerEvents = 'auto';

        parentDiv.addEventListener('pointerenter', () => {
            // Disable PIXI playArea interaction so the canvas doesn't respond while hovering the menu
            containers.playArea.interactive = false;
            containers.playArea.eventMode = "none";

            // Make sure the canvas cursor is not forcing "hidden" while the menu is hovered
            containers.playArea.cursor = 'auto';
            app.view.style.cursor = 'auto';
        });

        parentDiv.addEventListener('pointerleave', () => {
            // Re-enable PIXI playArea interaction when leaving the menu (if the menu is visible)
            containers.playArea.interactive = true;
            containers.playArea.eventMode = "static";

            // Restore the hidden cursor behavior over the play area
            containers.playArea.cursor = 'none';
            app.view.style.cursor = 'none';
        });

        parentDiv.classList.add('popupMenu');

        let title = document.createElement('h2');
        title.textContent = 'Save Menu';
        title.style.textAlign = 'center';
        title.classList.add('popupMenuTitle');
        parentDiv.appendChild(title);

        let saveText = document.createElement('h3');
        saveText.classList.add('text-center');
        saveText.textContent = 'Save Name';

        let usernameText = document.createElement('h3');
        usernameText.classList.add('text-center');
        usernameText.textContent = 'Username';
        

        // Create input
        const saveNameInput = document.createElement("input");
        saveNameInput.id = "saveNameInput";
        saveNameInput.type = "text";
        saveNameInput.style.zIndex = 10;

        const usernameInput = document.createElement("input");
        usernameInput.id = "usernameInput";
        usernameInput.type = "text";
        usernameInput.style.zIndex = 10;

        saveNameInput.style.left = 0 + "px";
        saveNameInput.style.top = 0 + "px";
        saveNameInput.style.width = "300px";
        saveNameInput.style.height = "50px";
        saveNameInput.style.marginBottom = "20px";
        saveNameInput.classList.add('mx-auto', 'd-block');

        usernameInput.style.left =  0 + "px";
        usernameInput.style.top = 0 + "px";
        usernameInput.style.width = "300px";
        usernameInput.style.height = "50px";
        usernameInput.style.marginBottom = "20px";
        usernameInput.classList.add('mx-auto', 'd-block');

        // Create buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "center";

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.classList.add('button', 'popupButton');
        saveButton.style.marginRight = "10%";
        saveButton.onclick = () => { saveAndDownloadPlayArea(); updateVisibilityOfSaveMenu(); };

        const publishButton = document.createElement("button");
        publishButton.textContent = "Publish";
        publishButton.classList.add('button', 'popupButton');
        publishButton.style.marginLeft = "10%";
        publishButton.onclick = () => { saveAndPublishPlayArea(); updateVisibilityOfSaveMenu(); };

        parentDiv.appendChild(saveText);
        parentDiv.appendChild(saveNameInput);

        parentDiv.appendChild(usernameText);
        parentDiv.appendChild(usernameInput);

        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(publishButton);

        parentDiv.appendChild(buttonContainer);

        document.body.appendChild(parentDiv);

        updateVisibilityOfSaveMenu();

    }

    function updateVisibilityOfSaveMenu(){
        document.getElementById('saveMenu').hidden = !(document.getElementById('saveMenu').hidden);
    }

    async function defineLoadMenu(){
        const canvasRect = app.view.getBoundingClientRect();

        const parentDiv = document.createElement("div");
        parentDiv.id = 'loadMenu';
        parentDiv.style.left = canvasRect.left + canvasRect.width / 2 - 250 + "px";
        parentDiv.style.top = canvasRect.top + canvasRect.height / 2 - 250 + "px";
        parentDiv.style.width = "500px";
        parentDiv.style.height = "500px";

        parentDiv.style.pointerEvents = 'auto';

        parentDiv.addEventListener('pointerenter', () => {
            // Disable PIXI playArea interaction so the canvas doesn't respond while hovering the menu
            containers.playArea.interactive = false;
            containers.playArea.eventMode = "none";

            // Make sure the canvas cursor is not forcing "hidden" while the menu is hovered
            containers.playArea.cursor = 'auto';
            app.view.style.cursor = 'auto';
        });

        parentDiv.addEventListener('pointerleave', () => {
            // Re-enable PIXI playArea interaction when leaving the menu (if the menu is visible)
            containers.playArea.interactive = true;
            containers.playArea.eventMode = "static";

            // Restore the hidden cursor behavior over the play area
            containers.playArea.cursor = 'none';
            app.view.style.cursor = 'none';
        });
        parentDiv.classList.add('popupMenu');
        
        let title = document.createElement('h2');
        title.style.textAlign = 'center';
        title.textContent = "Load Play Area";
        parentDiv.appendChild(title);

        let searchText = document.createElement('h5');
        searchText.style.textAlign = 'center';
        searchText.textContent = "Search Play Areas";
        parentDiv.appendChild(searchText);

        // Search Bar
        const searchBar = document.createElement("input");
        searchBar.id = "searchBar";
        searchBar.type = "text";
        searchBar.style.zIndex = 10;

        searchBar.style.left = 0 + "px";
        searchBar.style.top = 0 + "px";
        searchBar.style.width = "300px";
        searchBar.style.height = "50px";
        searchBar.style.marginBottom = "20px";
        searchBar.classList.add('mx-auto', 'd-block');

        searchBar.addEventListener('input', async (event) => { 
            let communitySaves = document.getElementById('communitySaves');
            communitySaves.innerHTML = "<div class='text-center mt-5'> Loading... </div>"

            const allSaves = await database.findAllWith('ParticulateSaves', 'name', event.target.value);

            communitySaves.innerHTML = '';
            
            allSaves.forEach( save => {
                communitySaves.innerHTML += 
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

        parentDiv.appendChild(searchBar);

        
        const communitySaves = document.createElement("div");
        communitySaves.id = 'communitySaves';

        communitySaves.classList.add('scrollable-div');
        communitySaves.style.zIndex = 10;

        communitySaves.style.width = "100%";
        console.log(parentDiv.getBoundingClientRect().height);
        communitySaves.style.height = "325px";

        communitySaves.innerHTML = "<div class='text-center mt-5'> Loading... </div>"

        const allSaves = await database.readAllDocs('ParticulateSaves');

        communitySaves.innerHTML = '';
        
        allSaves.forEach( save => {
            communitySaves.innerHTML += 
            `<div class="row fs-5"> 
                <hr />
                <div class='col-lg-6 ps-5'> 
                    <p class="p-2"> ${save.name} by: ${save.username} </p> 
                </div> 
                <div class="col-lg-6 ps-5"> 
                    <button class="btn btn-dark mt-1" onclick = 'downloadAndApplyPlayArea("${save.id}")'> Download </button> 
                </div> 
            </div>`;
        })

        parentDiv.appendChild(communitySaves);

        document.body.appendChild(parentDiv);

        updateVisibilityOfLoadMenu();

    }

    function updateVisibilityOfLoadMenu(){
        let parentDiv = document.getElementById('loadMenu');

        parentDiv.hidden = !(parentDiv.hidden);
    }
    
    async function updateLoadMenu(){
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

        updateVisibilityOfLoadMenu();
    }

    document.getElementById('saveNameInput').addEventListener('input', (event) => {
        saveName = event.target.value;
    });

    document.getElementById('usernameInput').addEventListener('input', (event) => {
        username = event.target.value;
    });

    window.downloadAndApplyPlayArea = function(id) {
        console.log(id);
        downloadAndApplyPlayArea(id);
    };

    window.addEventListener('resize', () => {
        //console.log(`Width: ${window.innerWidth}, Height: ${window.innerHeight}`);
        createNewMenu();
    });

    function adjustBrightness(hex, factor) { 
        let r = (hex >> 16) & 0xff;
        let g = (hex >> 8) & 0xff;
        let b = hex & 0xff;

        r = Math.min(255, Math.floor(r * factor));
        g = Math.min(255, Math.floor(g * factor));
        b = Math.min(255, Math.floor(b * factor));

        return (r << 16) | (g << 8) | b;
    }

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
            particleTempDiv: { id: 'particleTempDiv', label: 'Temp', classes: [], initialText: '', noWrap: true },
        };

        const controlsConfig = {
            pause: { text: 'Pause', class: 'controlsButton', bg: '#000', borderColor: '#fff', classes: ['controlsButton'], onclick: (event) => { paused = !paused; updateControlButton(event.currentTarget || event.target); } },
            reset: { text: 'Reset', class: 'controlsButton', bg: '#000', borderColor: '#fff', classes: ['controlsButton'], onclick: (event) => { resetMatrix(); } },
            override: { text: 'Override', class: 'controlsButton', bg: '#000', borderColor: '#fff', classes: ['controlsButton'], txtColor: '#FFFFFF', onclick: (event) => { override = !override; updateControlButton(event.currentTarget || event.target);} },
            stepFrame: { text: '>', class: 'controlsButton', bg: '#000', borderColor: '#fff', classes: ['controlsButton'], txtColor: '#FFFFFF', onclick: (event) => { matrix.updateGrid(view); } },
            thermalView: { text: 'Thermal View', class: 'controlsButton', bg: '#000', borderColor: '#fff', classes: ['controlsButton'], txtColor: '#FFFFFF', onclick: (event) => { updateControlButton(event.currentTarget || event.target); if(view == 'normal'){view = 'thermal'} else {view = 'normal'; changeViewToNormal();   } } },
            
        };


        const toolsConfig = {
            eraser: { text: 'Eraser', class: 'toolsButton', bg: '#FF5CFA', borderColor: '#a50da0ff', classes: ['toolsButton', 'selectableParticleButton'], onclick: () => { selectedParticle = null; } },
            save: { text: 'Save', class: 'toolsButton', bg: '#00FF00', borderColor: '#008800ff', classes: ['toolsButton'], onclick: () => { updateVisibilityOfSaveMenu(); if(!paused) { paused = true; updateControlButton(document.querySelector('#Pause')); } } },
            load: { text: 'Load', class: 'toolsButton', bg: '#00FFFF', borderColor: '#007272ff', classes: ['toolsButton'], onclick: () => { updateVisibilityOfLoadMenu(); if(!paused) { paused = true; updateControlButton(document.querySelector('#Pause')); } } },
        };

        const catagoriesConfig = {
            solids: { text: 'Solids', class: 'categoryButton', classes: ['categoryButton', 'selectedCategoryButton'], onclick: () => { selectedCategory = "solidsMenu"; updateCatagories(); } },
            liquids: { text: 'Liquids', class: 'categoryButton', txtColor: '#FFFFFF', classes: ['categoryButton'], onclick: () => { selectedCategory = "liquidsMenu"; updateCatagories(); } },
            gases: { text: 'Gases', class: 'categoryButton', classes: ['categoryButton'], onclick: () => { selectedCategory = "gasesMenu"; updateCatagories(); } },
            spawners: { text: 'Spawners', class: 'categoryButton', txtColor: '#FFFFFF', classes: ['categoryButton'], onclick: () => { selectedCategory = "spawnersMenu"; updateCatagories(); } },
            voids: { text: 'Void Blocks', class: 'categoryButton', txtColor: '#FFFFFF', classes: ['categoryButton'], onclick: () => { selectedCategory = "voidsMenu"; updateCatagories(); } },
            energy: { text: 'Energy', class: 'categoryButton', classes: ['categoryButton'], onclick: () => { selectedCategory = "energyMenu"; updateCatagories(); } },
        };

        const allParticleButtons = {
            solidsMenu: {
                sand: { text: 'Sand', class: 'particleButton', bg: '#DBD49D', borderColor: '#817c54ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Sand; } },
                dirt: { text: 'Dirt', class: 'particleButton', bg: '#964B00', borderColor: '#4e2700ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Dirt; } },
                stone: { text: 'Stone', class: 'particleButton', bg: '#808080', borderColor: '#474747ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Stone; } },
                ash: { text: 'Ash', class: 'particleButton', bg: '#C8C8C8', borderColor: '#727272ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Ash; } },
                bedrock: { text: 'Bedrock', class: 'particleButton', bg: '#3A3A3A', txtColor: '#FFFFFF', borderColor: '#6b6b6bff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Bedrock; } },
                obsidian: { text: 'Obsidian', class: 'particleButton', bg: '#181818', txtColor: '#FFFFFF', borderColor: '#3d3d3dff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Obsidian; } },
                ice: { text: 'Ice', class: 'particleButton', bg: '#B4FFFF', borderColor: '#4f7575ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Ice; } },
                wood: { text: 'Wood', class: 'particleButton', bg: '#914815', txtColor: '#FFFFFF', borderColor: '#532a0cff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Wood; } },
                tnt: { text: 'TNT', class: 'particleButton', bg: '#FF1E1E', txtColor: '#FFFFFF', borderColor: '#7e1e1eff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Tnt; } },
                gravel: { text: 'Gravel', class: 'particleButton', bg: '#8B8B8B', borderColor: '#4f4f4fff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Gravel; } },
                mud: { text: 'Mud', class: 'particleButton', bg: '#70543E', borderColor: '#3d2e1eff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Mud; } },
                wetSand: { text: 'Wet Sand', class: 'particleButton', bg: '#a79766ff', borderColor: '#8b8341ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.WetSand; } },
                mudWall: { text: 'Mud Wall', class: 'particleButton', bg: '#8B4513', borderColor: '#4e2700ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.MudWall; } },
                charcoal: { text: 'Charcoal', class: 'particleButton', bg: '#1b1b1b', borderColor: 'rgb(82, 82, 82)', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Charcoal; } }
            },
            liquidsMenu: {
                water: { text: 'Water', class: 'particleButton', bg: '#045AFF', borderColor: '#002e83ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Water; } },
                lava: { text: 'Lava', class: 'particleButton', bg: '#FF4500', borderColor: '#912700ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Lava; } },
                alcohol: { text: 'Alcohol', class: 'particleButton', bg: '#E6E6FA', borderColor: '#D8BFD8ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Alcohol; } },
                acid: { text: 'Acid', class: 'particleButton', bg: '#00FF00', borderColor: '#33FF33ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Acid; } }
            
            },
            gasesMenu: {
                steam: { text: 'Steam', class: 'particleButton', bg: '#FFFFFF', borderColor: '#adadadff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Steam; } },
                fire: { text: 'Fire', class: 'particleButton', bg: '#FF4500', borderColor: '#912700ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Fire; } },
                smoke: { text: 'Smoke', class: 'particleButton', bg: '#A9A9A9', borderColor: '#696969ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Smoke; } },
                propane: { text: 'Propane', class: 'particleButton', bg: '#00FF00', borderColor: '#33FF33ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.Propane; } } 
            },
            spawnersMenu: {
                sandSpawner: { text: 'Sand Spawner', class: 'particleButton', bg: '#D2B48C', borderColor: '#817c54ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.SandSpawner; } },
                dirtSpawner: { text: 'Dirt Spawner', class: 'particleButton', bg: '#8B4513', borderColor: '#4e2700ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.DirtSpawner; } },
                ashSpawner: { text: 'Ash Spawner', class: 'particleButton', bg: '#C8C8C8', borderColor: '#727272ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.AshSpawner; } },
                waterSpawner: { text: 'Water Spawner', class: 'particleButton', bg: '#045AFF', borderColor: '#002e83ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.WaterSpawner; } },
                steamSpawner: { text: 'Steam Spawner', class: 'particleButton', bg: '#FFFFFF', borderColor: '#adadadff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.SteamSpawner; } },
                fireSpawner: { text: 'Fire Spawner', class: 'particleButton', bg: '#FF4500', borderColor: '#912700ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.FireSpawner; } },
                smokeSpawner: { text: 'Smoke Spawner', class: 'particleButton', bg: '#A9A9A9', borderColor: '#696969ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.SmokeSpawner; } },
            },
            voidsMenu: {
                voidBlock: { text: 'Void Block', class: 'particleButton', bg: '#000000', borderColor: '#464646ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.VoidBlock; } },
                voidSolidsBlock: { text: 'Void Solids Block', class: 'particleButton', bg: '#808080', borderColor: 'rgba(71, 71, 71, 1)080', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.VoidSolidsBlock; } },
                voidLiquidsBlock: { text: 'Void Liquids Block', class: 'particleButton', bg: '#0000FF', borderColor: '#000094ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.VoidLiquidsBlock; } },
                voidGassesBlock: { text: 'Void Gases Block', class: 'particleButton', bg: '#FFFFFF', borderColor: '#777777ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = particles.VoidGassesBlock; } },
            },
            energyMenu:{
                heatRay: { text: 'Heat Ray', class: 'particleButton', bg: '#FF0000', borderColor: '#7a0000ff', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = modifiers.HeatRay; } },
                freezeRay: { text: 'Freeze Ray', class: 'particleButton', bg: '#51c7fd', borderColor: 'rgb(11, 55, 121)', classes: ['particleButton', 'selectableParticleButton'], onclick: () => { selectedParticle = modifiers.FreezeRay; } },
            }
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

        updateSelectedParticle(document.getElementById('Sand'));
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
                    div.classList.add('fs-4');
                    if(item.noWrap) { div.style.whiteSpace = "nowrap"; }
                    div.innerText = typeof item.initialText === 'function' ? item.initialText() : item.initialText;
                    section.appendChild(div);
                });
            } else {
                const buttonsCol = document.createElement("div");
                buttonsCol.classList.add('fs-3');

                Object.values(config).forEach(item => {
                    const btn = document.createElement("button");
                    btn.id = `${item.text}`;
                    btn.innerText = item.text;
                    btn.style.backgroundColor = item.bg;
                    btn.onclick = item.onclick;
                    btn.classList.add(item.class, 'button');
                    item.classes.forEach(cls => btn.classList.add(cls));
                    btn.style.borderColor = `${item.borderColor}` || '#ffffff';

                    btn.addEventListener('mouseenter', () => { btn.style.filter = 'brightness(120%)'; });
                    btn.addEventListener('mouseleave', () => { btn.style.filter = 'brightness(100%)'; });
                    btn.addEventListener('mousedown', () => { btn.style.filter = 'brightness(80%)'; updateSelectedParticle(btn); });
                    btn.addEventListener('mouseup', () => { btn.style.filter = 'brightness(120%)'; });

                    buttonsCol.appendChild(btn);
                });

                section.appendChild(buttonsCol);
            }
            parent.appendChild(section);
        }
        

    }

    function changeViewToNormal(){
        for(let r = 0; r < matrix.getRows(); r++){
            for(let c=0; c < matrix.getCols(); c++){
                let p = matrix.getParticle(c, r);
                if (p) {
                    p.setColor(p.colors);
                }
            }
        }
    }

})();

export function getMousePosition(){
    return [mouseX, mouseY];
}