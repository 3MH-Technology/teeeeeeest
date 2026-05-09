import "./globals.css";
export const metadata = {
    title: "وولف هوستنق | منصة المطورين العرب",
    description: "منصة استضافة بوتات مجانية، خاصة، وآمنة — مصممة خصيصاً للمطورين العرب. خصوصية أولاً، بدون تتبع، بدون تحليلات مخفية.",
    keywords: "استضافة بوتات, تيليقرام, مطورين عرب, خصوصية, wolf hosting, bot hosting",
    robots: "index, follow",
    openGraph: {
        title: "وولف هوستنق | منصة المطورين العرب",
        description: "المنصة العربية الأولى لاستضافة البوتات — مجانية وآمنة",
        type: "website",
        locale: "ar_SA",
    },
};
export default function RootLayout({ children, }) {
    return (<html lang="ar" dir="rtl">
      <head>
        <meta name="theme-color" content="#08090d"/>
        <meta name="color-scheme" content="dark"/>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>);
}
