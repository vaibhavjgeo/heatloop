import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HeatLoop - Data-Centre Waste Heat × Geothermal Siting for Germany",
  description:
    "Assess waste-heat reuse of German data centres against EnEfG targets and score new sites by subsurface and heat-demand potential. Built on open data and thesis research.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f7f5f0'/%3E%3Ctext x='50' y='72' text-anchor='middle' fill='%232d6a4f' font-family='Georgia, serif' font-weight='700' font-style='italic' font-size='64'%3EH%3C/text%3E%3C/svg%3E"
        />
      </head>
      <body>
        <header className="site">
          <div className="wrap nav-inner">
            <Link href="/" className="logo" aria-label="HeatLoop home">
              Heat<span className="logo-accent">Loop</span>
            </Link>
            <nav className="main">
              <ul>
                <li><Link href="/">Home</Link></li>
                <li><Link href="/assess">Assess a Data Centre</Link></li>
                <li><Link href="/site">Find a Site</Link></li>
                <li>
                  <a href="https://vaibhavjgeo.vercel.app" target="_blank" rel="noopener">
                    Portfolio ↗
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site">
          <div className="wrap row">
            <div>HeatLoop · Vaibhav Jaiswal · built on open data (OpenStreetMap, CMIP6, EnEfG)</div>
            <div>First-pass planning estimates, not engineering advice · €0/month infrastructure</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
