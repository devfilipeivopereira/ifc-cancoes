import { lazy, Suspense } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "./lib/theme";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const SongsPage = lazy(() => import("./pages/SongsPage").then((module) => ({ default: module.SongsPage })));
const SongPage = lazy(() => import("./pages/SongPage").then((module) => ({ default: module.SongPage })));
const ServicesPage = lazy(() => import("./pages/ServicesPage").then((module) => ({ default: module.ServicesPage })));
const EventPage = lazy(() => import("./pages/EventPage").then((module) => ({ default: module.EventPage })));
const InsightsPage = lazy(() => import("./pages/InsightsPage").then((module) => ({ default: module.InsightsPage })));

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/musicas" element={<SongsPage />} />
              <Route path="/musicas/:id" element={<SongPage />} />
              <Route path="/cultos" element={<ServicesPage />} />
              <Route path="/cultos/:id" element={<EventPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route
                path="*"
                element={
                  <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                    <h1 className="text-3xl font-extrabold">Página não encontrada</h1>
                    <Link className="btn btn-primary mt-6" to="/">
                      Voltar ao início
                    </Link>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function PageFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="h-8 w-40 rounded-full bg-primary/15" />
      <div className="mt-4 h-4 w-64 max-w-full rounded-full bg-primary/10" />
    </div>
  );
}
