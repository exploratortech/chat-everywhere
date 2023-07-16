<<<<<<< HEAD
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { ReactPlugin } from "@microsoft/applicationinsights-react-js";

interface IHistory {
    url: string;
    location: {
        pathname: string;
    };
    listen: () => void;
}

const defaultBrowserHistory: IHistory = {
=======
import { ApplicationInsights } from "@microsoft/applicationinsights-web" 
import { ReactPlugin } from "@microsoft/applicationinsights-react-js"

const defaultBrowserHistory = {
>>>>>>> eea64c9 (App insights config file)
    url: "/",
    location: { pathname: "" },
    listen: () => {},
};
<<<<<<< HEAD

let browserHistory: IHistory = defaultBrowserHistory;
if (typeof window !== "undefined") {
    browserHistory = { ...browserHistory, ...window.history };
    browserHistory.location.pathname = (browserHistory as any)?.state?.url || "";
}

const enableAzureTracking = process.env.NEXT_PUBLIC_ENV === 'production';

const reactPlugin: ReactPlugin = new ReactPlugin();
const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY as string,
        maxBatchSizeInBytes: 10000, 
        maxBatchInterval: 15000,
        id: `/subscriptions/${process.env.NEXT_PUBLIC_TENANT_ID}/resourceGroups/chat-everywhere/providers/microsoft.insights/components/chat-everywhere`,
        name: "chat-everywhere",
        type: "microsoft.insights/components",
        location: "koreasouth",
        tags: {},
        kind: "web",
        etag: "\"2a02893f-0000-2600-0000-64b2fe190000\"",
        properties: {
            ApplicationId: "chat-everywhere",
            AppId: process.env.NEXT_PUBLIC_APP_INSIGHTS_APP_ID as string,
            Application_Type: "web",
            Flow_Type: "Redfield",
            Request_Source: "IbizaAIExtension",
            InstrumentationKey: process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY as string,
            ConnectionString: `InstrumentationKey=${process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY as string};IngestionEndpoint=https://koreasouth-0.in.applicationinsights.azure.com/`,
            Name: "chat-everywhere",
            CreationDate: "2023-05-21T21:31:54.9548061+00:00",
            TenantId: process.env.NEXT_PUBLIC_TENANT_ID as string,
            provisioningState: "Succeeded",
            SamplingPercentage: null,
            RetentionInDays: 90,
            WorkspaceResourceId: `/subscriptions/${process.env.NEXT_PUBLIC_TENANT_ID}/resourcegroups/DefaultResourceGroup-koreasouth/providers/Microsoft.OperationalInsights/workspaces/DefaultWorkspace-${process.env.NEXT_PUBLIC_TENANT_ID}-koreasou`,
=======
let browserHistory = defaultBrowserHistory;
if (typeof window !== "undefined") {
    browserHistory = {...browserHistory, ...window.history };
    browserHistory.location.pathname = browserHistory?.state?.url;
}

const reactPlugin = new ReactPlugin();
const appInsights = new ApplicationInsights ({
    config: {
        instrumentationKey: process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY,
        maxBatchSizeInBytes: 10000, 
        maxBatchInterval: 15000,
        id: process.env.NEXT_PUBLIC_APP_INSIGHTS_ID,
        name: process.env.NEXT_PUBLIC_APP_INSIGHTS_NAME,
        type: process.env.NEXT_PUBLIC_APP_INSIGHTS_TYPE,
        location: process.env.NEXT_PUBLIC_APP_INSIGHTS_LOCATION,
        tags: {
            "Chat Everwhere": "Azure Application Insights"
        },
        kind: "web",
        etag: "\"3f0248a4-0000-0100-0000-64b307560000\"",
        properties: {
            ApplicationId: process.env.NEXT_PUBLIC_APP_INSIGHTS_APPLICATION_ID,
            AppId: process.env.NEXT_PUBLIC_APP_INSIGHTS_APP_ID,
            Application_Type: "web",
            Flow_Type: "Redfield",
            Request_Source: "IbizaAIExtension",
            InstrumentationKey: process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY,
            ConnectionString: `InstrumentationKey=${process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY};IngestionEndpoint=https://${process.env.NEXT_PUBLIC_APP_INSIGHTS_LOCATION}.in.applicationinsights.azure.com/;LiveEndpoint=https://${process.env.NEXT_PUBLIC_APP_INSIGHTS_LOCATION}.livediagnostics.monitor.azure.com/`,
            Name: process.env.NEXT_PUBLIC_APP_INSIGHTS_NAME,
            CreationDate: "2023-07-15T20:51:17.4963681+00:00",
            TenantId: process.env.NEXT_PUBLIC_APP_INSIGHTS_TENANT_ID,
            provisioningState: "Succeeded",
            SamplingPercentage: null,
            RetentionInDays: 90,
            WorkspaceResourceId: process.env.NEXT_PUBLIC_APP_INSIGHTS_WORKSPACE_RESOURCE_ID,
>>>>>>> eea64c9 (App insights config file)
            IngestionMode: "LogAnalytics",
            publicNetworkAccessForIngestion: "Enabled",
            publicNetworkAccessForQuery: "Enabled",
            Ver: "v2"
        },
        extensions: [reactPlugin],
        extensionConfig: {
            [reactPlugin.identifier]: { history: browserHistory }
        }
<<<<<<< HEAD
    } as any
});

//Load insights only in production
if (enableAzureTracking && typeof window !== "undefined") {
    appInsights.loadAppInsights();
}

export { appInsights, reactPlugin, enableAzureTracking };
=======
    }
});
if (typeof window !== "undefined") {
    appInsights.loadAppInsights();
}

export { appInsights, reactPlugin };
>>>>>>> eea64c9 (App insights config file)
