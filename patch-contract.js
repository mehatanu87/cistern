const fs = require('fs');
const path = 'contracts/managed/cistern/contract/index.js';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/contextOrig_0\.callContext/g, '(contextOrig_0.callContext || contextOrig_0)');
  content = content.replace(/context\.callContext/g, '(context.callContext || context)');
  fs.writeFileSync(path, content);
  console.log("Patched contract JS successfully!");
}
