import ReactLenis from 'lenis/react';
import { ViewTransitions } from 'next-view-transitions';

import UmamiAnalytics from '@/components/analytics/UmamiAnalytics';
import ChatBubble from '@/components/common/ChatBubble';
import Footer from '@/components/common/Footer';
import Navbar from '@/components/common/Navbar';
import OnekoCat from '@/components/common/OnekoCat';
import { PublicShell } from '@/components/common/PublicShell';
import { Quote } from '@/components/common/Quote';
import { ThemeProvider } from '@/components/common/ThemeProviders';
import { Toaster } from '@/components/ui/sonner';
import { generateMetadata as getMetadata } from '@/config/Meta';

import './globals.css';

export const metadata = getMetadata('/');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <body className={`font-hanken-grotesk antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ReactLenis root>
              <PublicShell>
                <Navbar />
              </PublicShell>
              {children}
              <PublicShell>
                <OnekoCat />
                <Quote />
                <Footer />
                <ChatBubble />
              </PublicShell>
              <UmamiAnalytics />
            </ReactLenis>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
