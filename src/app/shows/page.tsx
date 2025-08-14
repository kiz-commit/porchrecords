"use client";
import Navigation from '@/components/Navigation';
import CustomCursor from '@/components/CustomCursor';
import Link from 'next/link';
import Image from 'next/image';
import shows from '@/data/shows.json';

function EventRow({ show, isPast }: { show: any; isPast: boolean }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Link href={`/shows/${show.id}`} className="block">
      <div className="flex flex-col md:flex-row w-full border-b hover:opacity-80 transition-opacity cursor-pointer" 
           style={{ 
             minHeight: 220,
             backgroundColor: 'var(--color-offwhite)',
             borderColor: 'var(--color-clay)'
           }}>
        {/* Image Column */}
        {show.image && (
          <div className="md:w-1/4 relative">
            <Image
              src={show.image}
              alt={show.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          </div>
        )}
        
        {/* Date Column */}
        <div className={`p-6 border-r border-b md:border-b-0 ${show.image ? 'md:w-1/4' : 'md:w-1/3'}`}
             style={{ borderColor: 'var(--color-clay)' }}>
          <div className="font-mono font-bold text-lg uppercase tracking-wide"
               style={{ color: 'var(--color-black)' }}>
            {formatDate(show.date)}
          </div>
          <div className="font-mono text-sm mt-1"
               style={{ color: 'var(--color-black)', opacity: 0.7 }}>
            {formatTime(show.date)}
          </div>
        </div>
        
        {/* Event Details */}
        <div className={`p-6 ${show.image ? 'md:w-1/2' : 'md:w-2/3'}`}>
          <h3 className="font-mono font-bold text-xl mb-2 uppercase tracking-wide"
              style={{ color: 'var(--color-black)' }}>
            {show.title}
          </h3>
          <p className="font-mono text-base mb-4"
             style={{ color: 'var(--color-black)', opacity: 0.8 }}>
            {show.description}
          </p>
          <div className="font-mono text-sm"
               style={{ color: 'var(--color-black)', opacity: 0.7 }}>
            <p>📍 {show.location}</p>
            {show.humanitixEmbed && !isPast && (
              <span 
                className="inline-block mt-2 px-4 py-2 border font-bold"
                style={{ borderColor: 'var(--color-black)' }}
              >
                GET TICKETS
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ShowsPage() {
  // Filter to only show published shows
  const publishedShows = shows.filter((show: any) => show.isPublished !== false);
  
  const now = new Date();
  const upcoming = publishedShows.filter((show: any) => new Date(show.date) > now);
  const past = publishedShows.filter((show: any) => new Date(show.date) <= now);

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <CustomCursor />
      <Navigation />
      <div className="py-3" style={{ backgroundColor: 'var(--color-clay)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-lg font-bold text-black font-mono">Shows</h1>
        </div>
      </div>
      <main className="flex-grow shows-page" 
            style={{ 
              background: 'var(--color-offwhite)', 
              minHeight: '100vh', 
              padding: '2rem 0' 
            }}>
        <div className="max-w-5xl mx-auto w-full">
          <section className="mb-16">
            <h2 className="font-mono font-bold text-2xl mb-6 uppercase tracking-wide" 
                style={{ color: 'var(--color-black)' }}>Upcoming Events</h2>
            {upcoming.length === 0 && <p style={{ color: 'var(--color-black)' }}>Big tasty announcement, coming soon xo</p>}
            <div className="flex flex-col gap-0">
              {upcoming.map((show: any) => (
                <EventRow key={show.id} show={show} isPast={false} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="font-mono font-bold text-2xl mb-6 uppercase tracking-wide" 
                style={{ color: 'var(--color-black)' }}>Past Events</h2>
            {past.length === 0 && <p style={{ color: 'var(--color-clay)' }}>No past shows yet.</p>}
            <div className="flex flex-col gap-0">
              {past.map((show: any) => (
                <EventRow key={show.id} show={show} isPast={true} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
} 