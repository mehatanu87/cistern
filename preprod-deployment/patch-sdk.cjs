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
        if (er && er._tag === 'Success' && er.value && er.value.private) {
            if (er.value.private.signingKey && typeof er.value.private.signingKey === 'object') {
                er.value.private.signingKey = er.value.private.signingKey.value;
            }
            if (er.value.private.privateState && er.value.private.privateState.keys) {
                const keys = er.value.private.privateState.keys;
                if (typeof keys.signing === 'object' && keys.signing) keys.signing = keys.signing.value;
                if (typeof keys.encryption === 'object' && keys.encryption) keys.encryption = keys.encryption.value;
            }
        }
        return midnightJsTypes.exitResultOrError(er);
    })(exitResult)`;

    if (content.includes(searchStringCjs) && !content.includes('typeof keys.signing ===')) {
        content = content.replaceAll(searchStringCjs, replacementStringCjs);
        patched = true;
    }

    // For MJS
    const searchStringMjs = `exitResultOrError(exitResult)`;
    const replacementStringMjs = `(function(er) {
        if (er && er._tag === 'Success' && er.value && er.value.private) {
            if (er.value.private.signingKey && typeof er.value.private.signingKey === 'object') {
                er.value.private.signingKey = er.value.private.signingKey.value;
            }
            if (er.value.private.privateState && er.value.private.privateState.keys) {
                const keys = er.value.private.privateState.keys;
                if (typeof keys.signing === 'object' && keys.signing) keys.signing = keys.signing.value;
                if (typeof keys.encryption === 'object' && keys.encryption) keys.encryption = keys.encryption.value;
            }
        }
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
