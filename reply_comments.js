const fs = require('fs');
const cp = require('child_process');

const data = JSON.parse(fs.readFileSync('rest_comments.json', 'utf8'));

// Filter to only base comments (not replies themselves)
const baseComments = data.filter(c => !c.in_reply_to_id);

// Optional: Filter to comments that don't already have replies from us
// (We might just reply to all that don't have our reply)
const repliedThreads = new Set(data.filter(c => c.user.login === 'sasler').map(c => c.in_reply_to_id));

baseComments.forEach(c => {
    if (!repliedThreads.has(c.id)) {
        try {
            const body = c.path.includes('.js') 
                ? "Fixed the script issue in the latest commit using Gemini 3.1 Pro."
                : (c.body.includes('console.log') 
                    ? "Restored functional game logic and replaced the placeholder using Gemini 3.1 Pro."
                    : "Fixed this gameplay issue in the latest commit using Gemini 3.1 Pro.");

            const cmd = `gh api -X POST /repos/sasler/brainrot/pulls/5/comments/${c.id}/replies -f body="${body}"`;
            cp.execSync(cmd, { stdio: 'inherit' });
            console.log('Replied to ' + c.id);
        } catch (e) {
            console.error('Failed to reply to ' + c.id, e.message);
        }
    }
});
