const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const FileTemplates = require('./templates/FileTemplates');

/**
 * Command to create a module with a specific structure.
 */
async function createModule() {
    try {
        // Step 1: Get Module Name
        const moduleNameInput = await vscode.window.showInputBox({
            prompt: 'Enter the Module Name',
            placeHolder: 'e.g., POS',
            validateInput: (input) => input ? null : 'Module name cannot be empty.'
        });
        if (!moduleNameInput) return;

        const moduleName = moduleNameInput.charAt(0).toUpperCase() + moduleNameInput.slice(1).toLowerCase();

        // Step 2: Get Namespace Prefix
        const namespacePrefix = await createNameSpace(moduleName);

        // Step 3: Define Module Path
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a workspace folder first.');
            return;
        }

        const workspacePath = workspaceFolders[0].uri.fsPath;
        const modulePath = path.join(workspacePath, `packages/Webkul/${moduleName}`);

        // Step 4: Create Directory Structure
        const dirs = [
            `${modulePath}/src/Database`,
            `${modulePath}/src/Models`,
            `${modulePath}/src/Provider`,
            `${modulePath}/src/Http/Controllers`,
            `${modulePath}/src/Routes`
        ];
        dirs.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

        // Step 5: Generate Files with Templates
        const serviceProviderPath = path.join(modulePath, 'src/Provider', `${moduleName}ServiceProvider.php`);
        const controllerPath = path.join(modulePath, 'src/Http/Controllers', 'Controller.php');
        const routesPath = path.join(modulePath, 'src/Routes', 'web.php');

        // Write content using templates
        fs.writeFileSync(serviceProviderPath, FileTemplates.serviceProviderTemplate(namespacePrefix, moduleName));
        fs.writeFileSync(controllerPath, FileTemplates.controllerTemplate(namespacePrefix));
        fs.writeFileSync(routesPath, FileTemplates.routesTemplate(namespacePrefix, moduleName));

        vscode.window.showInformationMessage(`Module "${moduleName}" created successfully!`);
    } catch (error) {
        vscode.window.showErrorMessage('An error occurred while creating the module.');
    }
}

async function createNameSpace(moduleName) {
    const textUpper = moduleName.toUpperCase().trim();

    const words = textUpper.split(' ');

    if (words.length === 1) {
        return `Webkul\\${words[0].charAt(0) + words[0].slice(1).toLowerCase()}`
    }

    const capitalizedWords = words.map(word => word.charAt(0) + word.slice(1).toLowerCase());

    return `Webkul\\${capitalizedWords.join('')}`;
}

module.exports = createModule;
