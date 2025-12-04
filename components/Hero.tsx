import Link from 'next/link';
import styles from './ResourceCard.module.css';

interface HeroProps {
  siteName?: string | null;
  steps?: any[]; // Keep existing steps prop if it was there, though previous view didn't show it being used in the rendered output, but HomeClient passes it. Wait, HomeClient passes `steps` to Hero?
}

const Hero = ({ siteName }: HeroProps) => {
  return (
    <div className="bg-light rounded-3 shadow-sm border p-3 p-md-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center align-items-md-center">
        <p className="fs-4 mb-3 mb-md-0 text-center">Accede a equipo y espacios disponibles en {siteName || 'Fluxio RSV'}.</p>
        <Link href="/how-it-works" className={`btn ${styles.customPrimaryButton}`}>
          Cómo funciona
        </Link>
      </div>
    </div>
  );
};

export default Hero;
