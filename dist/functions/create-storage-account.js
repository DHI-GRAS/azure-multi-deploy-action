"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const chalk_1 = __importDefault(require("chalk"));
chalk_1.default.level = 1;
exports.default = async (pkg) => {
    try {
        const handleCreatedAccount = async ({ stdout }) => {
            const newAccountData = JSON.parse(stdout);
            console.log(`${chalk_1.default.bold.green('Success')}: Created storage account for ${chalk_1.default.bold(newAccountData.name)}: ${chalk_1.default.bold(newAccountData.primaryEndpoints.web)}`);
            await (0, child_process_promise_1.exec)(`az storage blob service-properties update --account-name ${newAccountData.name} --static-website --404-document index.html --index-document index.html`);
            console.log(`${chalk_1.default.bold.blue('Info')}: Enabled web container for storage account: ${newAccountData.name}`);
        };
        for (const storageAccount of pkg.mssingAccounts) {
            await (0, child_process_promise_1.exec)(`az storage account create --resource-group ${pkg.resourceGroup} --name ${storageAccount} --location northeurope --kind StorageV2 --sku Standard_LRS`)
                .then(async ({ stdout }) => handleCreatedAccount({ stdout }))
                .catch((err) => {
                throw Error(err);
            });
        }
    }
    catch (err) {
        throw Error(err);
    }
};
