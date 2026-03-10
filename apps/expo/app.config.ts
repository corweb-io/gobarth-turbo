export default {
  expo: {
    scheme: "myapp",
    ios: {
      bundleIdentifier: "com.yourcompany.myapp",
      usesAppleSignIn: true,
      associatedDomains: ["applinks:yourdomain.com"],
    },
    android: {
      package: "com.yourcompany.myapp",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "yourdomain.com",
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    updates: {
      url: "https://u.expo.dev/YOUR_PROJECT_ID",
      enabled: true,
      fallbackToCacheTimeout: 0,
      checkAutomatically: "ON_LOAD",
    },
    runtimeVersion: { policy: "appVersion" },
  },
};
