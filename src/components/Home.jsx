import Hero from "./Hero.jsx";
import PatchSection from "./PatchSection.jsx";
import DownloadSection from "./DownloadSection.jsx";
import ChangelogSection from "./ChangelogSection.jsx";

export default function Home({ setView }) {
  return (
    <>
      <Hero setView={setView} />
      <PatchSection />
      <DownloadSection />
      <ChangelogSection />
    </>
  );
}
