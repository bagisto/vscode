const vscode = require('vscode');
const {
    createCompletionProvider,
    dependencyInjectionCompletionProvider,
    createClassCompletionProvider,
    eventCompletionProvider
} = require('./features/completionProvider');
const { createClassTemplate } = require('./features/templateGenerator');
const createModule = require('./features/createModuel');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    // Class importer completion provider.
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { scheme: 'file', language: 'php' },
            createCompletionProvider(),
            'wk'
        )
    );

    // Dependency Injection Completion Provider.
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'php', scheme: 'file' },
            dependencyInjectionCompletionProvider(),
            'wkpr' // Trigger on `wkpr`
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'php', scheme: 'file' },
            eventCompletionProvider(),
            'wkev' // Trigger on `wkev`
        )
    );

    // Provider for generate class.
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { scheme: 'file', language: 'php' },
            createClassCompletionProvider(),
            'wk'
        )
    );

    // Register Command Cor Generator Class Template
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.generateClassTemplate',
            createClassTemplate
        )
    );

    // Register Command For Create Moduel.
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.createModule', // Command identifier
            createModule // Reference to the imported command
        )
    );
}

function deactivate() { }

module.exports = {
    activate,
    deactivate,
};
