// ABOUTME: Bilingual (English and Danish) privacy notice for idaromme.dk (Issue #482, audit SEC-15)
// ABOUTME: Names the controller, each service that handles visitor data, retention and visitors' rights

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy - Ida Romme',
  description:
    'How idaromme.dk handles visitor data: no cookies, cookie-free visitor statistics, and contact-form messages kept until the conversation is finished.',
  alternates: {
    canonical: 'https://idaromme.dk/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const LAST_UPDATED_EN = '17 November 2026'
const LAST_UPDATED_DA = '17. november 2026'

export default function PrivacyPage() {
  return (
    <div
      className="nordic-container"
      style={{ minHeight: '100vh', paddingTop: '100px' }}
    >
      <section
        id="english"
        aria-labelledby="privacy-en"
        className="nordic-section"
      >
        <div className="nordic-content">
          <h1 id="privacy-en" className="nordic-display nordic-spacing-md">
            Privacy
          </h1>
          <p className="nordic-body-small nordic-spacing-md">
            Last updated {LAST_UPDATED_EN} ·{' '}
            <a href="#dansk" className="nordic-link-inline" hrefLang="da" lang="da">
              Dansk
            </a>
          </p>
          <p className="nordic-body nordic-spacing-lg">
            This website is run by Ida Romme, who is responsible for the
            personal data described here. For questions or requests, use the{' '}
            <Link href="/contact" className="nordic-link-inline">
              contact page
            </Link>
            .
          </p>

          <h2 className="nordic-h3 nordic-spacing-sm">No cookies</h2>
          <p className="nordic-body nordic-spacing-lg">
            This website sets no cookies, so there is no cookie banner.
          </p>

          <h2 className="nordic-h3 nordic-spacing-sm">Visitor statistics</h2>
          <p className="nordic-body nordic-spacing-lg">
            Visits are counted with Umami, which runs on the site&apos;s own
            analytics server at analytics.idaromme.dk. It records which pages
            are viewed, how fast they load, and actions such as sending the
            contact form. Umami uses no cookies and does not store your IP
            address, so the statistics cannot identify you.
          </p>

          <h2 className="nordic-h3 nordic-spacing-sm">Contact form</h2>
          <p className="nordic-body nordic-spacing-lg">
            When you send the contact form, your name, email address and message
            are passed through Resend, an email delivery service, to Ida
            Romme&apos;s Gmail inbox. They are used only to answer you and are
            kept until the conversation is finished, then deleted. Nothing you
            write in the form is stored on this website&apos;s server. The legal
            basis is Ida Romme&apos;s legitimate interest in answering the
            messages she receives (GDPR Article 6(1)(f)).
          </p>

          <h2 className="nordic-h3 nordic-spacing-sm">Hosting and images</h2>
          <p className="nordic-body nordic-spacing-lg">
            The website runs on a server rented from Vultr in Stockholm, Sweden.
            Like any web server, it logs technical details of each request,
            including your IP address, to keep the site secure and working;
            these logs are kept only as long as that requires. Images and
            project texts are delivered by Sanity&apos;s content service, so
            your browser also connects to Sanity when it loads them.
          </p>

          <h2 className="nordic-h3 nordic-spacing-sm">Your rights</h2>
          <p className="nordic-body nordic-spacing-lg">
            You can ask to see, correct or delete the personal data held about
            you, or object to its use, through the{' '}
            <Link href="/contact" className="nordic-link-inline">
              contact page
            </Link>
            . You can also complain to the data protection authority in your
            country.
          </p>
        </div>
      </section>

      <section
        id="dansk"
        lang="da"
        aria-labelledby="privacy-da"
        className="nordic-section"
      >
        <div className="nordic-content">
          <h2 id="privacy-da" className="nordic-display nordic-spacing-md">
            Privatliv
          </h2>
          <p className="nordic-body-small nordic-spacing-md">
            Senest opdateret {LAST_UPDATED_DA} ·{' '}
            <a href="#english" className="nordic-link-inline" hrefLang="en" lang="en">
              English
            </a>
          </p>
          <p className="nordic-body nordic-spacing-lg">
            Denne hjemmeside drives af Ida Romme, som er ansvarlig for de
            personoplysninger, der beskrives her. Brug{' '}
            <Link href="/contact" className="nordic-link-inline">
              kontaktsiden
            </Link>{' '}
            til spørgsmål og anmodninger.
          </p>

          <h3 className="nordic-h3 nordic-spacing-sm">Ingen cookies</h3>
          <p className="nordic-body nordic-spacing-lg">
            Hjemmesiden sætter ingen cookies, og derfor er der heller intet
            cookiebanner.
          </p>

          <h3 className="nordic-h3 nordic-spacing-sm">Besøgsstatistik</h3>
          <p className="nordic-body nordic-spacing-lg">
            Besøg tælles med Umami, som kører på hjemmesidens egen
            statistikserver på analytics.idaromme.dk. Den registrerer, hvilke
            sider der vises, hvor hurtigt de indlæses, og handlinger som fx
            afsendelse af kontaktformularen. Umami bruger ingen cookies og
            gemmer ikke din IP-adresse, så statistikken kan ikke identificere
            dig.
          </p>

          <h3 className="nordic-h3 nordic-spacing-sm">Kontaktformular</h3>
          <p className="nordic-body nordic-spacing-lg">
            Når du sender kontaktformularen, sendes dit navn, din e-mailadresse
            og din besked via Resend, en tjeneste til afsendelse af e-mails, til
            Ida Rommes Gmail-indbakke. Oplysningerne bruges kun til at svare dig
            og gemmes, indtil samtalen er afsluttet, hvorefter de slettes. Intet
            af det, du skriver i formularen, gemmes på hjemmesidens server.
            Retsgrundlaget er Ida Rommes legitime interesse i at besvare de
            henvendelser, hun modtager (databeskyttelsesforordningens artikel 6,
            stk. 1, litra f).
          </p>

          <h3 className="nordic-h3 nordic-spacing-sm">Hosting og billeder</h3>
          <p className="nordic-body nordic-spacing-lg">
            Hjemmesiden kører på en server, der er lejet hos Vultr i Stockholm,
            Sverige. Som alle webservere logger den tekniske oplysninger om hver
            forespørgsel, herunder din IP-adresse, for at holde siden sikker og
            i drift; loggene gemmes kun så længe, det er nødvendigt til det
            formål. Billeder og projekttekster leveres af Sanitys
            indholdstjeneste, så din browser forbinder også til Sanity, når den
            henter dem.
          </p>

          <h3 className="nordic-h3 nordic-spacing-sm">Dine rettigheder</h3>
          <p className="nordic-body nordic-spacing-lg">
            Du kan via{' '}
            <Link href="/contact" className="nordic-link-inline">
              kontaktsiden
            </Link>{' '}
            bede om at se, rette eller slette de personoplysninger, der er
            registreret om dig, eller gøre indsigelse mod brugen af dem. Du kan
            også klage til databeskyttelsesmyndigheden i dit land (i Danmark
            Datatilsynet).
          </p>
        </div>
      </section>
    </div>
  )
}
