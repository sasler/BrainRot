const fs = require('fs');
const meta = JSON.parse(fs.readFileSync('games-metadata.json'));
let today = new Date().toISOString().split('T')[0];
let games = ['snake','minesweeper','tetris','reversi','breakout','2048','endless-runner','marble-madness','maze-3d'];
for(let g of games) {
  let p = `public/games/${g}/gemini-3-1-pro/index.html`;
  if(fs.existsSync(p)) {
    let loc = fs.readFileSync(p, 'utf8').split('\n').length;
    let game = meta.games.find(gm => gm.id === g);
    if(game) {
      let entry = game.versions.find(v => v.modelId === 'gemini-3-1-pro');
      if(entry) {
        entry.linesOfCode = loc;
        entry.date = today;
      }
    }
  }
}
fs.writeFileSync('games-metadata.json', JSON.stringify(meta, null, 2));
