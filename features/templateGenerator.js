const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

/**
 * Create the generated class template to the specified file.
 */
function createClassTemplate() {
    const editor = vscode.window.activeTextEditor;

    if (! editor) {
        vscode.window.showErrorMessage('No active editor found!');
        
        return;
    }

    const document = editor.document;
    const filePath = document.fileName;

    try {
        if (! filePath 
            || ! filePath.endsWith('.php')) {
            throw new Error('The current file must be a PHP file!');
        }

        const { template } = generateClassTemplate(filePath);

        fs.writeFileSync(filePath, template, 'utf8');

        vscode.window.showInformationMessage('PHP class template generated successfully!');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate class template: ${error.message}`);
    }
}

/**
 * Generate a PHP class template for the provided file path.
 * @param {string} filePath - The full file path.
 * @returns {{ namespace: string, className: string, template: string }} - The generated namespace, class name, and template.
 */
function generateClassTemplate(filePath) {
    if (! filePath) {
        throw new Error('Invalid file path provided');
    }

    const parts = filePath.split(path.sep);

    const packagesIndex = parts.findIndex((part) => part.toLowerCase() === 'packages');
    
    if (packagesIndex === -1) {
        throw new Error('"packages" directory not found in the file path');
    }

    // Create namespace by excluding "src" and file name
    const namespaceParts = parts.slice(packagesIndex + 1, -1).filter(
        (part) => part.toLowerCase() !== 'src'
    );
    const namespace = namespaceParts.join('\\');

    const className = path.basename(filePath, '.php');

    const template = `<?php

namespace ${namespace};

class ${className}
{
}
`;
    return {
        'namespace': namespace,
        'className': className,
        'template': template
    }
}

module.exports = {
    generateClassTemplate,
    createClassTemplate,
};
