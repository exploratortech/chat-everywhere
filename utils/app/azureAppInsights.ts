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

const reactPlugin: ReactPlugin = new ReactPlugin();
const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY as string,
        maxBatchSizeInBytes: 10000, 
        maxBatchInterval: 15000,
        id: process.env.NEXT_PUBLIC_APP_INSIGHTS_ID as string,
        name: process.env.NEXT_PUBLIC_APP_INSIGHTS_NAME as string,
        type: process.env.NEXT_PUBLIC_APP_INSIGHTS_TYPE as string,
        location: process.env.NEXT_PUBLIC_APP_INSIGHTS_LOCATION as string,
        tags: {
            "Chat Everwhere": "Azure Application Insights"
        },
        kind: "web",
        etag: "\"3f0248a4-0000-0100-0000-64b307560000\"",
        properties: {
            ApplicationId: process.env.NEXT_PUBLIC_APP_INSIGHTS_APPLICATION_ID as string,
            AppId: process.env.NEXT_PUBLIC_APP_INSIGHTS_APP_ID as string,
            Application_Type: "web",
            Flow_Type: "Redfield",
            Request_Source: "IbizaAIExtension",
            InstrumentationKey: process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY as string,
            ConnectionString: `InstrumentationKey=${process.env.NEXT_PUBLIC_APP_INSIGHTS_INSTRUMENTATION_KEY};IngestionEndpoint=https://${process.env.NEXT_PUBLIC_APP_INSIGHTS_LOCATION}.in.applicationinsights.azure.com/;LiveEndpoint=https://${process.env.NEXT_PUBLIC_APP_INSIGHTS_LOCATION}.livediagnostics.monitor.azure.com/`,
            Name: process.env.NEXT_PUBLIC_APP_INSIGHTS_NAME as string,
            CreationDate: "2023-07-15T20:51:17.4963681+00:00",
            TenantId: process.env.NEXT_PUBLIC_APP_INSIGHTS_TENANT_ID as string,
            provisioningState: "Succeeded",
            SamplingPercentage: null,
            RetentionInDays: 90,
            WorkspaceResourceId: process.env.NEXT_PUBLIC_APP_INSIGHTS_WORKSPACE_RESOURCE_ID as string,
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
if (typeof window !== "undefined") {
    appInsights.loadAppInsights();
}

const enableAzureTracking = process.env.NEXT_PUBLIC_ENV === 'production';

export { appInsights, reactPlugin, enableAzureTracking };