import NoticeBanner from "./NoticeBanner.jsx";
import Hero from "./Hero.jsx";
import PatchSection from "./PatchSection.jsx";
import DownloadSection from "./DownloadSection.jsx";
import ChangelogSection from "./ChangelogSection.jsx";

export default function Home({ setView }) {
  return (
    <>
      <NoticeBanner />
      <Hero setView={setView} />
      <PatchSection />
      <DownloadSection />
      <ChangelogSection />
    </>
  );
}
