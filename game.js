// Variáveis de controle do ambiente 3D
let scene3d, camera3d, renderer3d;
let isDiceRolling = false;
let gravity = -0.3;
let bounceCount = 0;

let diceMeshA, diceMeshB; // Agora temos dois objetos
let bounceCountA = 0,
    bounceCountB = 0;

// Velocidades e rotações independentes para cada dado
let diceVelocityA = { y: 0, rX: 0, rY: 0, rZ: 0 };
let diceVelocityB = { y: 0, rX: 0, rY: 0, rZ: 0 };
let targetRotationA = { x: 0, y: 0, z: 0 };
let targetRotationB = { x: 0, y: 0, z: 0 };
// Adicione isto nas variáveis globais (no topo do script)
let finalXA = -0.4,
    finalZA = -1.2;
let finalXB = 0.4,
    finalZB = -1.2;


// Rotas exatas para as faces do dado apontarem para a camera
const diceFacesRotations = {
    5: { x: 0, y: 0, z: 0 },
    6: { x: Math.PI, y: 0, z: 0 },
    4: { x: -Math.PI / 2, y: 0, z: 0 },
    3: { x: Math.PI / 2, y: 0, z: 0 },
    1: { x: 0, y: -Math.PI / 2, z: 0 },
    2: { x: 0, y: Math.PI / 2, z: 0 }
};


// 1. CONFIGURAÇÃO DO THREE.JS (DADO)
function initThreeDice() {
    const container = document.getElementById('three-container');
    scene3d = new THREE.Scene();

    camera3d = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera3d.position.set(0, 0, 8);
    camera3d.lookAt(0, 0, -0.8);
    
    renderer3d = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer3d.domElement.style.position = 'absolute';
    container.appendChild(renderer3d.domElement);
    resizeThreeDice();
    window.addEventListener('resize', resizeThreeDice);
    
    // Gerando materiais (faces) compartilhados para os dois dados
    const materials = [];
    for (let i = 1; i <= 6; i++) {
        materials.push(new THREE.MeshStandardMaterial({
            map: createDiceTexture(i), // Usa a mesma função geradora de bolinhas
            roughness: 0.2,
            metalness: 0.1,
            transparent: true, // <--- ADICIONE ESSA LINHA PARA PERMITIR TRANSPARÊNCIA
            opacity: 0.0
        }));
    }
    
    const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4); // Dados levemente menores para caberem juntos
    
    // Criando o Dado A
    diceMeshA = new THREE.Mesh(geometry, materials);
    diceMeshA.position.set(-10, 0, -10); // Escondido
    scene3d.add(diceMeshA);
    
    // Criando o Dado B
    diceMeshB = new THREE.Mesh(geometry, materials);
    diceMeshB.position.set(10, 0, -10); // Escondido
    scene3d.add(diceMeshB);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene3d.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(2, 4, 6);
    scene3d.add(dirLight);
    
    animateThreeLoop();
}

function resizeThreeDice() {
    if (!renderer3d || !camera3d) return;

    const phaserCanvas = document.querySelector('#phaser-container canvas');
    const bounds = phaserCanvas
        ? phaserCanvas.getBoundingClientRect()
        : document.getElementById('three-container').getBoundingClientRect();

    renderer3d.setSize(bounds.width, bounds.height, false);
    renderer3d.domElement.style.left = `${bounds.left}px`;
    renderer3d.domElement.style.top = `${bounds.top}px`;
    renderer3d.domElement.style.width = `${bounds.width}px`;
    renderer3d.domElement.style.height = `${bounds.height}px`;
    camera3d.aspect = bounds.width / bounds.height;
    camera3d.updateProjectionMatrix();
}


// Desenha os pontos pretos do dado em um canvas para servir de textura
function createDiceTexture(number) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(4, 4, 120, 120);
    
    ctx.fillStyle = '#0f172a';
    const center = 64,
        p1 = 32,
        p3 = 96;
    
    const dots = {
        1: [
            [center, center]
        ],
        2: [
            [p1, p1],
            [p3, p3]
        ],
        3: [
            [p1, p1],
            [center, center],
            [p3, p3]
        ],
        4: [
            [p1, p1],
            [p1, p3],
            [p3, p1],
            [p3, p3]
        ],
        5: [
            [p1, p1],
            [p1, p3],
            [center, center],
            [p3, p1],
            [p3, p3]
        ],
        6: [
            [p1, p1],
            [p1, center],
            [p1, p3],
            [p3, p1],
            [p3, center],
            [p3, p3]
        ]
    };
    
    dots[number].forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot[0], dot[1], 10, 0, Math.PI * 2);
        ctx.fill();
    });
    
    return new THREE.CanvasTexture(canvas);
}

function setDiceOpacity(value) {
    // Como o dado possui múltiplos materiais (um para cada face), precisamos rodar um loop em cada um
    if (diceMeshA && diceMeshB) {
        diceMeshA.material.forEach(mat => mat.opacity = value);
        diceMeshB.material.forEach(mat => mat.opacity = value);
    }
}

// Função de disparo ativada pelo clique no Phaser
function throwDice(valA, valB) {
    if (isDiceRolling) return;

    isDiceRolling = true;
    bounceCountA = 0;
    bounceCountB = 0;

    // 1. Sorteia a posição final horizontal (X) e profundidade (Z) para onde eles vão cair
    finalXA = -0.4 + (Math.random() * 0.4 - 0.2); 
    finalXB = 0.4 + (Math.random() * 0.4 - 0.2);
    
    // Mantemos o Z perto de -0.4 para que eles fiquem um pouco abaixo do centro, 
    // mas não tão distantes a ponto de sumirem ou encolherem demais
    finalZA = -0.5 + (Math.random() * 0.3 - 0.15);
    finalZB = -0.5 + (Math.random() * 0.3 - 0.15);

    // 2. Coloca os dados exatamente ACIMA da sua posição final (Alinhando o X e Z na largada)
    // O dado já nasce na rota certa, apenas mudando a altura (Y = 3.5)
    diceMeshA.position.set(finalXA, 3.5, finalZA); 
    diceMeshB.position.set(finalXB, 3.5, finalZB); 
    
    // 3. Forças físicas verticais e de rotação caótica
    diceVelocityA.y = -0.15;
    diceVelocityA.rX = Math.random() * 0.4 + 0.2;
    diceVelocityA.rY = Math.random() * 0.4 + 0.2;
    diceVelocityA.rZ = Math.random() * 0.4 + 0.2;

    diceVelocityB.y = -0.15;
    diceVelocityB.rX = Math.random() * 0.4 + 0.2;
    diceVelocityB.rY = Math.random() * 0.4 + 0.2;
    diceVelocityB.rZ = Math.random() * 0.4 + 0.2;

    // Alvos de rotação das faces (mantenha igual)
    targetRotationA = diceFacesRotations[valA];
    targetRotationB = diceFacesRotations[valB];
}

// Loop de atualização do Three.js
function animateThreeLoop() {
    requestAnimationFrame(animateThreeLoop);
    
    if (isDiceRolling) {
        
        // --- ATUALIZA DADO A ---
        diceVelocityA.y += gravity * 0.016;
        diceMeshA.position.y += diceVelocityA.y;
        diceMeshA.rotation.x += diceVelocityA.rX;
        diceMeshA.rotation.y += diceVelocityA.rY;
        diceMeshA.rotation.z += diceVelocityA.rZ;
        
        if (diceMeshA.position.y <= 0 && diceVelocityA.y < 0) {
            if (bounceCountA < 2) {
                diceVelocityA.y = -diceVelocityA.y * 0.4;
                bounceCountA++;
            } else {
                diceMeshA.position.y = 0;
                //diceMeshA.position.x = finalXA;
                //diceMeshA.position.z = finalZA;
                diceMeshA.rotation.set(targetRotationA.x, targetRotationA.y, targetRotationA.z);
            }
        }
        
        // --- ATUALIZA DADO B ---
        diceVelocityB.y += gravity * 0.016;
        diceMeshB.position.y += diceVelocityB.y;
        diceMeshB.rotation.x += diceVelocityB.rX;
        diceMeshB.rotation.y += diceVelocityB.rY;
        diceMeshB.rotation.z += diceVelocityB.rZ;
        
        if (diceMeshB.position.y <= 0 && diceVelocityB.y < 0) {
            if (bounceCountB < 2) {
                diceVelocityB.y = -diceVelocityB.y * 0.4;
                bounceCountB++;
            } else {
                diceMeshB.position.y = 0;
                //diceMeshB.position.x = finalZB;
               // diceMeshB.position.z = finalZB;
                diceMeshB.rotation.set(targetRotationB.x, targetRotationB.y, targetRotationB.z);
            }
        }
        
        // Se ambos pararem no chão, desliga o estado de rolagem
        if (diceMeshA.position.y === 0 && diceMeshB.position.y === 0) {
            isDiceRolling = false;
        }
    }
    
    renderer3d.render(scene3d, camera3d);
}



// Configuração do jogo Phaser
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1200;
const MARGIM_TOP = 90;
const MARGIM_RIGHT = 60;
const MARGIM_DOWN = 20;
const MARGIM_LEFT = 60;
const BOX_WIDTH = CANVAS_WIDTH - MARGIM_LEFT - MARGIM_RIGHT;
const CENTER_SPACE = 24;
const BOX_HEIGHT = (CANVAS_HEIGHT - MARGIM_TOP - MARGIM_DOWN) / 2;
const BOX_TOP = MARGIM_TOP + BOX_HEIGHT;
const ESCALE_WHITE = 0.03;
const QTD_TRIANGLE = 12;
const TRIANGLE_HEIGHT = (BOX_HEIGHT * 2) / QTD_TRIANGLE;
const PIECE_SIZE = 62;

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-container',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#d2b48c', // cor de fundo tipo madeira
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);

function preload() {
    // Aqui você pode carregar imagens personalizadas
    this.load.image('piece_white', 'bb.png');
    this.load.image('piece_black', 'bp.png');
}

function create() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Desenha o tabuleiro básico
    drawBoard(this);
    
    // Adiciona peças iniciais (exemplo simplificado)
    this.pieces = [];
    let deep = 1;
    let x = 0;
    let y = 0;
    let PIECE_START_LEFT = (MARGIM_LEFT + (PIECE_SIZE / 2));
    let PIECE_START_RIGHT = (MARGIM_LEFT + BOX_WIDTH - (PIECE_SIZE / 2));
    let PIECE_START_DOWN = (CANVAS_HEIGHT - MARGIM_DOWN - (TRIANGLE_HEIGHT / 2));
    let PIECE_SPACE = TRIANGLE_HEIGHT;
    let PIECE_LEFT = 'piece_white';
    let PIECE_RIGHT = 'piece_black';
    for (let i = 0; i < 15; i++) {
        deep++;
        let piece = this.add.image(
                PIECE_START_LEFT + x * PIECE_SIZE,
                PIECE_START_DOWN - y * PIECE_SPACE,
                PIECE_LEFT)
            .setScale(ESCALE_WHITE)
            .setInteractive()
            .setDepth(deep);
        this.pieces.push(piece);
        
        deep++;
        piece = this.add.image(
                PIECE_START_RIGHT - x * PIECE_SIZE,
                PIECE_START_DOWN - y * PIECE_SPACE,
                PIECE_RIGHT)
            .setScale(ESCALE_WHITE)
            .setInteractive()
            .setDepth(deep);
        this.pieces.push(piece);
        x++;
        if (i == 4) {
            x = 0;
            y = 4;
            PIECE_LEFT = 'piece_black';
            PIECE_RIGHT = 'piece_white';
            
        }
        if (i == 7) {
            x = 0;
            y = 6;
        }
        if (i == 12) {
            x = 0;
            y = 11;
            PIECE_LEFT = 'piece_white';
            PIECE_RIGHT = 'piece_black';
        }
    }
    
    // Habilita interação
    this.input.setDraggable(this.pieces);
    this.input.on('dragstart', (pointer, gameObject) => {
        gameObject; //.setScale(escalaWhite);
    });
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });
    this.input.on('dragend', (pointer, gameObject) => {
        deep++;
        gameObject.setDepth(deep); //.setScale(escalaWhite);
        // Aqui você pode implementar regras de posicionamento
    });
    
    // Adicione isso dentro do create() da sua cena do Phaser:
    this.input.on('pointerdown', (pointer) => {
        // Se os dados não estiverem rolando no momento, diminui a opacidade para 0.2 (20%)
        if (!isDiceRolling) {
            setDiceOpacity(0.6);
        }
    });  
    
}

function update() {
    // Atualizações do jogo
    
}

function drawBoard(scene) {
    const graphics = scene.add.graphics();
    graphics.lineStyle(2, 0x000000, 1);
    
    graphics.strokeRect(
        MARGIM_LEFT,
        10,
        (BOX_WIDTH / 2),
        75);
    graphics.strokeRect(
        MARGIM_LEFT + (BOX_WIDTH / 2),
        10,
        (BOX_WIDTH / 2),
        75);
    
    // Desenha retângulo do tabuleiro
    graphics.strokeRect(MARGIM_LEFT, MARGIM_TOP, BOX_WIDTH, BOX_HEIGHT);
    
    graphics.strokeRect(MARGIM_LEFT, BOX_TOP, BOX_WIDTH, BOX_HEIGHT);
    
    // Desenha divisões (triângulos do gamão)
    
    for (let i = 0; i < 12; i++) {
        let y = MARGIM_TOP + i * TRIANGLE_HEIGHT;
        let color = (i % 2 === 0) ? 0x8b4513 : 0xf5deb3;
        graphics.fillStyle(color, 1);
        let x = MARGIM_LEFT;
        
        // Triângulo superior
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x, y + TRIANGLE_HEIGHT);
        x = (BOX_WIDTH / 2 + MARGIM_LEFT) - (CENTER_SPACE / 2);
        graphics.lineTo(x, y + TRIANGLE_HEIGHT / 2);
        graphics.closePath();
        graphics.fillPath();
        
        x = BOX_WIDTH + MARGIM_LEFT;
        // Triângulo inferior
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x, y + TRIANGLE_HEIGHT);
        x = (x / 2) + (CENTER_SPACE * 2);
        graphics.lineTo(x, y + TRIANGLE_HEIGHT / 2);
        graphics.closePath();
        graphics.fillPath();
    }
        
    // 1. Cria a forma visual do botão (um retângulo cinza escuro arredondado)
    //let botaoDados = this.add.graphics();
    let heightBotaoLancar = 30;
    let widthBotaoLancar = 130
    let xBotaoLancar = MARGIM_LEFT + (BOX_WIDTH / 2) - (widthBotaoLancar / 2);
    let yBotaoLancar = MARGIM_TOP + 5;
    graphics.fillStyle(0x1e293b, 1); // Cor ardósia escura
    graphics.fillRoundedRect(xBotaoLancar, yBotaoLancar, widthBotaoLancar, heightBotaoLancar, 8); // Posição X, Y, Largura, Altura, Arredondamento
    graphics.lineStyle(2, 0x3b82f6, 1); // Borda azul brilhante
    graphics.strokeRoundedRect(xBotaoLancar, yBotaoLancar, widthBotaoLancar, heightBotaoLancar, 8);
    
    // 2. Adiciona o texto descritivo centralizado no botão
    scene.add.text(xBotaoLancar + 15, yBotaoLancar + 11, 'LANÇAR DADOS', {
        fontSize: '13px',
        fontWeight: 'bold',
        fill: '#f8fafc',
        fontFamily: 'sans-serif'
    })
    //this.resultText = this.add.text(window.innerWidth - 180, 20, 'Dados: -', { fontSize: '18px', fill: '#ffffff', fontWeight: 'bold', fontFamily: 'sans-serif'});
    
    // 3. Cria uma Zona Interativa invisível exatamente em cima do desenho do botão
    let zonaInterativaBotao = scene.add.zone(xBotaoLancar, yBotaoLancar, widthBotaoLancar, heightBotaoLancar)
        .setOrigin(0)
        .setInteractive();
    
    // 4. Executa o lançamento dos dados APENAS quando esta zona for clicada/tocada
    zonaInterativaBotao.on('pointerdown', (pointer) => {
        if (!isDiceRolling) {
            setDiceOpacity(1);
            
            // Sorteia os dois dados independentes
            const resultadoA = Phaser.Math.Between(1, 6);
            const resultadoB = Phaser.Math.Between(1, 6);
            
            // Atualiza o texto do resultado (ajuste a variável se o seu nome for diferente)
            if (scene.resultText) {
                scene.resultText.setText('Dados: ' + resultadoA + ' e ' + resultadoB);
            }
            
            // Dispara a animação 3D no Three.js
            throwDice(resultadoA, resultadoB);
        }
    });
  
    //window.onload = () => {
    initThreeDice();
    //  };
}