import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>
          🗡️ SAO TTRPG 🗡️
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', textAlign: 'center', color: '#666' }}>
          Welcome to the Sword Art Online Tabletop RPG System
        </p>

        <div className={styles.ctas}>
          <Link
            className={styles.primary}
            href="/player"
          >
            👥 View Players
          </Link>
          <Link
            href="/gm"
            className={styles.secondary}
          >
            🎲 Game Master Dashboard
          </Link>
        </div>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
            Quick Links:
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/player/550e8400-e29b-41d4-a716-446655440001" style={{ 
              padding: '8px 16px', 
              background: '#f0f0f0', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              color: '#333',
              fontSize: '0.9rem'
            }}>
              🗡️ Kirito
            </Link>
            <Link href="/player/550e8400-e29b-41d4-a716-446655440002" style={{ 
              padding: '8px 16px', 
              background: '#f0f0f0', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              color: '#333',
              fontSize: '0.9rem'
            }}>
              ⚔️ Asuna
            </Link>
            <Link href="/player/550e8400-e29b-41d4-a716-446655440003" style={{ 
              padding: '8px 16px', 
              background: '#f0f0f0', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              color: '#333',
              fontSize: '0.9rem'
            }}>
              🔥 Klein
            </Link>
          </div>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
