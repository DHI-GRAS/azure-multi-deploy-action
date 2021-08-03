# Azure multi-deploy action

More documentation to come  

## Example project workflow file
See the example recommended workflow in [workflow-template.yml](https://github.com/DHI-GRAS/azure-multi-deploy-action/blob/main/action.yml)

## Basic usage notes

- Linux must be used
- The action will install Azure CLI
- Action does not handle installation of dependencies - they must be installed in a step before the action is run
- `clientId`, `tenantId`, `clientSecret`, `subscriptionId` are required in the `azureCredentials` input, formatted as JSON
- For other inputs, see `action.yml`
