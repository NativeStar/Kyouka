import { type Hooker } from "js-hooker";
import { type ExtensionConfig, type PreHookOption } from "../../types";
import { AbstractTool } from "../classes/abstractTool";
import { languageLocations } from "../../types";
import { makeDateObjectToString } from "../util";
export class ChangeLanguageLocation extends AbstractTool {
    onMount(config: ExtensionConfig, hooker: Hooker): void {
        const targetLanguage = config.changeLanguageLocation;
        const targetTimezone = languageLocations[config.changeLanguageLocation]?.timezone ?? null;
        const targetNavigatorLanguages = languageLocations[config.changeLanguageLocation]?.navigatorLanguages ?? null;
        const targetLocationString = languageLocations[config.changeLanguageLocation]?.locationString ?? null;
        if (!("Temporal" in window)) {
            console.error("Temporal is not supported,please update your browser!ChangeLanguageLocation skipped mount.");
            return
        }
        if (!targetTimezone || !targetNavigatorLanguages || !targetLocationString || targetLanguage === "unset") {
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
            beforeMethodInvoke(_args, abortController, thisArg, tempMethodResult, originMethod) {
                abortController.abort();
                const currentTime = originMethod.apply(thisArg);
                if (isNaN(currentTime)) {
                    tempMethodResult.current = NaN;
                    return
                }
                tempMethodResult.current = Temporal.Instant
                    .fromEpochMilliseconds(currentTime)
                    .toZonedDateTimeISO(targetTimezone)
                    .offsetNanoseconds / 60_000_000_000;
            }
        });
        hooker.hookMethod(Date.prototype, "toString", {
            beforeMethodInvoke(_args, abortController, thisArg, tempMethodResult) {
                abortController.abort();
                if (!(thisArg instanceof Date)) {
                    throw new TypeError(`Method Date.prototype.toString called on incompatible receiver ${thisArg}`);
                }
                if (isNaN(thisArg.getTime())) {
                    tempMethodResult.current = "Invalid Date";
                    return
                }
                tempMethodResult.current = makeDateObjectToString(thisArg, targetLocationString)
            }
        })
        hooker.hookObject(Intl, "DateTimeFormat", {
            beforeApply([locale, options], abortController, thisArg, tempResult, originApply) {
                tempResult.current = originApply.call(thisArg, locale ?? targetLanguage,
                    {
                        ...options,
                        timeZone: options?.timeZone ?? targetTimezone
                    }
                );
                abortController.abort();
            },
            beforeConstruct([locale, options], abortController, tempResult, originConstruct) {
                tempResult.current = new originConstruct(locale ?? targetLanguage,
                    {
                        ...options,
                        timeZone: options?.timeZone ?? targetTimezone
                    }
                );
                abortController.abort();
            }
        })
    }
    get preHookMethodList(): PreHookOption[] {
        return [
            {
                parent: Intl.DateTimeFormat.prototype,
                methodName: "resolvedOptions",
                type: "method",
                id: "pre#resolvedOptions"
            },
            {
                parent: Date.prototype,
                methodName: "getTimezoneOffset",
                type: "method",
                id: "pre#getTimezoneOffset"
            },
            {
                parent: Date.prototype,
                methodName: "toString",
                type: "method",
                id: "pre#toString"
            }
        ];
    }
}