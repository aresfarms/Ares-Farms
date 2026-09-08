import Link from "next/link";
import { PRACTICAL_GUIDES } from "@/lib/public-content/practicalGuides";
import styles from "@/components/public/FurlongExperience.module.css";
export const metadata = { title: "Practical property and project guides | Furlong", description: "Prepare better questions about property, business projects, financing evidence and agricultural land." };
export default function GuidesPage() {
  return <div className={styles.page}><h1>Start with better questions</h1><p>Practical preparation guides. Explore the evidence you need before committing to a property or project.</p>
    <div className={styles.grid}>{PRACTICAL_GUIDES.map(guide => <article key={guide.slug} className={styles.card}><h2 style={{ fontSize: 21 }}><Link href={"/guides/" + guide.slug}>{guide.title}</Link></h2><p>{guide.summary}</p></article>)}</div>
    <p><Link href="/#explore">Explore your own project</Link></p>
  </div>;
}
