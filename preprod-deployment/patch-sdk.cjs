const fs = require('fs');
const path = require('path');

const contractsCjsPath = path.join(__dirname, 'node_modules', '@midnight-ntwrk', 'midnight-js-contracts', 'dist', 'index.cjs');
const contractsMjsPath = path.join(__dirname, 'node_modules', '@midnight-ntwrk', 'midnight-js-contracts', 'dist', 'index.mjs');

function patchFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // Find the exitResultOrError call in createUnprovenDeployTxFromVerifierKeys
    // It looks like:
    // const { public: { contractState }, private: { privateState, signingKey, zswapLocalState } } = midnightJsTypes.exitResultOrError(exitResult);
    
    // We can replace exitResultOrError(exitResult) with a patched version.
    let patched = false;
    
    // For CJS
    const searchStringCjs = `midnightJsTypes.exitResultOrError(exitResult)`;
    const replacementStringCjs = `(function(er) {
        function flatten(obj, depth = 0) {
            if (depth > 5 || !obj || typeof obj !== 'object') return;
            if (obj.tag === 'schnorr' && obj.value) { obj.tag = undefined; return obj.value; }
            if (obj.tag === 'ed25519' && obj.value) { obj.tag = undefined; return obj.value; }
            for (let k in obj) {
                if (obj.hasOwnProperty(k)) {
                    if (obj[k] && typeof obj[k] === 'object') {
                        if (obj[k].tag === 'schnorr' && obj[k].value) obj[k] = obj[k].value;
                        else if (obj[k].tag === 'ed25519' && obj[k].value) obj[k] = obj[k].value;
                        else flatten(obj[k], depth + 1);
                    }
                }
            }
        }
        flatten(er);
        return midnightJsTypes.exitResultOrError(er);
    })(exitResult)`;

    if (content.includes(searchStringCjs) && !content.includes('typeof keys.signing ===')) {
        content = content.replaceAll(searchStringCjs, replacementStringCjs);
        patched = true;
    }

    // For MJS
    const searchStringMjs = `exitResultOrError(exitResult)`;
    const replacementStringMjs = `(function(er) {
        function flatten(obj, depth = 0) {
            if (depth > 5 || !obj || typeof obj !== 'object') return;
            if (obj.tag === 'schnorr' && obj.value) { obj.tag = undefined; return obj.value; }
            if (obj.tag === 'ed25519' && obj.value) { obj.tag = undefined; return obj.value; }
            for (let k in obj) {
                if (obj.hasOwnProperty(k)) {
                    if (obj[k] && typeof obj[k] === 'object') {
                        if (obj[k].tag === 'schnorr' && obj[k].value) obj[k] = obj[k].value;
                        else if (obj[k].tag === 'ed25519' && obj[k].value) obj[k] = obj[k].value;
                        else flatten(obj[k], depth + 1);
                    }
                }
            }
        }
        flatten(er);
        return exitResultOrError(er);
    })(exitResult)`;

    if (content.includes(searchStringMjs) && !patched && !content.includes('typeof keys.signing ===')) {
        content = content.replaceAll(searchStringMjs, replacementStringMjs);
        patched = true;
    }

    if (patched) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched ${filePath}`);
    } else {
        console.log(`Already patched or not found in ${filePath}`);
    }
}

patchFile(contractsCjsPath);
patchFile(contractsMjsPath);
