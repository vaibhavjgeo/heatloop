import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HeatLoop - Data-Centre Waste Heat × Geothermal Siting for Germany",
  description:
    "Assess waste-heat reuse of German data centres against EnEfG targets and score new sites by subsurface and heat-demand potential. Built on open data and thesis research.",
};

const MAIN = "https://vaibhavjgeo.vercel.app";

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
            <a href={`${MAIN}/`} className="logo" aria-label="Home">
              Vaibhav <span className="logo-accent">Jaiswal</span>
            </a>
            <nav className="main">
              <ul>
                <li><a href={`${MAIN}/`}>Home</a></li>
                <li><Link href="/" className="active">HeatLoop</Link></li>
                <li><a href={`${MAIN}/thesis/`}>Master Thesis</a></li>
                <li><a href={`${MAIN}/bhe/`}>BHE Recommender</a></li>
                <li><a href={`${MAIN}/geochat/`}>GeoChat</a></li>
              </ul>
            </nav>
            <a href="https://github.com/vaibhavjgeo/heatloop" className="nav-github" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
              <span>GitHub</span>
            </a>
          </div>
        </header>
        {children}
        <footer className="site" id="contact">
          <div className="wrap">
            <div className="footer-top">
              <div>
                <p className="footer-tagline">Let&apos;s <em>research</em> something together.</p>
              </div>
              <div className="footer-col">
                <h5>Navigate</h5>
                <ul>
                  <li><a href={`${MAIN}/`}>Home</a></li>
                  <li><Link href="/">HeatLoop</Link></li>
                  <li><a href={`${MAIN}/thesis/`}>Master Thesis</a></li>
                  <li><a href={`${MAIN}/bhe/`}>BHE Recommender</a></li>
                  <li><a href={`${MAIN}/geochat/`}>GeoChat</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h5>Contact</h5>
                <ul>
                  <li><a href="mailto:vaibhavjaiswal1234@gmail.com">Email</a></li>
                  <li><a href="https://github.com/vaibhavjgeo">GitHub</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <div>Vaibhav Jaiswal · Karlsruhe, DE</div>
              <div>© 2026 · Built with care · Vercel</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
