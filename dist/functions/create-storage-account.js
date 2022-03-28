"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
exports.default = async (pkg) => {
    try {
        const handleCreatedAccount = async ({ stdout }) => {
            const newAccountData = JSON.parse(stdout);
            console.log(`Created storage account for ${newAccountData.name}: ${newAccountData.primaryEndpoints.web}`);
            await (0, child_process_promise_1.exec)(`az storage blob service-properties update --account-name ${newAccountData.name} --static-website --404-document index.html --index-document index.html`);
            console.log(`Enabled web container for storage account: ${newAccountData.name}`);
        };
        await (0, child_process_promise_1.exec)(`az storage account create --resource-group ${pkg.resourceGroup} --name ${pkg.id} --location northeurope --kind StorageV2`)
            .then(handleCreatedAccount)
            .catch((err) => {
            throw Error(err);
        });
        await (0, child_process_promise_1.exec)(`az storage account create --resource-group ${pkg.resourceGroup} --name ${pkg.id}stag --location northeurope --kind StorageV2`)
            .then(async ({ stdout }) => handleCreatedAccount({ stdout }))
            .catch((err) => {
            throw Error(err);
        });
    }
    catch (err) {
        throw Error(err);
    }
};
