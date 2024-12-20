/**
 * Templates for various files in the module.
 */
const FileTemplates = {
    serviceProviderTemplate: (namespace, moduleName) => `<?php

namespace ${namespace}\\Provider;

use Illuminate\\Support\\ServiceProvider;

class ${moduleName}ServiceProvider extends ServiceProvider
{
    public function register()
    {
        // Register services
    }

    public function boot()
    {
        // Boot services
    }
}
`,

    controllerTemplate: (namespace) => `<?php

namespace ${namespace}\\Http\\Controller;

use Illuminate\\Http\\Request;

class Controller
{
    public function index(Request $request)
    {
        return response()->json(['message' => 'Hello from the controller']);
    }
}
`,

    routesTemplate: (namespace, moduleName) => `<?php

use Illuminate\\Support\\Facades\\Route;

Route::get('/${moduleName.toLowerCase()}', [\\${namespace}\\Http\\Controller\\Controller::class, 'index']);
`
};

module.exports = FileTemplates;
