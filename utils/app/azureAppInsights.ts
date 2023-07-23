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
    url: "/",
    location: { pathname: "" },
    listen: () => {},
};

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
            IngestionMode: "LogAnalytics",
            publicNetworkAccessForIngestion: "Enabled",
            publicNetworkAccessForQuery: "Enabled",
            Ver: "v2"
        },
        extensions: [reactPlugin],
        extensionConfig: {
            [reactPlugin.identifier]: { history: browserHistory }
        }
    } as any
});

//Load insights only in production
if (enableAzureTracking && typeof window !== "undefined") {
    appInsights.loadAppInsights();
}

export { appInsights, reactPlugin, enableAzureTracking };