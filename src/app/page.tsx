import Image from "next/image";
import Navigation from '@/components/Navigation';
import CustomCursor from '@/components/CustomCursor';
import HomepageSectionsManager from '@/components/HomepageSections/HomepageSectionsManager';
import { HomepageClient } from '@/components/HomepageClient';

interface HeroImage {
  id: string;
  src: string;
  alt: string;
  order: number;
}

// Default images for immediate loading
const defaultImages: HeroImage[] = [
  { id: '1', src: '/hero-image.jpg', alt: 'Porch Records Hero 1', order: 1 },
  { id: '2', src: '/hero-image2.jpg', alt: 'Porch Records Hero 2', order: 2 },
  { id: '3', src: '/hero-image3.jpg', alt: 'Porch Records Hero 3', order: 3 },
];

export default async function Home() {
  // Preload homepage data on the server
  let homepageData = null;
  let homepageConfig = null;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Load homepage data in parallel
    const [dataResponse, configResponse] = await Promise.all([
      fetch(`${baseUrl}/api/homepage/data`, { 
        cache: 'force-cache',
        next: { revalidate: 300 }
      }),
      fetch(`${baseUrl}/api/admin/site-config?key=homepage`, {
        cache: 'force-cache',
        next: { revalidate: 300 }
      })
    ]);

    if (dataResponse.ok) {
      const data = await dataResponse.json();
      if (data.success) {
        homepageData = data;
      }
    }

    if (configResponse.ok) {
      const config = await configResponse.json();
      homepageConfig = config.config_value;
    }
  } catch (error) {
    console.error('Error preloading homepage data:', error);
  }

  return (
    <div className="flex flex-col">
      <CustomCursor />
      <Navigation />
      
      {/* Hero Section - Client Component */}
      <HomepageClient 
        homepageData={homepageData}
        homepageConfig={homepageConfig}
      />

      {/* Configurable Homepage Sections */}
      <HomepageSectionsManager preloadedSections={homepageData?.sections} />
    </div>
  );
}
