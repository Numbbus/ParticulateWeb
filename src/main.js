
import Matrix from './matrix.js' ;

import { 
    Sand, Dirt, Stone, Water, Ash, Bedrock, Obsidian, Ice, Wood, Tnt, Steam, Fire, 
    SandSpawner, DirtSpawner, AshSpawner, WaterSpawner, SteamSpawner, FireSpawner,
    VoidBlock, VoidSolidsBlock, VoidLiquidsBlock, VoidGassesBlock,
} from "./particles/particles.js";

import { Button } from "https://cdn.jsdelivr.net/npm/@pixi/ui@2.3.2/+esm";

const { Application, EventSystem, Text, Container, Graphics  } = PIXI;

import "https://cdn.jsdelivr.net/npm/hammerjs@2.0.8/hammer.min.js"

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

let tileSize = undefined;

let selectedButton = undefined;
let selectedMenuButton = undefined;



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

    hammer.on('pinchstart', (ev) => {
        initialBrushSize = brushSize;
    });

    hammer.on('pinchmove', (ev) => {
        // ev.scale is relative to pinchstart
        brushSize = Math.floor(initialBrushSize * ev.scale);
    });

    const containers = {
        playArea: new Container(),
        menu: new Container(),
        ui: new Container(),
    };

    containers.menu.x = 0;
    containers.menu.y = app.screen.height - 200;

    addToStage(containers.playArea, containers.menu, containers.ui);

    // set background color and size of container
    containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, containers.menu.y).fill(0x555555));
    containers.menu.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height - containers.menu.y + 200).fill(0x333333))

    let matrix = new Matrix(app, containers)

    tileSize = matrix.getTileSize();

    app.ticker.add(gameLoop);

    function gameLoop(){

        if( !paused ){
            matrix.updateGrid();
        }
        if(mouseDown){
            if(brushSize == 1){
                matrix.traverseMatrixAndCreate(previouseMouseX, previouseMouseY, mouseX, mouseY, selectedParticle);
            }else{
                const coords = matrix.traverseMatrix(previouseMouseX, previouseMouseY, mouseX, mouseY);
                matrix.fillBrushArea(selectedParticle, brushSize, coords);
            }
        }
    }

    let outline = new Graphics().rect(0,0, tileSize, tileSize).stroke({ width: 1, color: 0xff0000 });
    outline.pivot.set(0, 0);
    containers.ui.addChild(outline);

    createMenu();

    // Mouse and keyboard inputs
    app.renderer.events = new EventSystem(app.renderer);
    containers.playArea.eventMode = "static";
    containers.playArea.hitArea = app.screen;

    containers.playArea.on("pointerover", (event) => {
        mouseOver = true;
        containers.playArea.cursor = 'none';
    });
    
    containers.playArea.on("pointerout", (event) => {
        mouseOver = false;
        containers.playArea.cursor = 'auto';
    });

    containers.playArea.on("pointerdown", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;

        mouseX = Math.trunc(event.global.x / matrix.getTileSize()) + Math.floor(brushSize / 2);
        mouseY = Math.trunc(event.global.y / matrix.getTileSize()) + Math.floor(brushSize / 2);
        mouseDown = true;
    
    });

    containers.playArea.on("pointermove", (event) => {
        previouseMouseX = mouseX;
        previouseMouseY = mouseY;

        mouseX = Math.trunc(event.global.x / matrix.getTileSize());
        mouseY = Math.trunc(event.global.y / matrix.getTileSize());

        outline.clear();
        outline = new Graphics().rect(mouseX * tileSize, mouseY * tileSize, tileSize*brushSize, tileSize*brushSize).stroke({ width: 1, color: 0xff0000 });
        outline.pivot.set(0, 0);
        containers.ui.addChild(outline);
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

        outline.clear();
        outline = new Graphics().rect(mouseX * tileSize, mouseY * tileSize, tileSize*brushSize, tileSize*brushSize).stroke({ width: 1, color: 0xff0000 });
        outline.pivot.set(0, 0);
        containers.ui.addChild(outline);

        console.log(brushSize);
    });

    containers.menu.on('pointerover', (event) => {
        containers.playArea.cursor = 'auto';
    });
    

    window.addEventListener('keydown', (event) => {
        if(mouseOver){
            console.log(event.key); 
            if(event.key == ' '){ paused = !paused; }
            else if(event.key == 'r'){ 
                matrix = new Matrix(app, containers); 
                containers.playArea.removeChildren()
                containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height - 200).fill(0x555555));
            }
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

    // Create a Text object to display the FPS
    const fpsText = new Text('FPS: 0', {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
    });
    fpsText.x = 10;
    fpsText.y = 10;
    containers.menu.addChild(fpsText);

    // Add a listener to the ticker to update the FPS display
    let updateFps = true;
    app.ticker.add(() => {
        if(updateFps){
            fpsText.text = `FPS: ${app.ticker.FPS.toFixed(0)}`;
            updateFps = false;
        }else{
            updateFps = true;
        }
        
    });

    function darken(hex, factor) { 
        let r = (hex >> 16) & 0xff;
        let g = (hex >> 8) & 0xff;
        let b = hex & 0xff;

        r = Math.floor(r * factor);
        g = Math.floor(g * factor);
        b = Math.floor(b * factor);

        return (r << 16) | (g << 8) | b;
    }

    function createButton(txt, {bg = 0xae34fa, w = 90, h = 30,  outline = true, outlineColor = 0xffffff, outlineThicknes = 2, txtColor = 0xffffff} = {}){
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
        
        btn.view.on('pointerover', () => {
            if(selectedButton === btn.view || selectedMenuButton === btn.view){
                defaultView.clear().rect(0, 0, w, h).fill(btn.view._SelectedHoverBg).stroke({ width: outlineThicknes, color: outlineColor});
            }else{
                defaultView.clear().rect(0, 0, w, h).fill(btn.view._HoverBg).stroke({ width: outlineThicknes, color: outlineColor});
            }
            
        });

        btn.view.on('pointerout', () => {
            if(selectedButton === btn.view  || selectedMenuButton === btn.view){
                defaultView.clear().rect(0, 0, w, h).fill(btn.view._SelectedBg).stroke({ width: outlineThicknes, color: outlineColor});
            }else{
                defaultView.clear().rect(0, 0, w, h).fill(bg).stroke({ width: outlineThicknes, color: outlineColor});
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
        let buttonY = 100;
        let buttonIndent = 50;
        let buttonSpacing = 127;
        


        createButtons(buttonY, buttonSpacing, buttonIndent);

        //allButtons["staticSolidsButtons"]["stoneBtn"].visible = false;
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

    function createButtons(buttonY, buttonSpacing, buttonIndent){


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
                eraserBtn: createButton("Eraser", {bg: 0xFF5CFA}).view.on('pointerdown', (e) => { selectedParticle = null; changeSelectedButton(e.currentTarget); }),
            },
        };


        selectedButton = allParticleButtons.solidsMenu.sandBtn;
        changeSelectedButton(selectedButton);

        selectedMenuButton = allMenuButtons.menuSelectButtons.solidsSelect;
        changeSelectedMenuButton(selectedMenuButton);

        let menuButtonOffset = 0;

        for(let btns in allMenuButtons){
            let menu = btns;
            btns = allMenuButtons[menu];
            
            let btnX = buttonIndent;
            let btnY = 50;
            let row = 0;
            let rowSpacing = 5;

            for(let btn in btns){

                if(btnX + btns[btn]._w >= app.screen.width){
                    row++;
                    btnX = buttonIndent;
                    btnY = btnY + btns[btn]._h + rowSpacing;
                    menuButtonOffset = menuButtonOffset + btns[btn]._h

                    if(btnY + containers.menu.y + btns[btn].y + menuButtonOffset + 50 + btns[btn]._h >= app.screen.height){
                        app.renderer.resize( app.screen.width, btnY + containers.menu.y + btns[btn].y + menuButtonOffset + 100);
                        matrix = new Matrix(app, containers); 
                        containers.playArea.removeChildren()
                        containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height - 200).fill(0x555555));
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
            let btnY = 100 +menuButtonOffset;
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

    /*window.addEventListener('resize', () => {
        console.log('Resized!');

        let newWidth = window.innerWidth < maxWidth ? window.innerWidth : maxWidth;
        let newHegiht = window.innerHeight < maxHeight ? window.innerHeight : maxHeight;

        app.renderer.resize( newWidth, newHegiht);

        containers.playArea.width = newWidth;
        matrix = new Matrix(app, containers)
        containers.menu.width = newWidth;

    })*/

    /*window.onload = function () {
        if( detectMob() ) {
            console.log("Mobile");
            containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height - 200).fill(0xffffff)); 
            document.getElementById("pixi-wrapper").style.marginTop = "0px";
        }

    }*/

    /*function detectMob() {
        const toMatch = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i
        ];

        return toMatch.some((toMatchItem) => {
            return navigator.userAgent.match(toMatchItem);
        });
    }

    // Disable scrolling when hovering over canvas for everything but mobile users
    const elem = document.getElementById('pixi-wrapper');

    elem.addEventListener('mouseover', () => {
        if( ! detectMob() ){
            document.body.style.overflow = 'hidden';
            
        }else { }
    });

    elem.addEventListener('mouseout', () => {
        if( ! detectMob() ){ document.body.style.overflow = ''; } // Resets to default (e.g., auto or initial)
    });*/

    const elem = document.getElementById('pixi');

    elem.addEventListener('mouseover', () => {
        document.body.style.overflow = 'hidden';
    });

    elem.addEventListener('mouseout', () => {
        document.body.style.overflow = ''; 
    })

})();

