
import Matrix from './matrix.js' ;

import { Sand, Dirt, Stone, Water, Ash, Bedrock, Obsidian, Ice, Wood, Tnt, Steam, Fire, 
    SandSpawner, DirtSpawner, AshSpawner, WaterSpawner, SteamSpawner, FireSpawner } from "./particles/particles.js";

import { Button } from "https://cdn.jsdelivr.net/npm/@pixi/ui@2.3.2/+esm";

const { Application, EventSystem, Text, Container, Graphics  } = PIXI;


let maxWidth = 1500;
let maxHeight = 700;

let mouseDown = false;
let mouseX = null;
let mouseY = null;

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

    const containers = {
        playArea: new Container(),
        menu: new Container(),
        ui: new Container(),
    };

    containers.menu.x = 0;
    containers.menu.y = app.screen.height - 200;

    addToStage(containers.playArea, containers.menu, containers.ui);

    // set background color and size of container
    containers.playArea.addChild(new Graphics().rect(0, 0, app.screen.width, app.screen.height - 200).fill(0x555555));
    containers.menu.addChild(new Graphics().rect(0, 0, app.screen.width, 300).fill(0x333333))

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

        mouseX = Math.trunc(event.global.x / matrix.getTileSize());
        mouseY = Math.trunc(event.global.y / matrix.getTileSize());
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

    function createButton(txt, w = 125, h = 40, bg = 0x999999, outline = true, outlineColor = 0xffffff, outlineThicknes = 2, txtColor = 0xffffff){
        const defaultView = new Graphics()
            .rect(0, 0, w, h)
            .fill(bg)
            .stroke({ width: outlineThicknes, color: outlineColor});

        const btn = new Button(defaultView);
        
        btn.view._w = w;
        btn.view._h = h;
        
        btn.view.on('pointerover', () => {
            if(selectedButton === btn.view || selectedMenuButton === btn.view){
                defaultView.clear().rect(0, 0, w, h).fill(0x222222).stroke({ width: outlineThicknes, color: outlineColor});
            }else{
                defaultView.clear().rect(0, 0, w, h).fill(0x666666).stroke({ width: outlineThicknes, color: outlineColor});
            }
            
        });

        btn.view.on('pointerout', () => {
            if(selectedButton === btn.view  || selectedMenuButton === btn.view){
                defaultView.clear().rect(0, 0, w, h).fill(0x000000).stroke({ width: outlineThicknes, color: outlineColor});
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
                .fill(0x999999)
                .stroke({ width: 2, color: 0xffffff });
        }

        selectedButton = btn;

        selectedButton.clear()
            .rect(0, 0, selectedButton._w, selectedButton._h)
            .fill(0x000000)
            .stroke({ width: 2, color: 0xffffff });
    }

    function changeSelectedMenuButton(btn) {
        if (selectedMenuButton) {
            selectedMenuButton.clear()
                .rect(0, 0, selectedMenuButton._w, selectedMenuButton._h)
                .fill(0x999999)
                .stroke({ width: 2, color: 0xffffff });
        }

        selectedMenuButton = btn;

        selectedMenuButton.clear()
            .rect(0, 0, selectedMenuButton._w, selectedMenuButton._h)
            .fill(0x000000)
            .stroke({ width: 2, color: 0xffffff });
    }

    function createButtons(buttonY, buttonSpacing, buttonIndent){

        allMenuButtons = {
            menuSelectButtons: {
                solidsSelect: createButton("Solids", 150, 45).view.on('pointerdown', (e) => { selectedMenu = "solidsMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
                liquidsSelect: createButton("Liquids", 150, 45).view.on('pointerdown', (e) => { selectedMenu = "liquidsMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
                gasesSelect: createButton("Gases", 150, 45).view.on('pointerdown', (e) => { selectedMenu = "gasesMenu"; updateMenu(); }),
                spawnersSelect: createButton("Spawners", 150, 45).view.on('pointerdown', (e) => { selectedMenu = "spawnersMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
                miscSelect: createButton("Misc", 150, 45).view.on('pointerdown', (e) => { selectedMenu = "miscMenu"; updateMenu(); changeSelectedMenuButton(e.currentTarget); }),
            }
        };

        allParticleButtons = {
            solidsMenu: {
                stoneBtn: createButton("Stone").view.on('pointerdown', (e) => { selectedParticle = Stone; changeSelectedButton(e.currentTarget); }),
                sandBtn: createButton("Sand").view.on('pointerdown', (e) => { selectedParticle = Sand; changeSelectedButton(e.currentTarget); }),
                dirtBtn: createButton("Dirt").view.on('pointerdown', (e) => { selectedParticle = Dirt; changeSelectedButton(e.currentTarget); }),
                ashBtn: createButton("Ash").view.on('pointerdown', (e) => { selectedParticle = Ash; changeSelectedButton(e.currentTarget); }),
                bedrockBtn: createButton("Bedrock").view.on('pointerdown', (e) => { selectedParticle = Bedrock; changeSelectedButton(e.currentTarget); }),
                iceBtn: createButton("Ice").view.on('pointerdown', (e) => { selectedParticle = Ice; changeSelectedButton(e.currentTarget); }),
                obsidianBtn: createButton("Obsidian").view.on('pointerdown', (e) => { selectedParticle = Obsidian; changeSelectedButton(e.currentTarget); }),
                tntBtn: createButton("Tnt").view.on('pointerdown', (e) => { selectedParticle = Tnt; changeSelectedButton(e.currentTarget); }),
                woodBtn: createButton("Wood").view.on('pointerdown', (e) => { selectedParticle = Wood; changeSelectedButton(e.currentTarget); }),
            },
            liquidsMenu: {
                waterBtn: createButton("Water").view.on('pointerdown', (e) => { selectedParticle = Water; changeSelectedButton(e.currentTarget); }),
            },
            gasesMenu: {
                steamBtn: createButton("Steam").view.on('pointerdown', (e) => { selectedParticle = Steam; changeSelectedButton(e.currentTarget); }),
                fireBtn: createButton("Fire").view.on('pointerdown', (e) => { selectedParticle = Fire; changeSelectedButton(e.currentTarget); }),
            },
            spawnersMenu: {
                sandSpawnerBtn: createButton("Sand Spawner", 150).view.on('pointerdown', (e) => { selectedParticle = SandSpawner; changeSelectedButton(e.currentTarget); }),
                dirtSpawnerBtn: createButton("Dirt Spawner", 150).view.on('pointerdown', (e) => { selectedParticle = DirtSpawner; changeSelectedButton(e.currentTarget); }),
                ashSpawnerBtn: createButton("Ash Spawner", 150).view.on('pointerdown', (e) => { selectedParticle = AshSpawner; changeSelectedButton(e.currentTarget); }),
                waterSpawnerBtn: createButton("Water Spawner", 150).view.on('pointerdown', (e) => { selectedParticle = WaterSpawner; changeSelectedButton(e.currentTarget); }),
                steamSpawnerBtn: createButton("Steam Spawner", 150).view.on('pointerdown', (e) => { selectedParticle = SteamSpawner; changeSelectedButton(e.currentTarget); }),
                fireSpawnerBtn: createButton("Fire Spawner", 150).view.on('pointerdown', (e) => { selectedParticle = FireSpawner; changeSelectedButton(e.currentTarget); }),
            },
            miscMenu: {
                eraserBtn: createButton("Eraser").view.on('pointerdown', (e) => { selectedParticle = null; changeSelectedButton(e.currentTarget); }),
            },
        };


        selectedButton = allParticleButtons.solidsMenu.sandBtn;
        changeSelectedButton(selectedButton);

        selectedMenuButton = allMenuButtons.menuSelectButtons.solidsSelect;
        changeSelectedMenuButton(selectedMenuButton);

        for(let btns in allParticleButtons){

            let menu = btns;
            btns = allParticleButtons[btns];
            let i = 0;
  
            for(let btn in btns){

                let btnPos = btns[btn].width*i + buttonIndent;
                let row = 1;

                if(btnPos + btns[btn].width >= app.screen.width){
                    i = 0;
                    row++;

                    buttonY = (buttonY * row) + buttonIndent/2;
                    btnPos = buttonSpacing*i + buttonIndent;
                }
                
                if(i == 0){ btns[btn].position.set(buttonIndent, buttonY); }
                else{
                    btns[btn].position.set(btnPos, buttonY);
                }

                containers.menu.addChild(btns[btn]);
        
                btns[btn].interactive = selectedMenu === menu;
                btns[btn].buttonMode = selectedMenu === menu;
                btns[btn].visible = selectedMenu === menu;

                i++;
            }
            
        }

        let menuY = buttonY / 2;
        buttonSpacing = 152

        for(let btns in allMenuButtons){

            btns = allMenuButtons[btns];
            let i = 0;

            for(let btn in btns){

                let btnPos = btns[btn].width*i + buttonIndent;
                let row = 0;

                if(btnPos + btns[btn].width >= app.screen.width){
                    i = 0;
                    row++;

                    buttonY = (buttonY * row) + buttonIndent/2;
                    btnPos = btns[btn].width*i + buttonIndent;
                }
                
               
                btns[btn].position.set(btnPos, menuY);
                

                containers.menu.addChild(btns[btn]);

                i++;
            }
        }

        return allParticleButtons;

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

