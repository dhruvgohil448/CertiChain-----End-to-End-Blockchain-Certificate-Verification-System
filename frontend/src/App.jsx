import { Component } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { WalletProvider } from "./context/WalletContext";
import CertificateDetails from "./pages/CertificateDetails";
import Home from "./pages/Home";
import IssuerDashboard from "./pages/IssuerDashboard";
import VerifyCertificate from "./pages/VerifyCertificate";
import { btnPrimary } from "./lib/styles";

export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <AppErrorBoundary>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/issuer" element={<IssuerDashboard />} />
              <Route path="/verify" element={<VerifyCertificate />} />
              <Route path="/certificate/:id" element={<CertificateDetails />} />
            </Route>
          </Routes>
        </AppErrorBoundary>
      </WalletProvider>
    </BrowserRouter>
  );
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold text-navy-900">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{this.state.error.message}</p>
        <button type="button" className={`${btnPrimary} mt-6`} onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    );
  }
}
