# Azure multi-deploy action

Automates the build and deployment of Azure web and function apps. In open PRs, seperate staging deployments are automatically made.  
Supports 2 repository structures:
- Monorepo: with web apps in the `apps` dir, and function apps in the `func-apps` dir.
- Single web app: a standard single web app repo, with build output expected to be in `./dist`

More documentation to come  

## Example project workflow file
See the example recommended workflow in [workflow-template.yml](https://github.com/DHI-GRAS/azure-multi-deploy-action/blob/main/action.yml)

## Basic usage notes

- Linux must be used
- The action will install Azure CLI
- Action does not handle installation of dependencies - they must be installed in a step before the action is run

#### "azureDeployConfig" key in package.json 

- `clientId`, `tenantId`, `clientSecret`, `subscriptionId` are required and formatted as JSON
- `outputDir` is optional and represents the location of your output directory with default set to `./dist`.
- `enableCorsApiIds` is optional and represents an array of Function Apps resourceIds that need to enable cors for the staging storage accounts.
- `ignore` is optional and represents and if passed with value `true`, then the app/func-app deployment for staging and production will be ignored.
- For other inputs, see `action.yml`


## Setup checklist for single app projects

- If using builder, App.tsx, index.html, index.tsx should be in `src/app`
- Add `id` and `resourceGroup` to "azureDeployConfig" key in package.json. (`id` is used as the storage account name)
- Ensure that the `{name}:build` script is present in package.json, `name` being the package name in package.json
- Add workflow file, recommended template [workflow-template.yml](https://github.com/DHI-GRAS/azure-multi-deploy-action/blob/main/action.yml) can be used
- Add a set of Federated Credentials, linking to your Github Repo, to the App Registration [dhi-eocoe-frontend-deployment ](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Credentials/appId/e5dfbfe7-f4e2-4fff-9629-ef4083e854d1/isMSAApp~/false) ()
- Add `AZURE_CREDENTIALS` to repository secrets

