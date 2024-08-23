export default class Food {
    constructor(x ,y) {
        this.cellSize = 20,
        this.gameWidth = 1000,
        this.gameHeight = 600,
        this.x = Math.floor((Math.random() * (this.gameWidth) / this.cellSize)),
        this.y = Math.floor((Math.random() * (this.gameHeight) / this.cellSize))
    }
}