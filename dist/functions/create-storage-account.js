"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
exports.default = (pkg) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const handleCreatedAccount = ({ stdout }) => __awaiter(void 0, void 0, void 0, function* () {
            const newAccountData = JSON.parse(stdout);
            console.log(`Created storage account for ${newAccountData.name}: ${newAccountData.primaryEndpoints.web}`);
            yield (0, child_process_promise_1.exec)(`az storage blob service-properties update --account-name ${newAccountData.name} --static-website --404-document index.html --index-document index.html`);
            console.log(`Enabled web container for storage account: ${newAccountData.name}`);
        });
        yield (0, child_process_promise_1.exec)(`az storage account create --resource-group ${pkg.resourceGroup} --name ${pkg.id} --location northeurope --kind StorageV2`)
            .then(handleCreatedAccount)
            .catch((err) => {
            throw Error(err);
        });
        yield (0, child_process_promise_1.exec)(`az storage account create --resource-group ${pkg.resourceGroup} --name ${pkg.id}stag --location northeurope --kind StorageV2`)
            .then(({ stdout }) => __awaiter(void 0, void 0, void 0, function* () { return handleCreatedAccount({ stdout }); }))
            .catch((err) => {
            throw Error(err);
        });
    }
    catch (err) {
        throw Error(err);
    }
});
