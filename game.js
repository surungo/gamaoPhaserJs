// Configuração do jogo Phaser
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#d2b48c', // cor de fundo tipo madeira
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    // Aqui você pode carregar imagens personalizadas
    this.load.image('piece_white', 'https://i.imgur.com/6o5Zf7m.png');
    this.load.image('piece_black', 'https://i.imgur.com/6o5Zf7m.png');
}

function create() {
    // Desenha o tabuleiro básico
    drawBoard(this);

    // Adiciona peças iniciais (exemplo simplificado)
    this.pieces = [];

    for (let i = 0; i < 15; i++) {
        let piece = this.add.image(100, 100 + i * 5, 'piece_white').setScale(0.5);
        this.pieces.push(piece);
    }

    for (let i = 0; i < 15; i++) {
        let piece = this.add.image(700, 500 - i * 5, 'piece_black').setScale(0.5).setTint(0x000000);
        this.pieces.push(piece);
    }

    // Habilita interação
    this.input.setDraggable(this.pieces);

    this.input.on('dragstart', (pointer, gameObject) => {
        gameObject.setScale(0.55);
    });

    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });

    this.input.on('dragend', (pointer, gameObject) => {
        gameObject.setScale(0.5);
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
    graphics.strokeRect(50, 50, 700, 500);

    // Desenha divisões (triângulos do gamão)
    const triangleWidth = 700 / 12;
    for (let i = 0; i < 12; i++) {
        let x = 50 + i * triangleWidth;
        let color = (i % 2 === 0) ? 0x8b4513 : 0xf5deb3;
        graphics.fillStyle(color, 1);

        // Triângulo superior
        graphics.beginPath();
        graphics.moveTo(x, 50);
        graphics.lineTo(x + triangleWidth, 50);
        graphics.lineTo(x + triangleWidth / 2, 200);
        graphics.closePath();
        graphics.fillPath();

        // Triângulo inferior
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(x, 550);
        graphics.lineTo(x + triangleWidth, 550);
        graphics.lineTo(x + triangleWidth / 2, 400);
        graphics.closePath();
        graphics.fillPath();
    }
}