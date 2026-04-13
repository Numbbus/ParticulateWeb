import Matrix from './matrix.js' ;
import { Database } from './database.js';

import { 
    Sand, Dirt, Stone, Water, Ash, Bedrock, Obsidian, Ice, Wood, Tnt, Steam, Fire, Smoke,
    SandSpawner, DirtSpawner, AshSpawner, WaterSpawner, SteamSpawner, FireSpawner,
    VoidBlock, VoidSolidsBlock, VoidLiquidsBlock, VoidGassesBlock,
} from "./particles/particles.js";

import * as particles from "./particles/particles.js";

import { Button } from "https://cdn.jsdelivr.net/npm/@pixi/ui@2.3.2/+esm";

const { Application, EventSystem, Text, Container, Graphics  } = PIXI;

import "https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js"

import { registerAll, get } from './registry.js';

let maxWidth = 1500;
let maxHeight = 700;

let mouseDown = false;
let mouseX = 0;
let mouseY = 0;

let previouseMouseX = null;
let previouseMouseY = null;

let brushSize = 1;

let selectedParticle = Sand;

let selectedMenu = "solidsMenu";

let allMenuButtons = null;
let allParticleButtons = null;

let mouseOver = false;

let paused = false;
let override = false;

let tileSize = undefined;

let selectedButton = undefined;
let selectedMenuButton = undefined;

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
        menu: new Container(),
        ui: new Container(),
        savesMenu: new Container(),
        loadMenu: new Container(),
    };

    containers.menu.x = 0;
    containers.menu.y = app.screen.height - 200;

    addToStage(containers.playArea, containers.menu, containers.ui, containers.savesMenu, containers.loadMenu);

    // set background color and size of container
    containers.menu.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height).fill(0x333333))

    containers.savesMenu.addChild(new Graphics().rect(-5, -5, 510, 410).fill(0xffffff));
    containers.savesMenu.addChild(new Graphics().rect(0, 0, 500, 400).fill(0x000000));

    containers.loadMenu.addChild(new Graphics().rect(-5, -5, 510, 410).fill(0xffffff));
    containers.loadMenu.addChild(new Graphics().rect(0, 0, 500, 400).fill(0x000000));

    containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, containers.menu.y).fill(0x555555));

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

    // Set cursor for menu
    containers.menu.interactive = true;
    containers.menu.cursor = 'auto'; // Cursor automatically switches over menu

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

    let topBarText = {};
    let topBarButtons = {};

    createMenu();

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

        topBarText.coordsText.text = `X: ${mouseX} Y: ${mouseY}`;

        mouseDown = true;
    
    });

    containers.playArea.on("pointermove", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;

        mouseX = Math.trunc(event.global.x / matrix.getTileSize()) - Math.floor(brushSize / 2);
        mouseY = Math.trunc(event.global.y / matrix.getTileSize()) -  Math.floor(brushSize / 2);

        topBarText.coordsText.text = `X: ${mouseX} Y: ${mouseY}`;

        outline.clear();
        outline.rect(mouseX * tileSize, mouseY * tileSize, tileSize*brushSize, tileSize*brushSize).stroke({ width: 1, color: 0xff0000 }); 

        let hovered = matrix.withinBounds(mouseX, mouseY) ? matrix.getParticle(mouseX, mouseY) : null;

        topBarText.hoveredOverParticleText.text = `Hovered: ${hovered == null || hovered == undefined ? '' : hovered.constructor.name }`;
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

        topBarText.brushSizeText.text = `Brush Size: ${brushSize}`;

        outline.clear();
        outline = new Graphics().rect(mouseX * tileSize, mouseY * tileSize, tileSize*brushSize, tileSize*brushSize).stroke({ width: 1, color: 0xff0000 });
        outline.pivot.set(0, 0);
        containers.ui.addChild(outline);
    });

    containers.menu.on('pointerover', (event) => {
        mouseDown = false;
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
            topBarText.fpsText.text = `FPS: ${app.ticker.FPS.toFixed(0)}`;
            updateFps = false;
        }else{
            updateFps = true;
        }
        
    });

    function resetMatrix(){
        matrix = new Matrix(app, containers); 
        containers.playArea.removeChildren()
        containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, containers.menu.y).fill(0x555555));
    }

    function darken(hex, factor) { 
        let r = (hex >> 16) & 0xff;
        let g = (hex >> 8) & 0xff;
        let b = hex & 0xff;

        r = Math.floor(r * factor);
        g = Math.floor(g * factor);
        b = Math.floor(b * factor);

        return (r << 16) | (g << 8) | b;
    }

    function createButton(txt, {bg = 0xae34fa, w = 90, h = 25,  outline = true, outlineColor = 0xffffff, outlineThicknes = 2, txtColor = 0xffffff, toggleable = true } = {}){
        const defaultView = new Graphics()
            .rect(0, 0, w, h)
            .fill(bg)
            .stroke({ width: outlineThicknes, color: outlineColor});

        const btn = new Button(defaultView);

        btn.view._bg = bg;
        btn.view._HoverBg = darken(bg, 0.8);
        btn.view._SelectedBg = darken(bg, 0.6);
        btn.view._SelectedHoverBg = darken(btn.view._SelectedBg, 1.3);

        btn.view._w = w;
        btn.view._h = h;

        btn._toggled = false;
        
        btn.view.on('pointerover', () => {
            if(selectedButton === btn.view || selectedMenuButton === btn.view || btn._toggled){
                defaultView.clear().rect(0, 0, w, h).fill(btn.view._SelectedHoverBg).stroke({ width: outlineThicknes, color: outlineColor});
            }else{
                defaultView.clear().rect(0, 0, w, h).fill(btn.view._HoverBg).stroke({ width: outlineThicknes, color: outlineColor});
            }
            
        });

        btn.view.on('pointerout', () => {
            if(selectedButton === btn.view  || selectedMenuButton === btn.view || btn._toggled){
                defaultView.clear().rect(0, 0, w, h).fill(btn.view._SelectedBg).stroke({ width: outlineThicknes, color: outlineColor});
            }else{
                defaultView.clear().rect(0, 0, w, h).fill(bg).stroke({ width: outlineThicknes, color: outlineColor});
            }
        });

        btn.view.on('pointerdown', () => {
            if(toggleable){
                btn._toggled = !btn._toggled;
            }
        });

        const label = new Text(txt, {
            fontSize: 20,
            fill: txtColor,
        });

        label.anchor.set(0.5);
        label.position.set(w/2, h/2);

        // Add text ON TOP of the button view
        btn.view.addChild(label);
        
        return btn;
    }

    function createMenu(){
        let buttonIndent = 50;

        let topBarIndent = buttonIndent;
        let topBarY = 10;

        topBarText = {
            fpsText: new Text('FPS: 0', {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff,
            }),
            coordsText: new Text('X: 000 Y: 000', {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff,
            }),
            brushSizeText: new Text('Brush Size: 1', {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff,
            }),
            pausedText: new Text('Paused!', {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff,
            }),
            overrideText: new Text('Override On!', {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff,
            }),
            selectedParticleText: new Text('Selected:                ', {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff,
            }),
            hoveredOverParticleText: new Text('Hovered:                          ', {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xffffff,
            }),

            
        }

        topBarText.pausedText.visible = false;
        topBarText.overrideText.visible = false;

        topBarButtons = {
            eraserBtn: createButton("Eraser", {bg: 0xFF5CFA}).view.on('pointerdown', (e) => { selectedParticle = null; changeSelectedButton(e.currentTarget); }),
            pauseBtn: createButton("Pause").view.on('pointerdown', (e) => { paused = !paused; topBarText.pausedText.visible = paused; toggleButtonBg(e.currentTarget);}),
            resetBtn: createButton("Reset", {bg: 0xFF3333, toggleable: false}).view.on('pointerdown', (e) => { resetMatrix(); }),
            overrideBtn: createButton("Override", {bg: 0x7a3f6d}).view.on('pointerdown', (e) => { override = !override; toggleButtonBg(e.currentTarget); topBarText.overrideText.visible = override; }),
            saveBtn: createButton("Save", {bg: 0xf40c2, toggleable: false}).view.on('pointerdown', (e) => { updateVisibilitOfSaveMenu(); paused = true; }),
            loadBtn: createButton("Load", {bg: 0xf40c2, toggleable: false}).view.on('pointerdown', (e) => { updateLoadMenu(); paused = true; }),
        }

        let menuTxtOffset = 0;
        let txtX = topBarIndent;
        let txtY = topBarY;
        let row = 0;
        let rowSpacing = 5;
        let colSpacing = 70;

        let btnColSpacing = 5;

        for(let t in topBarText){
            let txt = topBarText[t];



            if(txtX + txt.width >= app.screen.width){
                row++;
                txtX = topBarIndent;
                txtY = txtY + txt.height + rowSpacing;
                menuTxtOffset = menuTxtOffset + txt.height
            }

            txt.position.x = txtX;
            txt.position.y = txtY; 

            txtX = txt.width + txtX + colSpacing;


            containers.menu.addChild(txt);   
        }

        for(let b in topBarButtons){
            let btn = topBarButtons[b];

            if(txtX + btn._w >= app.screen.width){
                row++;
                txtX = topBarIndent;
                txtY = txtY + btn._h + rowSpacing;
                menuTxtOffset = menuTxtOffset + btn._h + 5;
            }

            btn.position.set(txtX, txtY);

            txtX = btn._w + txtX + btnColSpacing;


            containers.menu.addChild(btn);   
        }


        createButtons(buttonIndent, menuTxtOffset);
    }

    function toggleButtonBg(btn){

        if(btn._toggled){
            btn.clear()
                .rect(0, 0, btn._w, btn._h)
                .fill(btn._bg)
                .stroke({ width: 2, color: 0xffffff });
        }else{
            btn.clear()
                .rect(0, 0, btn._w, btn._h)
                .fill(btn._bg)
                .stroke({ width: 2, color: 0xffffff });
        }
    }

    function changeSelectedButton(btn) {
        if (selectedButton) {
            selectedButton.clear()
                .rect(0, 0, selectedButton._w, selectedButton._h)
                .fill(selectedButton._bg)
                .stroke({ width: 2, color: 0xffffff });
        }

        selectedButton = btn;

        selectedButton.clear()
            .rect(0, 0, selectedButton._w, selectedButton._h)
            .fill(selectedButton._SelectedBg)
            .stroke({ width: 2, color: 0xffffff });

        topBarText.selectedParticleText.text = `Selected: ${selectedParticle.name}`;
    }

    function changeSelectedMenuButton(btn) {
        if (selectedMenuButton) {
            selectedMenuButton.clear()
                .rect(0, 0, selectedMenuButton._w, selectedMenuButton._h)
                .fill(selectedMenuButton._bg)
                .stroke({ width: 2, color: 0xffffff });
        }

        selectedMenuButton = btn;

        selectedMenuButton.clear()
            .rect(0, 0, selectedMenuButton._w, selectedMenuButton._h)
            .fill(selectedMenuButton._SelectedBg)
            .stroke({ width: 2, color: 0xffffff });
    }

    function createButtons(buttonIndent, menuTxtOffset){


        allMenuButtons = {
            menuSelectButtons: {
                solidsSelect: createButton("Solids", { bg: 0x999999, w: 125, h: 30 }).view.on('pointerdown', (e) => { selectedMenu = "solidsMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
                liquidsSelect: createButton("Liquids", { bg: 0x999999, w: 125, h: 30 }).view.on('pointerdown', (e) => { selectedMenu = "liquidsMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
                gasesSelect: createButton("Gases", { bg: 0x999999, w: 125, h: 30 }).view.on('pointerdown', (e) => { selectedMenu = "gasesMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
                spawnersSelect: createButton("Spawners", { bg: 0x999999, w: 125, h: 30 }).view.on('pointerdown', (e) => { selectedMenu = "spawnersMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
                voidsSelect: createButton("Void Blocks", { bg: 0x999999, w: 125, h: 30 }).view.on('pointerdown', (e) => { selectedMenu = "voidsMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
                miscSelect: createButton("Misc", { bg: 0x999999, w: 125, h: 30 }).view.on('pointerdown', (e) => { selectedMenu = "miscMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
            }
        };

        /*allTopBarButtons = {
            constrolsButtons: {

            }
        }*/

        allParticleButtons = {
            solidsMenu: {
                stoneBtn: createButton("Stone", { bg: 0x8C8C8C }).view.on('pointerdown', (e) => { selectedParticle = Stone; changeSelectedButton(e.currentTarget); }),
                sandBtn: createButton("Sand", { bg: 0xDBD49D }).view.on('pointerdown', (e) => { selectedParticle = Sand; changeSelectedButton(e.currentTarget); }),
                dirtBtn: createButton("Dirt", { bg: 0x964B00 }).view.on('pointerdown', (e) => { selectedParticle = Dirt; changeSelectedButton(e.currentTarget); }),
                ashBtn: createButton("Ash", { bg: 0xC8C8C8 }).view.on('pointerdown', (e) => { selectedParticle = Ash; changeSelectedButton(e.currentTarget); }),
                bedrockBtn: createButton("Bedrock", { bg: 0x3A3A3A }).view.on('pointerdown', (e) => { selectedParticle = Bedrock; changeSelectedButton(e.currentTarget); }),
                iceBtn: createButton("Ice", { bg: 0xB4FFFF, txtColor: 0x000000 }).view.on('pointerdown', (e) => { selectedParticle = Ice; changeSelectedButton(e.currentTarget); }),
                obsidianBtn: createButton("Obsidian", { bg: 0x181818 }).view.on('pointerdown', (e) => { selectedParticle = Obsidian; changeSelectedButton(e.currentTarget); }),
                tntBtn: createButton("Tnt", { bg: 0xFF1E1E }).view.on('pointerdown', (e) => { selectedParticle = Tnt; changeSelectedButton(e.currentTarget); }),
                woodBtn: createButton("Wood", { bg: 0x914815 }).view.on('pointerdown', (e) => { selectedParticle = Wood; changeSelectedButton(e.currentTarget); }),
            },
            liquidsMenu: {
                waterBtn: createButton("Water", { bg: 0x0A0AFF }).view.on('pointerdown', (e) => { selectedParticle = Water; changeSelectedButton(e.currentTarget); }),
            },
            gasesMenu: {
                steamBtn: createButton("Steam", { bg: 0xffffff, txtColor: 0x000000 }).view.on('pointerdown', (e) => { selectedParticle = Steam; changeSelectedButton(e.currentTarget); }),
                fireBtn: createButton("Fire", { bg: 0xFFA500 }).view.on('pointerdown', (e) => { selectedParticle = Fire; changeSelectedButton(e.currentTarget); }),
            },
            spawnersMenu: {
                sandSpawnerBtn: createButton("Sand Spawner", { w: 150, bg: 0xff0000, txtColor: 0x000000 }).view.on('pointerdown', (e) => { selectedParticle = SandSpawner; changeSelectedButton(e.currentTarget); }),
                dirtSpawnerBtn: createButton("Dirt Spawner", { w: 150, bg: 0xFFFF00, txtColor: 0x000000 }).view.on('pointerdown', (e) => { selectedParticle = DirtSpawner; changeSelectedButton(e.currentTarget); }),
                ashSpawnerBtn: createButton("Ash Spawner", { w: 150, bg: 0x0F7D0F, txtColor: 0x000000 }).view.on('pointerdown', (e) => { selectedParticle = AshSpawner; changeSelectedButton(e.currentTarget); }),
                waterSpawnerBtn: createButton("Water Spawner", { w: 150, bg: 0x00FFFF, txtColor: 0x000000 }).view.on('pointerdown', (e) => { selectedParticle = WaterSpawner; changeSelectedButton(e.currentTarget); }),
                steamSpawnerBtn: createButton("Steam Spawner", { w: 150, bg: 0xffffff, txtColor: 0x000000 }).view.on('pointerdown', (e) => { selectedParticle = SteamSpawner; changeSelectedButton(e.currentTarget); }),
                fireSpawnerBtn: createButton("Fire Spawner", { w: 150, bg: 0xFF00FF, txtColor: 0x000000 }).view.on('pointerdown', (e) => { selectedParticle = FireSpawner; changeSelectedButton(e.currentTarget); }),
            },
            voidsMenu: {
                voidBlockBtn: createButton("Void Block", { w: 175, bg: 0xae34fa }).view.on('pointerdown', (e) => { selectedParticle = VoidBlock; changeSelectedButton(e.currentTarget); }),
                voidSolidsBtn: createButton("Void Solids Block", { w: 175, bg: 0xB52300 }).view.on('pointerdown', (e) => { selectedParticle = VoidSolidsBlock; changeSelectedButton(e.currentTarget); }),
                voidLiquidsBtn: createButton("Void Liquids Block", { w: 175, bg: 0x134A00 }).view.on('pointerdown', (e) => { selectedParticle = VoidLiquidsBlock; changeSelectedButton(e.currentTarget); }),
                voidGasBtn: createButton("Void Gases Block", { w: 175, bg: 0x360034 }).view.on('pointerdown', (e) => { selectedParticle = VoidGassesBlock; changeSelectedButton(e.currentTarget); }),
            },
            miscMenu: {
                
            },
        };


        selectedButton = allParticleButtons.solidsMenu.sandBtn;
        changeSelectedButton(selectedButton);

        selectedMenuButton = allMenuButtons.menuSelectButtons.solidsSelect;
        changeSelectedMenuButton(selectedMenuButton);

        let menuButtonOffset = menuTxtOffset;

        for(let btns in allMenuButtons){
            let menu = btns;
            btns = allMenuButtons[menu];
            
            let btnX = buttonIndent;
            let btnY = 50 + menuTxtOffset;
            let row = 0;
            let rowSpacing = 5;

            for(let btn in btns){

                if(btnX + btns[btn]._w >= app.screen.width){
                    row++;
                    btnX = buttonIndent;
                    btnY = btnY + btns[btn]._h + rowSpacing;
                    menuButtonOffset = menuButtonOffset + btns[btn]._h

                    if(btnY + containers.menu.y + btns[btn].y + menuButtonOffset + 100 + btns[btn]._h >= app.screen.height - 50){
                        app.renderer.resize( app.screen.width, btnY + containers.menu.y + btns[btn].y + menuButtonOffset + 100);
                        resetMatrix()
                    }

                }

                btns[btn].position.set(btnX, btnY)

                btnX = btns[btn]._w + btnX + rowSpacing;


                containers.menu.addChild(btns[btn]);


            }
        }
        

        for(let btns in allParticleButtons){
            let menu = btns;
            btns = allParticleButtons[menu];
            
            let btnX = buttonIndent;
            let btnY = 100 + menuButtonOffset;
            let row = 0;
            let rowSpacing = 5;

            for(let btn in btns){

                if(btnX + btns[btn]._w >= app.screen.width){
                    row++;
                    btnX = buttonIndent;
                    btnY = btnY + btns[btn]._h + rowSpacing;
                }

                btns[btn].position.set(btnX, btnY)

                btnX = btns[btn]._w + btnX + rowSpacing;

                containers.menu.addChild(btns[btn]);

                btns[btn].interactive = selectedMenu === menu;
                btns[btn].buttonMode = selectedMenu === menu;
                btns[btn].visible = selectedMenu === menu;


            }
        }
    }

    function updateMenu(){
        for(let menu in allParticleButtons){
            let btns = allParticleButtons[menu];

            for(let btn in btns){
                
                btns[btn].interactive = selectedMenu === menu;
                btns[btn].buttonMode = selectedMenu === menu;
                btns[btn].visible = selectedMenu === menu;

            }

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

        // Define buttons
        let xButton = createButton('X', {bg: 0xff0000, w: 20, h: 20, toggleable: false});
        xButton.view.on('pointerdown', (e) =>{ updateVisibilitOfSaveMenu(); paused = false; });
        xButton.view.position.set(0, 0);
        savesMenu.addChild(xButton.view);

        let saveAndDownloadBtn = createButton('Save And Download', {bg: 0xff0000, w: 200, h: 30, toggleable: false});
        saveAndDownloadBtn.view.on('pointerdown', (e) =>{ saveAndDownloadPlayArea(); updateVisibilitOfSaveMenu(); });
        saveAndDownloadBtn.view.position.set(20, savesMenu.height - saveAndDownloadBtn.view.height * 2);
        savesMenu.addChild(saveAndDownloadBtn.view);

        let saveAndPublishBtn = createButton('Save And Publish', {bg: 0xff0000, w: 200, h: 30, toggleable: false});
        saveAndPublishBtn.view.on('pointerdown', (e) =>{ saveAndPublishPlayArea(); updateVisibilitOfSaveMenu(); });
        saveAndPublishBtn.view.position.set(280, savesMenu.height - saveAndPublishBtn.view.height * 2);
        savesMenu.addChild(saveAndPublishBtn.view);

        updateVisibilitOfSaveMenu();

    }

    function updateVisibilitOfSaveMenu(){
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

        let xButton = createButton('X', {bg: 0xff0000, w: 20, h: 20, toggleable: false});
        xButton.view.on('pointerdown', (e) =>{ updateVisibilityOfLoadMenu(); paused = false; });
        xButton.view.position.set(0, 0);
        loadMenu.addChild(xButton.view);

        // Center container
        loadMenu.x = app.screen.width / 2;
        loadMenu.y = app.screen.height / 3;
        loadMenu.pivot.x = loadMenu.width / 2;
        loadMenu.pivot.y = loadMenu.height / 2;
        loadMenu.interactive = true;
        loadMenu.cursor = 'auto';

        // Search Bar
        const searchBar = document.createElement("input");
        searchBar.id = "searchBar";
        searchBar.type = "text";
        searchBar.style.position = "absolute";
        searchBar.style.zIndex = 10;
        document.body.appendChild(searchBar);

        searchBar.style.left = loadMenu.getGlobalPosition().x + "px";
        searchBar.style.top = loadMenu.getGlobalPosition().y -50 + "px";
        searchBar.style.width = "300px";
        searchBar.style.height = "50px";

        const parentDiv = document.createElement("div");
        parentDiv.id = 'parentDiv';
        //parentDiv.style.backgroundColor = "white";
        parentDiv.classList.add('scrollable-div');
        parentDiv.style.position = "absolute";
        parentDiv.style.zIndex = 10;

        parentDiv.style.width = bounds.width + "px";
        parentDiv.style.height = bounds.height - 80 +"px";
        parentDiv.style.left = loadMenu.getGlobalPosition().x - 99 + "px";
        parentDiv.style.top = loadMenu.getGlobalPosition().y + "px";

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

        document.body.appendChild(parentDiv);

        //updateVisibilityOfLoadMenu();
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

})();

