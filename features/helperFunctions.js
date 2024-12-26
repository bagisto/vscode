const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Validates whether the cursor position is within the parameter area of
 * the `__construct` method in a PHP class.
 *
 * @param {vscode.TextDocument} document - The document where the validation is performed.
 * @param {vscode.Position} position - The current cursor position.
 * @returns {boolean} - Returns true if the cursor is in the parameter area of `__construct`.
 */
function validateConstructArea(document, position) {
    const documentText = document.getText();

    const constructMatch = documentText.match(/public\s+function\s+__construct\s*\(([\s\S]*?)\)/);

    if (! constructMatch) {
        return false;
    }

    const [constructDeclaration] = constructMatch;

    const constructStart = documentText.indexOf(constructDeclaration);

    const constructEnd = constructStart + constructDeclaration.length;

    const cursorOffset = document.offsetAt(position);

    return cursorOffset >= constructStart && cursorOffset <= constructEnd;
}

/**
 * Parses the "use" statements from the document text and extracts fully qualified
 * class names, including grouped imports and alias classes, but only if they start with "Webkul".
 *
 * @param {string} documentText - The text content of the current document.
 * @returns {string[]} - An array of fully qualified class names or aliases starting with "Webkul".
 */
function parseUseStatements(documentText) {
    const useRegex = /^use\s+(Webkul\\[^\s{;]+)(?:\s+as\s+([\w]+))?(?:\{([^}]+)\})?;/gm;

    const matches = [...documentText.matchAll(useRegex)];

    const importedClasses = [];

    for (const match of matches) {
        const baseNamespace = match[1];

        const alias = match[2];

        const groupedClasses = match[3];

        if (groupedClasses) {
            groupedClasses.split(',').map(cls => cls.trim()).forEach(cls => {
                importedClasses.push(`${baseNamespace}\\${cls}`);
            });
        } else {
            importedClasses.push(alias ? alias : baseNamespace);
        }
    }

    return importedClasses;
}

/**
 * Parses the constructor method in the class to identify already injected classes,
 * extracting their names for exclusion from the suggestions.
 *
 * @param {string} documentText - The text content of the current document.
 * @returns {string[]} - An array of class names already injected in the constructor.
 */
function parseConstructInjectedClasses(documentText) {
    const constructRegex = /__construct\([\s\S]*?\)/;

    const constructMatch = documentText.match(constructRegex);

    if (!constructMatch) return [];

    const paramsRegex = /protected\s+([\w\\]+)\s+\$[\w]+/g;

    const matches = [...constructMatch[0].matchAll(paramsRegex)];

    return matches.map(match => match[1]);
}

/**
 * Extract namespace from a PHP file.
 * @param {string} filePath
 * @returns {string|null}
 */
function getNamespaceFromFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        const namespaceMatch = content.match(/namespace\s+([^\s;]+)\s*;/);

        const classNameMatch = path.basename(filePath, '.php');

        return namespaceMatch ? `${namespaceMatch[1]}\\${classNameMatch}` : null;
    } catch (error) {
        return null;
    }
}

/**
 * Recursively find directories matching a specific name or pattern.
 * @param {string} basePath - The root directory to start the search from.
 * @param {RegExp} namePattern - A regex pattern to match directory names.
 * @returns {string[]} - An array of matching directory paths.
 */
function findDirectories(basePath, namePattern) {
    let directories = [];
    try {
        const items = fs.readdirSync(basePath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(basePath, item.name);

            if (item.isDirectory()) {
                if (namePattern.test(item.name)) {
                    directories.push(fullPath); // Add matching directory
                }

                // Recursively search subdirectories
                directories = directories.concat(findDirectories(fullPath, namePattern));
            }
        }
    } catch (err) {
    }

    return directories;
}

/**
 * Recursively fetch all `.php` files from a given directory.
 * @param {string} dirPath - The directory path to scan for PHP files.
 * @returns {string[]} - An array of PHP file paths.
 */
function getAllPhpFiles(dirPath) {
    let phpFiles = [];
    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);

            if (item.isDirectory()) {
                // Recursively search subdirectories
                phpFiles = phpFiles.concat(getAllPhpFiles(fullPath));
            } else if (item.isFile() && item.name.endsWith('.php')) {
                phpFiles.push(fullPath);
            }
        }
    } catch (err) {
    }

    return phpFiles;
}

/**
 * Extract `view_render_event` and `Event::dispatch` statements from PHP content.
 * @param {string} content - The PHP file content.
 * @returns {Array} - List of parsed events.
 */
function extractEventsFromContent(content) {
    const events = [];

    // Regex for events
    const viewRenderRegex = /view_render_event\('([^']+)'(?:, ?(.+))?\)/g;

    const dispatchRegex = /Event::dispatch\('([^']+)'(?:, ?(.+))?\)/g;

    let match;

    while ((match = viewRenderRegex.exec(content)) !== null) {
        const eventName = match[1];

        const parameter = match[2] ? match[2].trim() : null;

        const insertText = `Event::listen('${eventName}', function (\\$viewRenderEventManager) {\n` +
            `    \\$viewRenderEventManager->addTemplate('');\n` +
            `});`

        let lable = parameter ? `${eventName} | ${parameter}` : eventName;

        lable = 'Webkul Event Rander:' + lable;

        events.push({
            type: 'view_render_event',
            eventName,
            parameter,
            insertText,
            lable,
        });
    }

    while ((match = dispatchRegex.exec(content)) !== null) {
        const eventName = match[1];

        const parameter = match[2] ? match[2].trim() : null;

        const insertText = `Event::listen('${eventName}', );`

        let lable = parameter ? `${eventName} | ${parameter}` : eventName;

        lable = 'Webkul Event Dispatch: ' + lable;

        events.push({
            type: 'Event Dispatch',
            eventName,
            parameter,
            insertText,
            lable,
        });
    }

    return events;
}

module.exports = {
    validateConstructArea,
    parseUseStatements,
    parseConstructInjectedClasses,
    getNamespaceFromFile,
    findDirectories,
    getAllPhpFiles,
    extractEventsFromContent,
};