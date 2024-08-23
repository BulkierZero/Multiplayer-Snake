export default class Player {
    constructor(x, y) {
        this.cellSize = 20;
        this.x = x;
        this.y = y;
        this.direction = '';
        this.previousDirection = '';
        this.body = [[x, y]];
    }
}
