/// <reference types="react-scripts" />

interface Window {
  grecaptcha: {
    enterprise: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  };
}

declare var grecaptcha: Window['grecaptcha'];
