import Link from "next/link";
import { notFound } from "next/navigation";
import { PRACTICAL_GUIDES, GUIDE_VERSION, GUIDE_SOURCE_CHECK_DATE } from "@/lib/public-content/practicalGuides";
import styles from "@/components/public/FurlongExperience.module.css";
export function generateStaticParams() { return PRACTICAL_GUIDES.map(guide => ({ slug: guide.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = PRACTICAL_GUIDES.find(item => item.slug === slug);
  return { title: guide ? guide.title + " | Furlong" : "Guide not found | Furlong", description: guide?.summary };
}
export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = PRACTICAL_GUIDES.find(item => item.slug === slug);
  if (!guide) notFound();
  return <article className={styles.page}>
    <Link href="/guides">All practical guides</Link>
    <h1>{guide.title}</h1><p>{guide.summary}</p>
    <p className={styles.note}>Prepared by Furlong with AI assistance. Source links checked {GUIDE_SOURCE_CHECK_DATE}. Professional review is not claimed. Version {GUIDE_VERSION}.</p>
    <p className={styles.note}>{guide.scope}</p>
    {guide.sections.map(section => <section key={section.title} className={styles.section}><h2>{section.title}</h2><p>{section.text}</p></section>)}
    <section className={styles.section}><h2>Sources and further reading</h2><ul>{guide.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>
      <p>These sources provide general guidance, not verification of your individual property or eligibility. Recheck the source and the responsible local authority before relying on a requirement.</p>
    </section>
    <Link className={styles.primary} href="/#explore">Explore my property or project</Link>
  </article>;
}
