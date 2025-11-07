import React, { useState, useEffect } from 'react';
import { Ghost, Trophy, Timer } from 'lucide-react';

const HauntedMazeGame = () => {
  const PLAYER_SIZE = 25;
  const GHOST_SIZE = 30;
  const MOVE_SPEED = 5;
  const GHOST_SPEED = 3;
  const WALL_THICKNESS = 5;
  const PATH_HEIGHT = 50;
  
  // Simpler, smaller maze - easier to win
  const walls = [
    // Outer walls
    { x: 25, y: 10, width: 595, height: WALL_THICKNESS }, // top
    { x: 25, y: 10, width: WALL_THICKNESS, height: 420 }, // left
    { x: 615, y: 10, width: WALL_THICKNESS, height: 420 }, // right
    { x: 25, y: 425, width: 595, height: WALL_THICKNESS }, // bottom
    
    // Row 1 - top section (2 segments with 1 gap)
    { x: 25, y: 75, width: 200, height: WALL_THICKNESS },
    { x: 325, y: 75, width: 295, height: WALL_THICKNESS },
    
    // Row 2
    { x: 25, y: 140, width: 150, height: WALL_THICKNESS },
    { x: 275, y: 140, width: 345, height: WALL_THICKNESS },
    
    // Row 3
    { x: 25, y: 205, width: 200, height: WALL_THICKNESS },
    { x: 325, y: 205, width: 295, height: WALL_THICKNESS },
    
    // Row 4
    { x: 25, y: 270, width: 150, height: WALL_THICKNESS },
    { x: 275, y: 270, width: 345, height: WALL_THICKNESS },
    
    // Row 5 (bottom)
    { x: 25, y: 335, width: 200, height: WALL_THICKNESS },
    { x: 325, y: 335, width: 295, height: WALL_THICKNESS },
    
    // Vertical walls - passages
    { x: 225, y: 80, width: WALL_THICKNESS, height: 55 },
    { x: 175, y: 145, width: WALL_THICKNESS, height: 55 },
    { x: 225, y: 210, width: WALL_THICKNESS, height: 55 },
    { x: 175, y: 275, width: WALL_THICKNESS, height: 55 },
  ];

  const [player1, setPlayer1] = useState({ x: 45, y: 380, canMoveHorizontal: true });
  const [player2, setPlayer2] = useState({ x: 580, y: 380, canMoveHorizontal: false });
  const [ghost, setGhost] = useState({ x: 180, y: 350, vx: GHOST_SPEED, vy: GHOST_SPEED });
  const [keys, setKeys] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [ghostTouches, setGhostTouches] = useState(0);
  const [finalScore, setFinalScore] = useState(null);
  const [lastGhostTouch, setLastGhostTouch] = useState({ p1: 0, p2: 0 });

  const endZone = { x: 495, y: 25, width: 110, height: 45 };

  const checkCollision = (rect1, rect2) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const checkWallCollision = (x, y, size) => {
    for (let wall of walls) {
      if (checkCollision({ x, y, width: size, height: size }, wall)) {
        return true;
      }
    }
    return false;
  };

  const checkInEndZone = (player) => {
    return checkCollision(
      { x: player.x, y: player.y, width: PLAYER_SIZE, height: PLAYER_SIZE },
      endZone
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };
    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const gameLoop = setInterval(() => {
      setElapsedTime(Date.now() - startTime);

      // Move players
      setPlayer1(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (prev.canMoveHorizontal) {
          if (keys['a'] || keys['A']) newX -= MOVE_SPEED;
          if (keys['d'] || keys['D']) newX += MOVE_SPEED;
        } else {
          if (keys['w'] || keys['W']) newY -= MOVE_SPEED;
          if (keys['s'] || keys['S']) newY += MOVE_SPEED;
        }

        if (checkWallCollision(newX, newY, PLAYER_SIZE)) {
          return prev;
        }

        return { ...prev, x: newX, y: newY };
      });

      setPlayer2(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (prev.canMoveHorizontal) {
          if (keys['ArrowLeft']) newX -= MOVE_SPEED;
          if (keys['ArrowRight']) newX += MOVE_SPEED;
        } else {
          if (keys['ArrowUp']) newY -= MOVE_SPEED;
          if (keys['ArrowDown']) newY += MOVE_SPEED;
        }

        if (checkWallCollision(newX, newY, PLAYER_SIZE)) {
          return prev;
        }

        return { ...prev, x: newX, y: newY };
      });

      // Check player collision and push - both players can push each other
      setPlayer1(p1 => {
        setPlayer2(p2 => {
          if (checkCollision(
            { x: p1.x, y: p1.y, width: PLAYER_SIZE, height: PLAYER_SIZE },
            { x: p2.x, y: p2.y, width: PLAYER_SIZE, height: PLAYER_SIZE }
          )) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const pushX = (dx / distance) * 3;
              const pushY = (dy / distance) * 3;
              
              // Player 1 pushes Player 2
              const newP2X = p2.x + pushX;
              const newP2Y = p2.y + pushY;
              if (!checkWallCollision(newP2X, newP2Y, PLAYER_SIZE)) {
                setPlayer2(prev => ({ ...prev, x: newP2X, y: newP2Y }));
              }
              
              // Player 2 pushes Player 1 (opposite direction)
              const newP1X = p1.x - pushX;
              const newP1Y = p1.y - pushY;
              if (!checkWallCollision(newP1X, newP1Y, PLAYER_SIZE)) {
                setPlayer1(prev => ({ ...prev, x: newP1X, y: newP1Y }));
              }
            }
          }
          return p2;
        });
        return p1;
      });

      // Move ghost
      setGhost(prev => {
        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVx = prev.vx;
        let newVy = prev.vy;

        if (newX < 30 || newX > 610 - GHOST_SIZE) {
          newVx = -prev.vx;
          newX = prev.x + newVx;
        }
        if (newY < 15 || newY > 425 - GHOST_SIZE) {
          newVy = -prev.vy;
          newY = prev.y + newVy;
        }

        return { x: newX, y: newY, vx: newVx, vy: newVy };
      });

      // Check ghost collision with players - only switch once per collision
      const currentTime = Date.now();
      setGhost(g => {
        setPlayer1(p1 => {
          const isColliding = checkCollision(
            { x: g.x, y: g.y, width: GHOST_SIZE, height: GHOST_SIZE },
            { x: p1.x, y: p1.y, width: PLAYER_SIZE, height: PLAYER_SIZE }
          );
          
          if (isColliding && currentTime - lastGhostTouch.p1 > 1000) {
            setGhostTouches(prev => prev + 1);
            setLastGhostTouch(prev => ({ ...prev, p1: currentTime }));
            return { ...p1, canMoveHorizontal: !p1.canMoveHorizontal };
          }
          return p1;
        });

        setPlayer2(p2 => {
          const isColliding = checkCollision(
            { x: g.x, y: g.y, width: GHOST_SIZE, height: GHOST_SIZE },
            { x: p2.x, y: p2.y, width: PLAYER_SIZE, height: PLAYER_SIZE }
          );
          
          if (isColliding && currentTime - lastGhostTouch.p2 > 1000) {
            setGhostTouches(prev => prev + 1);
            setLastGhostTouch(prev => ({ ...prev, p2: currentTime }));
            return { ...p2, canMoveHorizontal: !p2.canMoveHorizontal };
          }
          return p2;
        });

        return g;
      });

      // Check win condition
      setPlayer1(p1 => {
        setPlayer2(p2 => {
          if (checkInEndZone(p1) && checkInEndZone(p2) && !gameEnded) {
            const timeInSeconds = (Date.now() - startTime) / 1000;
            const score = Math.round(timeInSeconds * 1000 + ghostTouches * 500);
            setFinalScore(score);
            setGameEnded(true);
          }
          return p2;
        });
        return p1;
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameEnded, keys, startTime, ghostTouches]);

  const startGame = () => {
    setGameStarted(true);
    setGameEnded(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setGhostTouches(0);
    setFinalScore(null);
    setLastGhostTouch({ p1: 0, p2: 0 });
    setPlayer1({ x: 45, y: 380, canMoveHorizontal: true });
    setPlayer2({ x: 580, y: 380, canMoveHorizontal: false });
    setGhost({ x: 180, y: 350, vx: GHOST_SPEED, vy: GHOST_SPEED });
  };

  const formatTime = (ms) => {
    return (ms / 1000).toFixed(2);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black p-8">
      <div className="mb-6 text-center">
        <h1 className="text-5xl font-bold text-orange-400 mb-2 flex items-center justify-center gap-3">
          👻 Haunted House Escape 🎃
        </h1>
        <p className="text-gray-300 text-lg">Two players, one goal: escape together!</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg mb-4 shadow-2xl">
        <div className="flex gap-8 text-white text-lg">
          <div className="flex items-center gap-2">
            <Timer className="w-6 h-6 text-blue-400" />
            <span>Time: {formatTime(elapsedTime)}s</span>
          </div>
          <div className="flex items-center gap-2">
            <Ghost className="w-6 h-6 text-purple-400" />
            <span>Ghost Touches: {ghostTouches}</span>
          </div>
          {finalScore && (
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span className="font-bold">Score: {finalScore}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative bg-gray-700 rounded-lg shadow-2xl" style={{ width: '645px', height: '440px' }}>
        {/* Maze walls */}
        {walls.map((wall, i) => (
          <div
            key={i}
            className="absolute bg-purple-600"
            style={{
              left: wall.x,
              top: wall.y,
              width: wall.width,
              height: wall.height,
            }}
          />
        ))}

        {/* End zone */}
        <div
          className="absolute bg-green-500 flex items-center justify-center text-black font-bold text-sm"
          style={{
            left: endZone.x,
            top: endZone.y,
            width: endZone.width,
            height: endZone.height,
          }}
        >
          ESCAPE! →
        </div>

        {/* Decorations */}
        <div className="absolute text-3xl" style={{ left: '100px', top: '25px' }}>🎃</div>
        <div className="absolute text-3xl" style={{ right: '60px', top: '100px' }}>🕸️</div>
        <div className="absolute text-4xl" style={{ left: '90px', top: '200px' }}>👻</div>
        <div className="absolute text-3xl" style={{ right: '80px', top: '280px' }}>💀</div>
        <div className="absolute text-2xl" style={{ right: '60px', top: '400px' }}>🐱</div>

        {/* Player 1 (Orange - Pumpkin emoji) */}
        <div
          className="absolute bg-orange-500 rounded-lg flex items-center justify-center transition-all duration-75 text-2xl border-2 border-orange-700"
          style={{
            left: player1.x,
            top: player1.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
          }}
        >
          🎃
        </div>

        {/* Player 2 (Green - Different emoji) */}
        <div
          className="absolute bg-green-500 rounded-lg flex items-center justify-center transition-all duration-75 text-2xl border-2 border-green-700"
          style={{
            left: player2.x,
            top: player2.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
          }}
        >
          👤
        </div>

        {/* Ghost */}
        <div
          className="absolute flex items-center justify-center transition-all duration-75"
          style={{
            left: ghost.x,
            top: ghost.y,
            width: GHOST_SIZE,
            height: GHOST_SIZE,
          }}
        >
          <Ghost className="w-full h-full text-white opacity-80 animate-pulse" />
        </div>

        {/* Game over overlay */}
        {gameEnded && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-4xl font-bold text-green-400 mb-4">You Escaped!</h2>
              <p className="text-white text-xl mb-2">Time: {formatTime(elapsedTime)}s</p>
              <p className="text-white text-xl mb-2">Ghost Touches: {ghostTouches}</p>
              <p className="text-yellow-400 text-3xl font-bold mb-6">Final Score: {finalScore}</p>
              <button
                onClick={startGame}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-xl font-bold"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Start overlay */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg text-center max-w-2xl">
              <Ghost className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold text-orange-400 mb-4">How to Play</h2>
              <div className="text-white text-left space-y-2 mb-6">
                <p>🎃 <strong>Player 1 (Orange Pumpkin):</strong> WASD keys - moves LEFT/RIGHT only</p>
                <p>👤 <strong>Player 2 (Green Player):</strong> Arrow keys - moves UP/DOWN only</p>
                <p>🤝 <strong>Teamwork:</strong> Push each other to navigate the maze!</p>
                <p>👻 <strong>Ghost:</strong> Switches your movement when it touches you!</p>
                <p>🎯 <strong>Goal:</strong> Both players reach the green ESCAPE zone</p>
                <p>📊 <strong>Score:</strong> Time × 1000 + Ghost touches × 500 (lower is better!)</p>
              </div>
              <button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-2xl font-bold"
              >
                Start Game
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8 text-white max-w-2xl">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-orange-500 rounded text-center">🎃</div>
            <h3 className="font-bold text-lg">Player 1 (Pumpkin)</h3>
          </div>
          <p className="text-sm text-gray-300">
            {player1.canMoveHorizontal ? '← → Horizontal ONLY (A/D)' : '↑ ↓ Vertical ONLY (W/S)'}
          </p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-green-500 rounded text-center">👤</div>
            <h3 className="font-bold text-lg">Player 2 (Green)</h3>
          </div>
          <p className="text-sm text-gray-300">
            {player2.canMoveHorizontal ? '← → Horizontal ONLY (Arrows)' : '↑ ↓ Vertical ONLY (Arrows)'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HauntedMazeGame;