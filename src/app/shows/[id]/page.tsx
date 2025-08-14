import { use } from 'react';
import shows from '@/data/shows.json';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import CustomCursor from '@/components/CustomCursor';

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = shows.find((s: any) => s.id === id);

  if (!show) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <CustomCursor />
      <Navigation />
      <div className="py-3 flex-shrink-0" style={{ backgroundColor: 'var(--color-clay)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-lg font-bold text-black font-mono">Shows</h1>
        </div>
      </div>
      
      {/* Full width and height iframe */}
      <div className="flex-1 w-full">
        <iframe 
          src={show.humanitixEmbed ? show.humanitixEmbed.match(/src='([^']+)'/)?.[1] : ''}
          width="100%" 
          height="100%" 
          frameBorder="0"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
} 