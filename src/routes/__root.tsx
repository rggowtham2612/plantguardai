import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { Leaf } from "lucide-react";
import { installPaymentRequiredLogging } from "@/lib/payment-logging";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4">
      <div className="glass rounded-2xl p-10 max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-brand">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This field is fallow. Let's get you back to solid ground.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg gradient-brand px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-105"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center gradient-hero px-4">
      <div className="glass rounded-2xl p-10 max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PlantGuard AI — AI-powered crop disease detection" },
      {
        name: "description",
        content:
          "Upload a leaf image and receive instant AI disease diagnosis, treatment recommendations, and prevention tips for your crops.",
      },
      { property: "og:title", content: "PlantGuard AI — AI-powered crop disease detection" },
      {
        property: "og:description",
        content:
          "Upload a leaf image and receive instant AI disease diagnosis, treatment recommendations, and prevention tips for your crops.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PlantGuard AI — AI-powered crop disease detection" },
      { name: "twitter:description", content: "Upload a leaf image and receive instant AI disease diagnosis, treatment recommendations, and prevention tips for your crops." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ef7b639b-2631-4710-b3c6-4bc5fb3516dc/id-preview-0a632581--de4424ff-29c6-44a5-8d83-bcc7f164ff1b.lovable.app-1784767120491.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ef7b639b-2631-4710-b3c6-4bc5fb3516dc/id-preview-0a632581--de4424ff-29c6-44a5-8d83-bcc7f164ff1b.lovable.app-1784767120491.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-xl gradient-brand flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <Leaf className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg">
            PlantGuard <span className="text-gradient-brand">AI</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Home
          </Link>
          <Link
            to="/library"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Library
          </Link>
          <Link
            to="/history"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            History
          </Link>
          <Link
            to="/detect"
            className="inline-flex items-center rounded-lg gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:scale-105 transition-transform"
          >
            Detect Disease
          </Link>
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => installPaymentRequiredLogging(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen gradient-hero">
        <SiteHeader />
        <Outlet />
        <Toaster richColors position="top-center" />
      </div>
    </QueryClientProvider>
  );
}
