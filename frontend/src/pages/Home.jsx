import { BadgeCheck, Link2, ScrollText, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { btnHeroPrimary, btnHeroSecondary, cardClass } from "../lib/styles";
import PageTitle from "../components/PageTitle";

const features = [
  {
    title: "Tamper-evident records",
    text: "A certificate fingerprint is recorded by an authorized issuer. Changing the underlying details changes the fingerprint.",
    icon: ShieldCheck,
  },
  {
    title: "Fast verification",
    text: "Enter a certificate ID, or open a QR link, and compare the submitted details with the on-chain record.",
    icon: BadgeCheck,
  },
  {
    title: "Transparent issuer history",
    text: "Each record shows the issuer wallet, the issuance time, and whether it has been revoked.",
    icon: Link2,
  },
];

const steps = [
  { title: "Issue", text: "An authorized college wallet submits the certificate fingerprint." },
  { title: "Record", text: "The smart contract stores the hash, issuer, time, and revocation status." },
  { title: "Verify", text: "Anyone can check a certificate ID and the same canonical details." },
];

export default function Home() {
  return (
    <div>
      <PageTitle title="Home" />
      <section className="bg-navy-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-200">Academic credential registry</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Verify Academic Credentials with Confidence
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-200">
              Check certificate records against a tamper-evident blockchain registry.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/verify" className={btnHeroPrimary}>
                Verify a Certificate
              </Link>
              <Link to="/issuer" className={btnHeroSecondary}>
                Issuer Portal
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-300">
              Built for transparent verification. No student documents are stored on-chain.
            </p>
          </div>
          <div className={`${cardClass} relative p-6 text-ink sm:p-8`}>
            <div className="absolute inset-x-0 top-0 h-2 rounded-t-2xl bg-teal-brand" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Demo University</p>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-serif text-2xl text-navy-900">Record of study</p>
                <p className="mt-2 text-sm text-muted">Sample preview for the interface only.</p>
              </div>
              <ScrollText className="text-navy-800" aria-hidden="true" />
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Student" value="Asha Mehta" />
              <Row label="Program" value="B.Sc. Computer Science" />
              <Row label="Status" value="Checked against the registry" />
            </dl>
            <p className="mt-6 text-xs font-semibold tracking-wide text-danger">DEMO / NOT AN OFFICIAL ACADEMIC DOCUMENT</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className={`${cardClass} p-5`}>
              <feature.icon className="text-teal-brand" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-navy-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.text}</p>
            </article>
          ))}
        </div>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className={`${cardClass} p-5`}>
              <p className="text-sm font-semibold text-teal-brand">0{index + 1}</p>
              <h2 className="mt-2 text-lg font-semibold text-navy-900">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-navy-900">{value}</dd>
    </div>
  );
}
