// Configuração do jogo Phaser
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1200;
const MARGIM_TOP = 20;
const MARGIM_RIGHT = 40;
const MARGIM_DOWN = 60;
const MARGIM_LEFT = 80;
const BOX_WIDTH = CANVAS_WIDTH - MARGIM_LEFT - MARGIM_RIGHT;
const CENTER_SPACE = 40;
const BOX_HEIGHT=(CANVAS_HEIGHT - MARGIM_TOP - MARGIM_DOWN)/2;
const BOX_TOP=MARGIM_TOP + BOX_HEIGHT;
const ESCALE_WHITE=0.03;
const QTD_TRIANGLE=12;
const TRIANGLE_HEIGHT = (BOX_HEIGHT*2) / QTD_TRIANGLE;
const PIECE_SIZE = 62;

const config = {
    type: Phaser.AUTO,
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
    
    // Desenha o tabuleiro básico
    drawBoard(this);

    // Adiciona peças iniciais (exemplo simplificado)
    this.pieces = [];
    let deep =1;
    let x = 0;
    let y = 0;
    let PIECE_START_LEFT=(MARGIM_LEFT+(PIECE_SIZE/2));
    let PIECE_START_RIGHT=(MARGIM_LEFT+BOX_WIDTH-(PIECE_SIZE/2));
    let PIECE_START_DOWN=(CANVAS_HEIGHT-MARGIM_DOWN-(TRIANGLE_HEIGHT/2));
    let PIECE_SPACE=TRIANGLE_HEIGHT;
    
    for (let i = 0; i < 15; i++) {
        deep++;
        let piece = this.add.image( 
            PIECE_START_LEFT + x * PIECE_SIZE ,
            PIECE_START_DOWN - y * PIECE_SPACE ,
            'piece_white')
            .setScale(ESCALE_WHITE)
            .setInteractive()
            .setDepth(deep);
        this.pieces.push(piece);
        
        deep++;
        piece = this.add.image( 
            PIECE_START_RIGHT - x * PIECE_SIZE ,
            PIECE_START_DOWN - y * PIECE_SPACE, 
            'piece_black')
            .setScale(ESCALE_WHITE)
            .setInteractive()
            .setDepth(deep);
        this.pieces.push(piece);
        x++;
        if(x>4){
            x=0;
            y++;
        }
    }

    // Habilita interação
    this.input.setDraggable(this.pieces);
    this.input.on('dragstart', (pointer, gameObject) => {
        gameObject;//.setScale(escalaWhite);
    });
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });
    this.input.on('dragend', (pointer, gameObject) => {
        deep++;
        gameObject.setDepth(deep);//.setScale(escalaWhite);
        // Aqui você pode implementar regras de posicionamento
    });
}

function update() {
    // Atualizações do jogo
}

function drawBoard(scene) {
    const graphics = scene.add.graphics();
    graphics.lineStyle(2, 0x000000, 1);

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
        x = (BOX_WIDTH/2+MARGIM_LEFT)-(CENTER_SPACE/2);
        graphics.lineTo(x, y + TRIANGLE_HEIGHT / 2);
        graphics.closePath();
        graphics.fillPath();

        x = BOX_WIDTH+MARGIM_LEFT;
        // Triângulo inferior
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x,y + TRIANGLE_HEIGHT);
        x = (x/2)+(CENTER_SPACE/2);
        graphics.lineTo(x,y + TRIANGLE_HEIGHT / 2);
        graphics.closePath();
        graphics.fillPath();
    }
}