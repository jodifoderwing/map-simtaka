// components/MenuBar.tsx

import { FaSearch, FaPlusCircle, FaInfoCircle } from 'react-icons/fa'; // Contoh pakai react-icons
import styles from './MenuBar.module.css';

export default function MenuBar({ onAddPolygon, onShowInfo }: { onAddPolygon: () => void, onShowInfo: () => void }) {
  return (
    <div className={styles.menuBar}>
      <button className={styles.menuButton} onClick={onAddPolygon}>
        <FaPlusCircle size={24} />
        <span>Add Polygon</span>
      </button>
      <button className={styles.menuButton} onClick={onShowInfo}>
        <FaInfoCircle size={24} />
        <span>Show Info</span>
      </button>
      <button className={styles.menuButton}>
        <FaSearch size={24} />
        <span>Search</span>
      </button>
    </div>
  );
}
