class Enemy {
    constructor(x, y, size) {
        this.position = new p5.Vector(x, y);
        this.velocity = new p5.Vector(Math.random(), Math.random());
        this.velocity.mult(3);
        this.radius = size;
        this.m = this.radius * 0.1;
    }

    update() {
        this.position.add(this.velocity);
    }

    checkBoundaryCollision() {
        if (this.position.x > width - this.radius) {
            this.position.x = width - this.radius;
            this.velocity.x *= - 1;
        } else if (this.position.x < this.radius) {
            this.position.x = this.radius;
            this.velocity.x *= -1;
        } else if (this.position.y > height - this.radius) {
            this.position.y = height - this.radius;
            this.velocity.y *= -1;
        } else if (this.position.y < this.radius) {
            this.position.y = this.radius;
            this.velocity.y *= -1;
        }
    }
    checkCollision(other) {
        let distanceVect = new p5.Vector.sub(other.position, this.position);
        let distanceVectMag = distanceVect.mag();
        let minDistance = this.radius + other.radius;

        if (distanceVectMag < minDistance) {
            let distanceCorrection = (minDistance - distanceVectMag) / 2;
            let d = distanceVect.copy();
            let correctionVector = d.normalize().mult(distanceCorrection);
            other.position.add(correctionVector);
            this.position.sub(correctionVector);

            let theta = distanceVect.heading();
            let sine = sin(theta);
            let cosine = cos(theta);

            /* bTemp will hold rotated ball positions.
             * You just need to worry about bTemp[1] position
             */
            let bTemp = [new p5.Vector(), new p5.Vector()];
            let vTemp = [new p5.Vector(), new p5.Vector()];
            let vFinal = [new p5.Vector(), new p5.Vector()];
            let bFinal = [new p5.Vector(), new p5.Vector()];

            /* this ball's position is relative to the other
             * so you can use the vector between them (bVect) as the 
             * reference point in the rotation expressions.
             * bTemp[0].position.x and bTemp[0].position.y will initialize
             * automatically to 0.0, which is what you want
             * since b[1] will rotate around b[0]
             */
            bTemp[1].x = cosine * distanceVect.x + sine * distanceVect.y;
            bTemp[1].y = cosine * distanceVect.y - sine * distanceVect.x;

            vTemp[0].x = cosine * this.velocity.x + sine * this.velocity.y;
            vTemp[0].y = cosine * this.velocity.y - sine * this.velocity.x;
            vTemp[1].x = cosine * other.velocity.x + sine * other.velocity.y;
            vTemp[1].y = cosine * other.velocity.y - sine * other.velocity.x;

            /*
             * Now that velocities are rotated, you can use 1D
             * conservation of momentum equations to calculate 
             * the final velocity along the x-axis.
             */
            // final rotated velocity for b[0]
            vFinal[0].x = ((this.m - other.m) * vTemp[0].x + 2 * other.m * vTemp[1].x) / (this.m + other.m);
            vFinal[0].y = vTemp[0].y;

            // final rotated velocity for b[0]
            vFinal[1].x = ((other.m - this.m) * vTemp[1].x + 2 * this.m * vTemp[0].x) / (this.m + other.m);
            vFinal[1].y = vTemp[1].y;

            // hack to avoid clumping
            bTemp[0].x += vFinal[0].x;
            bTemp[1].x += vFinal[1].x;

            /* Rotate ball positions and velocities back
             * Reverse signs in trig expressions to rotate 
             * in the opposite direction
             */
            // rotate balls
            bFinal[0].x = cosine * bTemp[0].x - sine * bTemp[0].y;
            bFinal[0].y = cosine * bTemp[0].y + sine * bTemp[0].x;
            bFinal[1].x = cosine * bTemp[1].x - sine * bTemp[1].y;
            bFinal[1].y = cosine * bTemp[1].y + sine * bTemp[1].x;

            // update balls to screen position
            other.position.x = this.position.x + bFinal[1].x;
            other.position.y = this.position.y + bFinal[1].y;

            this.position.add(bFinal[0]);

            // update velocities
            this.velocity.x = cosine * vFinal[0].x - sine * vFinal[0].y;
            this.velocity.y = cosine * vFinal[0].y + sine * vFinal[0].x;
            other.velocity.x = cosine * vFinal[1].x - sine * vFinal[1].y;
            other.velocity.y = cosine * vFinal[1].y + sine * vFinal[1].x;

        }
    }

    display() {
        noStroke();
        fill(204);
        image(enemyImg, this.position.x, this.position.y, this.radius * 2, this.radius * 2);
    }
}



// DECLARE GAME VARS

let shooting = false;
let bulletPosX, bulletPosY;
let enemies = [];
let enemyShips = [new Enemy(100, 100, 20), new Enemy(500, 200, 20)];
let bulletImg, playerShip, enemyImg;
let bgImage;

console.log(enemyShips[0].checkCollision(enemyShips[1]));

class SpaceShooter {
    Shoot(bulletPositionX, bulletPositionY) {
        let blt = new Enemy(bulletPositionX, bulletPositionY, 10);
        fill(0, 255, 0);
        image(bulletImg, blt.position.x, blt.position.y);
        return blt;
    }
    Init(spaceShipPosX, spaceShipPosY) {
        spaceShipPosX = constrain(spaceShipPosX, 30, width-30);
        spaceShipPosY = constrain(spaceShipPosY, 30, height-30);
        image(playerShip, spaceShipPosX, spaceShipPosY, 60, 60);
    }
}


// GAME INIT
let Player = new SpaceShooter();
let canvas;
let bulletSpeed = 10;

function setup() {
    noStroke();
    canvas = createCanvas(400, 600);
    canvas.parent('gameCanvas');
    bulletImg  = loadImage('../assets/bullet.png');
    playerShip  = loadImage('../assets/ship1.png');
    enemyImg = loadImage('../assets/enemy.png');

    imageMode(CENTER);
}

function draw() {
    background(0);
    Player.Init(mouseX, mouseY);

    let bullet = new SpaceShooter().Shoot(bulletPosX, bulletPosY);
    if (shooting) {
        bulletPosY -= bulletSpeed;
    }
    for (let i = 0; i < enemyShips.length; i++) {
        enemyShips[i].update();
        enemyShips[i].display();
        enemyShips[i].checkBoundaryCollision();
        enemyShips[i].checkCollision(bullet);
    }
}

function mousePressed() {
    if(mouseX <= width && mouseY <= height){
        shooting = true;
        bulletPosX = mouseX;
        bulletPosY = mouseY;
    }
}