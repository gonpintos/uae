import type { IntroData } from "@uae/engine";

export const demoIntroData: IntroData = {
    backgroundColor: "#000000",
    textColor: "#fff3a6",
    screens: [
        {
            type: "text",
            text: "COPENHAGUE\n1999",
            durationMs: 2200,
            fontSize: 68,
            lineHeight: 86
        },
        {
            type: "image",
            assetId: "intro-presentation",
            aspectRatio: 1672 / 941,
            caption: [
                "Tres jóvenes argentinos.",
                "Una ciudad desconocida.",
                "Y una economía que exige hacer cuentas."
            ].join("\n"),
            durationMs: 5000
        },
        {
            type: "text",
            text: "LOS ANTEOJOS DE FRANCO",
            durationMs: 2500,
            fontSize: 60,
            lineHeight: 72
        }
    ]
};
