const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const { generateClassTemplate } = require('./templateGenerator')
const {
    validateConstructArea,
    parseUseStatements,
    parseConstructInjectedClasses,
    getNamespaceFromFile,
    findDirectories,
    getAllPhpFiles,
    extractEventsFromContent
} = require('./helperFunctions');

/**
 * Create a CompletionItemProvider.
 */
function createCompletionProvider() {
    return {
        provideCompletionItems: async (document, position) => {
            const wordRange = document.getWordRangeAtPosition(position);
            const currentWord = document.getText(wordRange);

            const keywordMap = {
                "re": "Repositories",
                "mo": "Models",
                "co": "Controllers",
                "he": "Helpers",
                "cn": "Contracts"
            };

            const keyword = currentWord.slice(2, 4).toLowerCase();;
            const dirName = keywordMap[keyword];

            if (!dirName) {
                return undefined;
            }

            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (!workspaceFolders) {
                return undefined;
            }

            let suggestions = [];

            for (const folder of workspaceFolders) {
                const basePath = path.join(folder.uri.fsPath, 'packages/Webkul');

                if (!fs.existsSync(basePath)) {
                    continue; // Skip if the base path doesn't exist
                }

                // Recursively find directories matching `dirName`
                const matchingDirs = findDirectories(basePath, new RegExp(`${dirName}$`));

                for (const dirPath of matchingDirs) {
                    const phpFiles = getAllPhpFiles(dirPath); // Fetch all PHP files (including subdirectories)

                    for (const filePath of phpFiles) {
                        const namespace = getNamespaceFromFile(filePath);

                        if (namespace) {
                            const completionItem = new vscode.CompletionItem(
                                `use ${namespace};`,
                                vscode.CompletionItemKind.Snippet
                            );
                            completionItem.insertText = `use ${namespace};`;
                            completionItem.documentation = new vscode.MarkdownString(`Namespace: ${namespace}`);
                            suggestions.push(completionItem);
                        }
                    }
                }
            }

            return suggestions;
        },
    };
}

function eventCompletionProvider() {
    return {
        provideCompletionItems() {
            const events = [];

            const workspaceFolders = vscode.workspace.workspaceFolders;

            if (!workspaceFolders) {
                return null;
            }

            for (const folder of workspaceFolders) {
                const basePath = path.join(folder.uri.fsPath, 'packages/Webkul');

                if (!fs.existsSync(basePath)) {
                    continue; // Skip if the base path doesn't exist
                }

                const phpFiles = getAllPhpFiles(basePath);

                phpFiles.forEach((file) => {
                    const content = fs.readFileSync(file, 'utf-8');
                    events.push(...extractEventsFromContent(content));
                });
            }

            return events.map((event) => {
                const insertText = new vscode.SnippetString(event.insertText);
                const item = new vscode.CompletionItem(event.lable, vscode.CompletionItemKind.Snippet);

                item.insertText = insertText;
                item.label = event.lable;

                item.detail = 'Bagisto Events';

                return item;
            });
        },
    };
}

/**
 * Provides completion items for dependency injection within the constructor area of a class.
 *
 * @returns {vscode.CompletionItemProvider} - A provider for completion items.
 */
function dependencyInjectionCompletionProvider() {
    return {
        provideCompletionItems: (document, position) => {
            const documentText = document.getText();
            const lineText = document.lineAt(position).text;

            // Ensure the trigger text includes "wkpr"
            if (!lineText.includes('wkpr')) return;

            // Validate Construct Area
            if (!validateConstructArea(document, position)) return;

            // Get all `use` statements starting with Webkul
            const allClasses = parseUseStatements(documentText);

            // Get already injected classes in __construct
            const injectedClasses = parseConstructInjectedClasses(documentText);

            // Filter classes not used in __construct
            const filteredClasses = allClasses.filter(cls => {
                const classNameParts = cls.split('\\');
                const lastPart = classNameParts[classNameParts.length - 1];
                return !injectedClasses.includes(lastPart);
            });

            // Return completion items or nothing if the list is empty
            if (filteredClasses.length === 0) return;

            return filteredClasses.map(cls => {
                const className = cls.split('\\').pop();
                const item = new vscode.CompletionItem(`protected ${cls}`, vscode.CompletionItemKind.Class);
                item.insertText = `protected ${className} \$${className.charAt(0).toLowerCase() + className.slice(1)},`;
                item.documentation = new vscode.MarkdownString(`Insert protected dependency for ${cls}.`);

                item.label = `Webkul:protected ${className} \$${className.charAt(0).toLowerCase() + className.slice(1)}`;

                return item;
            });
        }
    }
}

function createClassCompletionProvider() {
    return {
        provideCompletionItems: async (document, position) => {
            const wordRange = document.getWordRangeAtPosition(position);
            const currentWord = document.getText(wordRange);

            const keywordMap = ["cl"];

            const keyword = currentWord.slice(2, 4).toLowerCase();

            if (!keywordMap.includes(keyword)) {
                return undefined;
            }

            let suggestions = [];

            const filePath = document.fileName;

            const { namespace, className, template } = generateClassTemplate(filePath);

            if (template) {
                const completionItem = new vscode.CompletionItem(
                    `Class ${className} (${document.fileName})`,
                    vscode.CompletionItemKind.Snippet
                );

                completionItem.insertText = template;

                completionItem.documentation = new vscode.MarkdownString(
                    `Generate a class template with namespace **${namespace}** and class name **${className}**.`
                );

                completionItem.label = `Webkul : Class ${className}`;

                suggestions.push(completionItem);
            }

            return suggestions;
        }
    }
}

module.exports = {
    createCompletionProvider,
    dependencyInjectionCompletionProvider,
    createClassCompletionProvider,
    eventCompletionProvider
};
