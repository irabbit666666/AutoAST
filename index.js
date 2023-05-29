const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');
const openai = require('openai');

const openaiInstance = new openai({
    apiKey: 'your_api_key',
});

async function deobfuscateWithGPT(obfuscatedCode) {
    const gptResponse = await openaiInstance.completePrompt({
        prompt: `Here is some obfuscated JavaScript code:\n${obfuscatedCode}\nWhat is the deobfuscated version?`,
        maxTokens: 60,
    });
    return gptResponse.choices[0].text.trim();
}

async function deobfuscateNode(node) {
    const obfuscatedSnippet = escodegen.generate(node);
    const deobfuscatedSnippet = await deobfuscateWithGPT(obfuscatedSnippet);
    const deobfuscatedAST = esprima.parseScript(deobfuscatedSnippet);
    return deobfuscatedAST.body[0];
}

async function deobfuscateCode(obfuscatedCode) {
    const ast = esprima.parseScript(obfuscatedCode);

    const nodesToDeobfuscate = [];
    estraverse.traverse(ast, {
        enter(node) {
            nodesToDeobfuscate.push(node);
        },
    });

    for (let node of nodesToDeobfuscate) {
        const deobfuscatedNode = await deobfuscateNode(node);
        // Replace the original node with the deobfuscated node in its parent
        for (let key in node.parent) {
            if (node.parent[key] === node) {
                node.parent[key] = deobfuscatedNode;
                break;
            }
        }
    }

    return escodegen.generate(ast);
}

deobfuscateCode('var a = 1;').then(console.log);
