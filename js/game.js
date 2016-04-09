var game = new Phaser.Game(1200,900,Phaser.AUTO,'game',
  {preload:preload,create:create,update:update,render:render});

var block;
var blockCollisionGroup;
var blockVelocity = 30;
var money = 40;
var betMoney = 0;
var prompt;
var blocks;
var constrain = false; 
var gameOver = false;
var showTimer = true;
var goingToCenter = false;
var distanceToCenter;
var timer;
var bet = "none";
var winner = "none";
var bluebutton;
var redbutton;
var greenbutton;
var orangebutton;
var greeting


var textStyle = {
  align: 'center'
};








 var player, //our player
        players = {}, //this will hold the list of players
        sock, //this will be player's ws connection
        label,
        ip = "162.243.216.88"; //ip of our Go server

function preload() {
 
  //Center the game.
  this.game.scale.pageAlignHorizontally = true;this.game.scale.pageAlignVertically = true;this.game.scale.refresh();
  game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
  game.stage.backgroundColor = '#ffffff';
  //game.load.image("background","assets/bg.png");
  game.load.image("blue", "assets/bluesquare.png",72,72);
  game.load.image("red", "assets/redsquare.png",72,72);
  game.load.image("green", "assets/greensquare.png",72,72);
  game.load.image("orange", "assets/orangesquare.png",72,72);

  console.log("%c---Bootin' Bensio---", "color: #fff; background: #b800e6");
}

function create() {
//  socket = io.listen(8000);
  if (localStorage && localStorage.getItem('money')) {
    money = parseInt(localStorage.getItem('money'))
  }
  game.stage.disableVisibilityChange = true; 
  // Add physics
  game.physics.startSystem(Phaser.Physics.P2JS);
  game.physics.p2.setImpactEvents(true);
  blockCollisionGroup = game.physics.p2.createCollisionGroup(); 
  game.physics.p2.updateBoundsCollisionGroup();
  game.physics.p2.damping = 0;
  game.physics.p2.friction = 0;
  game.physics.p2.angularDamping = 0;
  game.physics.p2.restitution = 1;
  blocks = game.add.group();
  blocks.enableBody = true;
  blocks.physicsBodyType = Phaser.Physics.P2JS;
  //create blocks
  blue = blocks.create(200, 150, 'blue');
  red = blocks.create(200, 744, 'red');
  green = blocks.create(1008, 150, 'green');
  orange = blocks.create(1008, 744, 'orange');
  
  
  
  
  sock = new WebSocket("ws://" + ip + ":80/ws");
        sock.onopen = function() {
            var currency = JSON.stringify({
                money: money,
                betMoney: 0
            });
            sock.send(currency);
        };

    sock.onmessage = function(message) {
            var m = JSON.parse(message.data);
            if (m.New) {
                players[m.Id] = greet(m);
                if (localStorage && localStorage.getItem('money')) {
                    players[m.Id].money = parseInt(localStorage.getItem('money'))
                 } else {
                    players[m.Id].money = 40;
                 }
            } else if (m.Online === false) {
                players[m.Id].label.destroy();
                players[m.Id].destroy();
            } else {
                uMoney(m)  
            }
        };

  blocks.forEach(function(block) {
    block.body.setCollisionGroup(blockCollisionGroup);
    block.body.collides(blockCollisionGroup);
    block.body.onBeginContact.add(hitBlock, this);
    //block.anchor.x = 0.5;
    //block.anchor.y = 0.5;
    block.body.friction = 0;
    block.body.angularDamping = 0;
    block.body.mass = 0.1;
    block.body.restitution = 1;
    block.health = 20;
    block.isAlive = true;

  }, this);
  game.time.events.add(Phaser.Timer.SECOND * 10, startGame, this);
  promptBet();
}

function greet(m) {
   var label = m.Id.match(/(^\w*)-/i)[1];


   if (localStorage && localStorage.getItem('money')) {
       money = parseInt(localStorage.getItem('money'))
     } else {
       money = 40;
     }
   game.time.events.add(Phaser.Timer.SECOND * 3, killGreeting, this);
   greeting = game.add.text(game.world.centerX, game.world.centerY + 200, label + " has joined the game with " + money + " Benbux. There are currently " + players.length + " players online.");
   return label;
}

function killGreeting() {
  if (greeting) {
    greeting.destroy();
  }
}


function hitBlock (body,bodyB,shapeA,shapeB,equation) {
  if (body) {
    body.sprite.alpha -= .05;
    body.sprite.health -= 1;
    if (body.sprite.health < 1) {
      body.sprite.destroy();
    }
  } else {
    equation[0].bodyB.parent.sprite.alpha -= .05;
    equation[0].bodyB.parent.sprite.health -= 1;
    if (equation[0].bodyB.parent.sprite.health < 1) {
      equation[0].bodyB.parent.sprite.destroy();
    }
  }
  if (blocks.length === 1 || blocks.length === 0) {
    gameOver = true;
  }
}


function startGame () {
  green.body.velocity.x = game.rnd.integerInRange(-1000,1000);
  orange.body.velocity.x = game.rnd.integerInRange(-1000,1000);
  blue.body.velocity.x = game.rnd.integerInRange(-1000,1000);
  green.body.velocity.y = game.rnd.integerInRange(-1000,1000);
  orange.body.velocity.y = game.rnd.integerInRange(-1000,1000);
  blue.body.velocity.y = game.rnd.integerInRange(-1000,1000);
  red.body.velocity.x = game.rnd.integerInRange(-1000,1000);
  red.body.velocity.y = game.rnd.integerInRange(-1000,1000);
  prompt.destroy();
  redbutton.destroy();
  greenbutton.destroy();
  bluebutton.destroy();
  orangebutton.destroy();
  constrain = true;
  showTimer = false;
}

function constrainVelocity(sprite, maxVelocity) {
  //constraints the block's velocity to a specific number
  var body = sprite.body
  var angle, currVelocitySqr, vx, vy;

  vx = body.data.velocity[0];
  vy = body.data.velocity[1];
  
  currVelocitySqr = vx * vx + vy * vy;
  
  angle = Math.atan2(vy, vx);
    
  vx = Math.cos(angle) * maxVelocity;
  vy = Math.sin(angle) * maxVelocity;
    
  body.data.velocity[0] = vx;
  body.data.velocity[1] = vy;
};

function promptBet() {
  prompt = game.add.text(game.world.centerX, game.world.centerY - 50,
      "\n\n\nPlace your bets!\n\nRed, Green, Blue, or Orange?\n\n10\n\n\n\nYou currently have " + money + " dollars.\n\nYou're betting " + betMoney + " dollars on " + bet + ".");
  prompt.anchor.setTo(0.5, 0.5);
  prompt.font = 'Century Schoolbook';
  prompt.fontSize = 20;
  prompt.align = "center";
 
  redbutton = game.add.button(164, 708, 'red', betOnBlock, {color: "red"});
  greenbutton = game.add.button(972, 114, 'green', betOnBlock, {color: "green"});
  bluebutton = game.add.button(164, 114, 'blue', betOnBlock, {color: "blue"});
  orangebutton = game.add.button(972, 708, 'orange', betOnBlock, {color: "orange"});
};

function betOnBlock() {
  if (bet != "none" && bet != this.color) {
    bet = this.color;
    betMoney = 10;
  } else if (betMoney < money) {
    bet = this.color;
    betMoney += 10;
  }

}


function updateTimer() {
  timeLeft = Math.floor(game.time.events.duration / 1000) + 1;
  prompt.setText("\n\n\nPlace your bets!\n\nRed, Green, Blue, or Orange?\n\n" + timeLeft + "\n\n\n\nYou currently have " + money + " dollars.\n\nYou're betting " + betMoney + " dollars on " + bet + "."); 
};

function showResults(result) {
  gameOver = false;
  constrain = false;
  showTimer = false;
  if (result && result === "tie") {
    prompt = game.add.text(game.world.centerX, game.world.centerY - 50,
            "Looks like no one is the winner, whoops! No payout!");
    timer = game.time.events.add(Phaser.Timer.SECOND * 3, resetGame, this);
    winner = "none";
    betMoney = 0;
  } else {
    blocks.children[0].body.data.velocity[0] = 0;
    blocks.children[0].body.data.velocity[1] = 0;
    blocks.children[0].body.angularDamping = .3;
    accelerateToCenter(blocks.children[0], 1000);
    goingToCenter = true;
    prompt = game.add.text(game.world.centerX, game.world.centerY - 50,
            blocks.children[0].key.capitalizeFirstLetter() + " is the winner!");
    timer = game.time.events.add(Phaser.Timer.SECOND * 10, resetGame, this);
    winner = blocks.children[0].key;
  }
  prompt.anchor.setTo(0.5, 0.5);
  prompt.font = 'Century Schoolbook';
  prompt.fontSize = 20;
  prompt.align = "center";
}

function resetGame() {
  if (blocks.children[0]) {
    blocks.children[0].destroy();
  }
  if (bet === winner) {
    money = money + betMoney;
  } else if (winner != "none" && bet != winner) {
    money = money - betMoney;
    if (money <= 0) {
      money = 10;
    }
  }
  localStorage.setItem('money', money.toString());
  var currency = JSON.stringify({
     money: money,
     betMoney: 0
  });
  sock.send(currency);
  betMoney = 0; 
  bet = "none";
  winner = "none"
  constrain = false; 
  gameOver = false;
  goingToCenter = false;
  prompt.destroy();  
  blue = blocks.create(200, 150, 'blue');
  red = blocks.create(200, 744, 'red');
  green = blocks.create(1008, 150, 'green');
  orange = blocks.create(1008, 744, 'orange');
  blocks.forEach(function(block) {
    block.body.setCollisionGroup(blockCollisionGroup);
    block.body.collides(blockCollisionGroup);
    block.body.onBeginContact.add(hitBlock, this);
    block.anchor.x = 0.5;
    block.anchor.y = 0.5;
    block.body.friction = 0;
    block.body.angularDamping = 0;
    block.body.mass = 0.1;
    block.body.restitution = 1;
    block.health = 20;
    block.isAlive = true;
  }, this);
  promptBet();
  showTimer = true;
  game.time.events.add(Phaser.Timer.SECOND * 10, startGame, this);
}

function accelerateToCenter(obj1, speed) {
    if (typeof speed === 'undefined') { speed = 60; }
    var angle = Math.atan2(game.world.centerY + 50 - obj1.y, game.world.centerX - obj1.x);
    obj1.body.rotation = angle + game.math.degToRad(90);  // correct angle of angry bullets (depends on the sprite used)
    obj1.body.force.x = Math.cos(angle) * speed;    // accelerateToObject 
    obj1.body.force.y = Math.sin(angle) * speed;
}

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function update () {
  if (constrain === false && showTimer === true) {
      updateTimer();
      var currency = JSON.stringify({
         money: money,
         betMoney : betMoney
      });
      sock.send(currency);
  } else if (goingToCenter === true) {
      if (blocks.children[0]) {  
       if (blocks.children[0].alpha < 1) {
          blocks.children[0].alpha += .01;
       }

        if (Phaser.Math.distance(game.world.centerX, game.world.centerY + 50, blocks.children[0].body.sprite.x, blocks.children[0].body.sprite.y) < 3) {
              blocks.children[0].body.data.velocity[0] = 0;
              blocks.children[0].body.data.velocity[1] = 0;
        }
      } else {
            prompt.destroy();
            goingToCenter = false;
      }
    }
  else {
    if (gameOver === false && constrain === true){
      blocks.forEach(function(block) {
        constrainVelocity(block,blockVelocity);
      }, this);
    } else if (gameOver === true && blocks.length === 1)  {
      showResults();
    } else if (gameOver === true && blocks.length === 0) {
      showResults("tie");
      }
  }
}

function uMoney(m) { 
  players[m.Id].money = m.money
  players[m.Id].betMoney = m.betMoney      
}


function render () {

}
