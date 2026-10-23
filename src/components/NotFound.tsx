import { Link } from "@tanstack/react-router";

import { Navbar } from "./Navbar";

export function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto p-8">
        <h1 className="text-4xl font-medium">Page introuvable</h1>
        <p className="mt-6">
          Cette page n’existe pas ou plus.{" "}
          <Link to="/" className="text-link underline">
            Retour à l’accueil
          </Link>
        </p>
      </main>
    </>
  );
}
