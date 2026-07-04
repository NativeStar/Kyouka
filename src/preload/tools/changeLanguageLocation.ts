import { type Hooker } from "js-hooker";
import { type ExtensionConfig, type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
import { languageLocations } from "../../types";
export class ChangeLanguageLocation extends AbstractTool {
    onMount(config: ExtensionConfig, hooker: Hooker): void {
        const targetLanguage = config.changeLanguageLocation;
        const targetTimezone = languageLocations[config.changeLanguageLocation]?.timezone ?? null;
        const targetNavigatorLanguages = languageLocations[config.changeLanguageLocation]?.navigatorLanguages ?? null;
        if (!("Temporal" in window)) {
            console.error("Temporal is not supported,please update your browser!ChangeLanguageLocation skipped mount.");
            return
        }
        if (!targetTimezone || !targetNavigatorLanguages || targetLanguage === "unset") {
            console.error(`Invalid language location: ${config.changeLanguageLocation}`);
            return
        }
        hooker.hookAccessor(Navigator.prototype, "language", {
            beforeGetterInvoke(abortController, _thisArg, tempMethodResult) {
                tempMethodResult.current = targetLanguage
                abortController.abort();
            },
            descriptor: {
                enumerable: true,
                configurable: true
            }
        });
        hooker.hookAccessor(Navigator.prototype, "languages", {
            beforeGetterInvoke(abortController, _thisArg, tempMethodResult) {
                tempMethodResult.current = structuredClone(targetNavigatorLanguages);
                abortController.abort();
            },
            descriptor: {
                enumerable: true,
                configurable: true
            }
        });
        hooker.hookMethod(Intl.DateTimeFormat.prototype, "resolvedOptions", {
            afterMethodInvoke(_args, tempMethodResult) {
                tempMethodResult.current.locale = targetLanguage;
                tempMethodResult.current.timeZone = targetTimezone;
            }
        });
        hooker.hookMethod(Date.prototype, "getTimezoneOffset", {
            beforeMethodInvoke(_args, abortController, _thisArg, tempMethodResult) {
                tempMethodResult.current = -(Temporal.Now.zonedDateTimeISO(targetTimezone).offsetNanoseconds / 60_000_000_000);
                abortController.abort();
            }
        });
    }
    get preHookMethodList(): PreHookOption[] {
        return [];
    }
}