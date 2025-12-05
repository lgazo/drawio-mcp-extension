import { WxtBrowser } from "wxt/browser";

type DeclarativeRule = NonNullable<
    Parameters<typeof browser.declarativeNetRequest.updateDynamicRules>[0]["addRules"]
>[number];

const DRAWIO_CSP_RULE_ID = 1001;
const WS_RULE_VALUES = "ws://localhost:* wss://localhost:*";
const WS_CSP_RULE_ID = 1002;
const WS_CSP_HEADER_VALUE = [
    "default-src 'self'",
    "script-src https://www.dropbox.com https://api.trello.com 'self' https://viewer.diagrams.net https://apis.google.com https://*.pusher.com 'sha256-f6cHSTUnCvbQqwa6rKcbWIpgN9dLl0ROfpEKTQUQPr8=' 'sha256-vS/MxlVD7nbY7AnV+0t1Ap338uF7vrcs7y23KjERhKc='",
    `connect-src https://*.dropboxapi.com https://api.trello.com https://3axinmwptbp2engjl5hovms4ta0lbvit.lambda-url.eu-central-1.on.aws 'self' https://*.draw.io https://*.diagrams.net https://*.googleapis.com wss://app.diagrams.net wss://*.pusher.com https://*.pusher.com https://api.github.com https://raw.githubusercontent.com https://gitlab.com https://graph.microsoft.com https://my.microsoftpersonalcontent.com https://*.sharepoint.com https://*.sharepoint.de https://*.1drv.com https://api.onedrive.com https://dl.dropboxusercontent.com https://api.openai.com https://*.google.com https://fonts.gstatic.com https://fonts.googleapis.com ${WS_RULE_VALUES}`,
    "img-src * data: blob:",
    "media-src * data:",
    "font-src * data: about:",
    "frame-src 'self' https://viewer.diagrams.net https://www.draw.io https://*.google.com",
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'",
    "base-uri 'none'",
    "child-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'self' https://teams.microsoft.com https://*.cloud.microsoft",
].join("; ");

const DRAWIO_CSP_RULE: DeclarativeRule = {
    id: DRAWIO_CSP_RULE_ID,
    priority: 1,
    action: {
        type: "block" as const,
    },
    condition: {
        urlFilter: "https://*/service-worker.js",
        resourceTypes: ["main_frame", "sub_frame", "script"] as const,
    },
};


const WS_CSP_RULE: DeclarativeRule = {
    id: WS_CSP_RULE_ID,
    priority: 2,
    action: {
        type: "modifyHeaders" as const,
        responseHeaders: [
            {
                header: "Content-Security-Policy",
                operation: "remove" as const,
            },
            {
                header: "content-security-policy",
                operation: "set" as const,
                value: WS_CSP_HEADER_VALUE,
            },
        ],
    },
    condition: {
        urlFilter: "https://app.diagrams.net/*",
        resourceTypes: ["main_frame", "sub_frame"] as const,
    },
};

let wsCspRuleApplied = false;

async function enableWsCspRule() {
    if (wsCspRuleApplied) return;
    await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [DRAWIO_CSP_RULE_ID],
        addRules: [DRAWIO_CSP_RULE],
    });
    await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [WS_CSP_RULE_ID],
        addRules: [WS_CSP_RULE],
    });
    console.debug(`enabled ws csp`, WS_CSP_RULE);
    wsCspRuleApplied = true;
}

async function disableWsCspRule() {
    if (!wsCspRuleApplied) return;
    await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [DRAWIO_CSP_RULE_ID],
        addRules: [],
    });
    await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [WS_CSP_RULE_ID],
        addRules: [],
    });
    wsCspRuleApplied = false;
}

const wsRuleConsumers = new Set<number>();

browser.tabs
    .query({ url: "https://app.diagrams.net/*" })
    .then((tabs) => {
        tabs.forEach((tab) => {
            if (typeof tab.id === "number") {
                registerWsRuleConsumer(tab.id).catch((error) => {
                    console.error(
                        "[background] Failed to register CSP rule for existing tab",
                        error,
                    );
                });
            }
        });
    })
    .catch((error) => {
        console.error(
            "[background] Failed to bootstrap CSP rule registration",
            error,
        );
    });


async function registerWsRuleConsumer(tabId?: number) {
    if (typeof tabId !== "number") {
        console.warn("[background] Unable to register CSP rule without tabId");
        return;
    }

    wsRuleConsumers.add(tabId);
    if (wsRuleConsumers.size === 1) {
        try {
            await enableWsCspRule();
            console.debug("[background] WebSocket CSP rule enabled");
        } catch (error) {
            console.error(
                "[background] Failed to enable WebSocket CSP rule",
                error,
            );
        }
    }
}

async function unregisterWsRuleConsumer(tabId?: number) {
    if (typeof tabId !== "number") return;
    if (!wsRuleConsumers.delete(tabId)) return;
    if (wsRuleConsumers.size === 0) {
        try {
            await disableWsCspRule();
            console.debug("[background] WebSocket CSP rule disabled");
        } catch (error) {
            console.error(
                "[background] Failed to disable WebSocket CSP rule",
                error,
            );
        }
    }
}

export function register_csp(browser: WxtBrowser) {

    browser.tabs.onRemoved.addListener((tabId) => {
        if (!wsRuleConsumers.has(tabId)) return;
        unregisterWsRuleConsumer(tabId).catch((error) => {
            console.error(
                "[background] Failed to unregister CSP rule consumer on tab removal",
                error,
            );
        });
    });

    browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        const url = changeInfo.url ?? tab.url;
        if (url && url.startsWith("https://app.diagrams.net/")) {
            console.debug(`[tabs.onUpdated] registering WebSocket CSP`);
            try {
                await registerWsRuleConsumer(tabId);
            } catch (error) {
                console.error(
                    "[background] Failed to register CSP rule consumer on tab update",
                    error,
                );
            }

            // const dynamic = await browser.declarativeNetRequest.getDynamicRules();
            // console.log(`dynamic`, dynamic);

            // const rulesets = await browser.declarativeNetRequest.getEnabledRulesets();
            // console.log(`ruleset`, rulesets);
            // browser.declarativeNetRequest.testMatchOutcome({
            //   url: 'https://app.diagrams.net',
            //   method: 'get',
            //   type: 'main_frame',
            //   tabId,  // Use -1 for hypothetical requests
            // }, (result) => {
            //   console.log('Test outcome:', result);
            // });
            return;
        }

        if (!wsRuleConsumers.has(tabId)) return;
        if (!url) return;
        unregisterWsRuleConsumer(tabId).catch((error) => {
            console.error(
                "[background] Failed to unregister CSP rule consumer on tab update",
                error,
            );
        });
    });

}