// app/map/page.tsx
'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamic import supaya ga kena SSR error
const MapClient = dynamic(() => import('../../components/MapClient'), { ssr: false });

export default function MapPage() {
  return (
    <main style={{ width: '100%', height: '100vh' }}>
      <MapClient />
    </main>
  );
}
