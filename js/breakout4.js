// Code principal
( function(){
	"use strict";

	window.Breakout = function( oApplication ){

		// Global params
		var iAnimationRequestId = 0,
			aBricks = [],
			oSourceCanvasRect = oApplication.canvas.getBoundingClientRect();

		// Background
		var oBackground = {
			"color": "black",
			"render": function() {
				oApplication.context.fillStyle = this.color;
				oApplication.context.fillRect( 0, 0, oApplication.width, oApplication.height );
			}
		};

		// Bricks
		var Brick = function( iX, iY, isSpecial ) {
			this.width = 30;
			this.height = 8;
			this.x = iX;
			this.y = iY;
			this.cx = iX + 15;
			this.cy = iY + 4;
			if( isSpecial ){
				this.color = "yellow";
			} else {
				this.color = "crimson";
			}
		};

		Brick.prototype.render = function() {
			aBricks.forEach( function( element ) {
				oApplication.context.fillStyle = element.color;
				oApplication.context.fillRect( element.x, element.y, element.width, element.height );
			}, this );
		};

		Brick.prototype.update = function() {
			this.render();
		};

		Brick.spacing = 40;

		var oPlatform = {
			"width": 100,
			"height": 10,
			"color": "white",
			"speed": 30,
			"posX": oApplication.canvas.width / 2 - 50,
			"posY": oApplication.canvas.height - 30,
			"update": function( oEvent ){
				if( oEvent.keyCode == 37 ){
					// Left key
					this.posX-=this.speed;
					( this.posX < 0 ) && ( this.posX = 0 );
					
				} else if( oEvent.keyCode == 39 ) {
					// Right key
					this.posX+=this.speed;
					( this.posX > oSourceCanvasRect.width - this.width ) && ( this.posX = oSourceCanvasRect.width - this.width  );
				} else if ( oEvent.keyCode == 40 ){
					oProjectile.speed = 1;
				} else if ( oEvent.keyCode == 38 ){
					oProjectile.speed += 5;
				}
			},
			"render": function(){
				var ctx = oApplication.context;
				ctx.fillStyle = this.color;
				ctx.fillRect( this.posX, this.posY, this.width, this.height );
			}
		};

		var oProjectile = {
			"color": "#00CC66",
			"size": 15,
			"speed": 1,
			"posX": oApplication.canvas.width / 2 - 15 / 2,
			"posY": oApplication.canvas.height - 45,
			"cx": 0,
			"cy": 0,
			"angle": -45,
			"update": function() {
				// Movement
				var newX, newY, side;
				this.cx = this.posX + this.size / 2;
				this.cy = this.posY + this.size / 2;

				// Hitting left side of canvas
				if( this.posX <= 0 ){
					side = "left";
					this.angle = fRebound( this.angle, side );
				}
				// Hitting top side of canvas
				if( this.posY <= 0 ){
					side = "top";
					this.angle = fRebound( this.angle, side );
				}
				// Hitting right side of canvas
				if( this.posX + this.size >= oSourceCanvasRect.width ){
					side = "right";
					this.angle = fRebound( this.angle, side );
				}
				// Hitting bottom side of canvas
				if( this.posY + this.size > oSourceCanvasRect.height ){
					fGameOver();
				}

				// Hitting top side of platform
				if( this.posY + this.size >= oPlatform.posY && this.posX > oPlatform.posX - this.size && this.posX + this.size <= oPlatform.posX + oPlatform.width  ){
					if( this.angle == 135 ){
						this.angle = 45;
					} else if( this.angle == -135 ){
						this.angle = -45;
					}
				}

				fCheckBricksHitzones();

				// Calculate trajectory based on direction angle (ranging from -180 to 180 degrees)
				if ( this.angle >= 90){
					newX = ( 180 - this.angle ) / 90 ;
					newY = ( this.angle - 90 ) / 90;
				} else if ( this.angle < -90) {
					newX = - ( 180 + this.angle ) / 90;
					newY = - ( this.angle + 90 ) / 90 ;
				} else if ( this.angle >= 0) {
					newX = ( this.angle ) / 90;
					newY = ( this.angle - 90 ) / 90 ;
				} else if( this.angle < 0) {
					newX = ( this.angle ) / 90;
					newY = - ( 90 + this.angle ) / 90 ;
				}

				this.posX += newX * this.speed;
				this.posY += newY * this.speed;

				this.render();
			},
			"render": function() {
				var ctx = oApplication.context;
				ctx.fillStyle = this.color;
				ctx.fillRect( this.posX, this.posY, this.size, this.size );
			}
		};

		// prepare things before we start
		var init = function() {
			console.log( "Initialising game" );
			// Draw background
			oBackground.render();
			// Generate bricks
			fGenerateBricks();
			// Show start screen
			fShowStartscreen();

		};

		// start game
		var start = function() {
			console.log( "Starting game!" );
			// listen to arrow keys to trigger platform movement
			window.addEventListener( "keypress", oPlatform.update.bind( oPlatform ) );
			oApplication.canvas.removeEventListener( "click", start );
			fAnimationLoop();
		};

		var fGenerateBricks = function() {
			var iPaddingX = 150, 
				iPaddingY = 130, 
				iXOffset = iPaddingX, 
				iYOffset = iPaddingY, 
				topBrickCount = 8, 
				lineNumber = 1, 
				maxLines = 8,
				isSpecial, 
				k = 0;
			console.log( "Generating bricks:" );
			for( var i = 1; i <= topBrickCount ; i++ ){
				isSpecial = false;
				console.log( "Created a brick!" );
				k++;
				if( k == 10 ){
					isSpecial = true;
				}
				aBricks.push( new Brick( iXOffset, iYOffset, isSpecial ) );

				if( i == topBrickCount ){
					iXOffset =  iPaddingX + lineNumber * ( ( aBricks[0].width / 2 ) + ( Brick.spacing - aBricks[0].width ) / 2 );
					iYOffset += 20;
					lineNumber++;
					topBrickCount--;
					if( lineNumber <= maxLines ){
						i = 0;
					}
				} else {
					iXOffset += Brick.spacing;
				}
			}
			console.log("Done! Ready to start...");
		};

		var fCheckBricksHitzones = function() {
			var size = oProjectile.size,
				px = oProjectile.posX,
				py = oProjectile.posY,
				pxx= px + size,
				pyy= py + size,
				ex, ey, exx, eyy, hit = false;

			aBricks.forEach( function( element, index, array ){
				ex = element.x,
				ey = element.y,
				exx= ex + element.width,
				eyy= ey + element.height;

				// Si le bord bas du projectile est au même y que le bord haut de la brique et qu'on est bien 
				// entre le bord gauche et droit de la brique -> on tape le haut
				if( pyy == ey && py < ey && pxx >= ex && pxx <= exx ) {
					oProjectile.angle = fRebound( oProjectile.angle, "bottom" );
					aBricks.splice(aBricks.indexOf(element), 1);
				}

				// Si le bord haut du projectile est au même y que le bord bas de la brique et qu'on est bien 
				// entre le bord gauche et droit de la brique -> on tape le bas
				if ( py == eyy && pyy > eyy && pxx >= ex && pxx <= exx ) {
					oProjectile.angle = fRebound( oProjectile.angle, "top" );
					aBricks.splice(aBricks.indexOf(element), 1);
				}

				// Si le bord droit du projectile est au même x que le bord gauche de la brique
				// et que le bord haut du projectile est entre le bord haut et bas de la brique 
				// ou que le bord bas du projectile est entre le bord haut et bas de la brique
				// -> on tape la gauche
				if( pxx == ex && (( py >= ey && py <= eyy ) || ( pyy <= eyy && pyy >= ey )) ) {
					oProjectile.angle = fRebound( oProjectile.angle, "right" );
					console.log('hit right');
					aBricks.splice(aBricks.indexOf(element), 1);
				}

				// Si le bord gauche du projectile est au même x que le bord droit de la brique
				// et que le bord haut du projectile est entre le bord haut et bas de la brique 
				// ou que le bord bas du projectile est entre le bord haut et bas de la brique
				// -> on tape la droite
				if( px == exx && (( py >= ey && py <= eyy ) || ( pyy <= eyy && pyy >= ey )) ) {
					oProjectile.angle = fRebound( oProjectile.angle, "left" );
					console.log('hit left');
					aBricks.splice(aBricks.indexOf(element), 1);
				}

			} );
		};

		var fRebound = function( angle, side ){
			if( angle == -45 && side == "left" ){
				angle = 45;
			} else if( angle == -135 && side == "left" ){
				angle = 135;
			} else if( angle == 45 && side == "top" ){
				angle = 135;
			} else if( angle == -45 && side == "top" ){
				angle = -135;
			} else if( angle == 45 && side == "right" ){
				angle = -45;
			} else if( angle == 135 && side == "right" ){
				angle = -135;
			} else if( angle == -135 && side == "bottom" ){
				angle = -45;
			} else if( angle == 135 && side == "bottom" ){
				angle = 45;
			}

			return angle;
		};

		var fShowStartscreen = function() {
			var ctx = oApplication.context;
			ctx.fillStyle = "white";
			ctx.font = "700 36px 'Avenir Next'";
			ctx.textAlign = "center";
			ctx.fillText("CLICK TO START", oApplication.width / 2, oApplication.height / 2);
			ctx.font = "500 12px 'Avenir Next'";
			ctx.textAlign = "center";
			ctx.fillText("Code by Adrien Leloup, 2284", oApplication.width / 2, oApplication.height / 1.2);
		};

		// Called at each animation frame request
		var fAnimationLoop = function() {
			iAnimationRequestId = window.requestAnimationFrame( fAnimationLoop );
			// clear canvas
			oApplication.context.clearRect( 0, 0, oApplication.width, oApplication.height );
			// draw background
			oBackground.render();
			// update & draw bricks
			for( var i=0; i < aBricks.length; i+=2 ){
				aBricks[ i ].update();
			}
			// render platform
			oPlatform.render();
			// update projectile
			oProjectile.update();
		};

		// Game over
		var fGameOver = function() {
			window.cancelAnimationFrame( iAnimationRequestId );
			window.alert( "Perdu !" );
			// Refresh to restart
			window.location.reload( true );
		};

		window.addEventListener( "load", init );
		oApplication.canvas.addEventListener( "click", start );
	};

} )();