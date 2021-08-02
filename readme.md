# Azure multi-deploy action

More documentation to come  


## Basic usage notes

- Linux must be used
- The action will install Azure CLI
- Action does not handle installation of dependencies - they must be installed in a step before the action is run
- `clientId`, `tenantId`, `clientSecret`, `subscriptionId` are required in the `azureCredentials` input, formatted as JSON
- For other inputs, see `action.yml`