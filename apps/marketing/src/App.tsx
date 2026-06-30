import { Nav } from './sections/Nav';
import { Hero } from './sections/Hero';
import { Problem } from './sections/Problem';
import { Features } from './sections/Features';
import { HowItWorks } from './sections/HowItWorks';
import { CtaBand } from './sections/CtaBand';
import { Footer } from './sections/Footer';

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
