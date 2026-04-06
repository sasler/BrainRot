const fs = require('fs');
let s = fs.readFileSync('public/games/breakout/gemini-3-1-pro/index.html', 'utf8');
const p1 = s.indexOf('// Laser collision');
const p2 = s.indexOf('ctx.shadowColor = NEON_PINK;');
s = s.substring(0, p1) + \// Laser collision
                for (let l_idx = lasers.length - 1; l_idx >= 0; l_idx--) {
                    const laser = lasers[l_idx];
                    laser.y += laser.dy;
                    if (laser.y < 0) {
                        lasers.splice(l_idx, 1);
                        continue;
                    }
                    
                    for (let b_idx = 0; b_idx < bricks.length; b_idx++) {
                        const brick = bricks[b_idx];
                        if (brick.status === 1 && laser.x > brick.x && laser.x < brick.x + brick.w && laser.y > brick.y && laser.y < brick.y + brick.h) {
                            brick.status = 0;
                            score += brick.points;
                            createParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color);
                            createPowerUp(brick.x + brick.w / 2, brick.y + brick.h / 2);
                            lasers.splice(l_idx, 1);
                            break;
                        }
                    }
                }

                // Power-up movement and collection
                for (let index = powerUps.length - 1; index >= 0; index--) {
                    const p = powerUps[index];
                    p.y += p.dy;
                    if (p.y > height) {
                        powerUps.splice(index, 1);
                        continue;
                    }
                    if (p.x > paddle.x && p.x < paddle.x + paddle.w && p.y > paddle.y && p.y < paddle.y + paddle.h) {
                        activatePowerUp(p.type);
                        powerUps.splice(index, 1);
                    }
                }
                \ + s.substring(p2);
fs.writeFileSync('public/games/breakout/gemini-3-1-pro/index.html', s);
