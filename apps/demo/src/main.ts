import "./style.css";

import { DemoApplication } from "./DemoApplication";

const appContainer = document.querySelector<HTMLDivElement>("#app");

if (!appContainer) {
    throw new Error("Application container (#app) not found.");
}

const application = new DemoApplication();

application.run(appContainer).catch((error: unknown) => {
    console.error("UAE failed to start.", error);
});