
import Matrix from './matrix.js' ;

import { Sand, Dirt, Stone, Water, Ash, Bedrock, Obsidian, Ice, Wood, Tnt, Steam, Fire, 
    SandSpawner, DirtSpawner, AshSpawner, WaterSpawner, SteamSpawner, FireSpawner } from "./particles/particles.js";

//import * as UI from "https://cdn.jsdelivr.net/npm/@pixi/ui@2.3.2/+esm";
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


        if(mouseDown){
            matrix.traverseMatrixAndCreate(previouseMouseX, previouseMouseY, mouseX, mouseY, selectedParticle, brushSize);
        }

        if( !paused ){
            matrix.updateGrid();
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

        btn.view.on('pointerover', () => {
            defaultView.clear().rect(0, 0, w, h).fill(0x666666).stroke({ width: outlineThicknes, color: outlineColor});
        });

        btn.view.on('pointerout', () => {
            defaultView.clear().rect(0, 0, w, h).fill(bg).stroke({ width: outlineThicknes, color: outlineColor});
        });

        btn.view.on('pointerdown', () => {
            defaultView.clear().rect(0, 0, w, h).fill(0x000000).stroke({ width: outlineThicknes, color: outlineColor});
        });

        btn.view.on('pointerup', () => {
            defaultView.clear().rect(0, 0, w, h).fill(bg).stroke({ width: outlineThicknes, color: outlineColor});
        });

        const label = new Text(txt, {
            fontSize: 20,
            fill: txtColor,
        });

        label.anchor.set(0.5);
        label.position.set(w/2, h/2);

        // Add text ON TOP of the button view
        btn.view.addChild(label);
        
        return btn.view;
    }

    function createMenu(){
        let buttonY = 100;
        let buttonIndent = 50;
        let buttonSpacing = 127;
        


        createButtons(buttonY, buttonSpacing, buttonIndent);

        //allButtons["staticSolidsButtons"]["stoneBtn"].visible = false;
    }

    function createButtons(buttonY, buttonSpacing, buttonIndent){

        allMenuButtons = {
            menuSelectButtons: {
                solidsSelect: createButton("Solids", 150, 45).on('pointerdown', () => { selectedMenu = "solidsMenu"; updateMenu(); }),
                liquidsSelect: createButton("Liquids", 150, 45).on('pointerdown', () => { selectedMenu = "liquidsMenu"; updateMenu(); }),
                gasesSelect: createButton("Gases", 150, 45).on('pointerdown', () => { selectedMenu = "gasesMenu"; updateMenu(); }),
                spawnersSelect: createButton("Spawners", 150, 45).on('pointerdown', () => { selectedMenu = "spawnersMenu"; updateMenu(); }),
                miscSelect: createButton("Misc", 150, 45).on('pointerdown', () => { selectedMenu = "miscMenu"; updateMenu(); }),
                
            }
        };

        allParticleButtons = {
            solidsMenu: {
                stoneBtn: createButton("Stone").on('pointerdown', () => { selectedParticle = Stone; }),
                sandBtn: createButton("Sand").on('pointerdown', () => { selectedParticle = Sand; }),
                dirtBtn: createButton("Dirt").on('pointerdown', () => { selectedParticle = Dirt; }),
                ashBtn: createButton("Ash").on('pointerdown', () => { selectedParticle = Ash }),
                bedrockBtn: createButton("Bedrock").on('pointerdown', () => { selectedParticle = Bedrock }),
                iceBtn: createButton("Ice").on('pointerdown', () => { selectedParticle = Ice }),
                obsidianBtn: createButton("Obsidian").on('pointerdown', () => { selectedParticle = Obsidian }),
                tntBtn: createButton("Tnt").on('pointerdown', () => { selectedParticle = Tnt }),
                woodBtn: createButton("Wood").on('pointerdown', () => { selectedParticle = Wood }),
            },
            liquidsMenu: {
                waterBtn: createButton("Water").on('pointerdown', () => { selectedParticle = Water }),
            },
            gasesMenu: {
                steamBtn: createButton("Steam").on('pointerdown', () => { selectedParticle = Steam }),
                fireBtn: createButton("Fire").on('pointerdown', () => { selectedParticle = Fire }),
            },
            spawnersMenu: {
                sandSpawnerBtn: createButton("Sand Spawner", 150).on('pointerdown', () => { selectedParticle = SandSpawner }),
                dirtSpawnerBtn: createButton("Dirt Spawner", 150).on('pointerdown', () => { selectedParticle = DirtSpawner }),
                ashSpawnerBtn: createButton("Ash Spawner", 150).on('pointerdown', () => { selectedParticle = AshSpawner }),
                waterSpawnerBtn: createButton("Water Spawner", 150).on('pointerdown', () => { selectedParticle = WaterSpawner }),
                steamSpawnerBtn: createButton("Steam Spawner", 150).on('pointerdown', () => { selectedParticle = SteamSpawner }),
                fireSpawnerBtn: createButton("Fire Spawner", 150).on('pointerdown', () => { selectedParticle = FireSpawner }),
            },
            miscMenu: {
                eraserBtn: createButton("Eraser").on('pointerdown', () => { selectedParticle = null }),
            },
        };

        
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

