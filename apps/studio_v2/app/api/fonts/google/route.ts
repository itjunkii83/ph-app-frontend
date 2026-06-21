import { NextRequest, NextResponse } from 'next/server';

// Top 200 Google Fonts as fallback
const POPULAR_FONTS = [
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
  'Raleway', 'PT Sans', 'Merriweather', 'Noto Sans', 'Ubuntu', 'Playfair Display',
  'Poppins', 'Roboto Condensed', 'Roboto Slab', 'Nunito', 'Inter', 'Quicksand',
  'Mukta', 'Rubik', 'Work Sans', 'Noto Serif', 'Fira Sans', 'Barlow',
  'IBM Plex Sans', 'Karla', 'Cabin', 'Libre Franklin', 'Josefin Sans', 'Arimo',
  'Bitter', 'Crimson Text', 'Dosis', 'Exo 2', 'Hind', 'Inconsolata',
  'Libre Baskerville', 'Lobster', 'Mulish', 'Nunito Sans', 'Oxygen', 'Pacifico',
  'PT Serif', 'Source Code Pro', 'Source Serif Pro', 'Space Grotesk', 'Titillium Web',
  'Yanone Kaffeesatz', 'Abel', 'Acme', 'Alegreya', 'Anton', 'Archivo',
  'Asap', 'Assistant', 'Barlow Condensed', 'Be Vietnam Pro', 'Catamaran',
  'Comfortaa', 'Cormorant Garamond', 'DM Sans', 'EB Garamond', 'Figtree',
  'Heebo', 'Jost', 'Kanit', 'Lexend', 'Manrope', 'Maven Pro',
  'Nanum Gothic', 'Outfit', 'Overpass', 'Philosopher', 'Plus Jakarta Sans',
  'Prompt', 'Red Hat Display', 'Saira', 'Signika', 'Space Mono',
  'Spectral', 'Tajawal', 'Teko', 'Urbanist', 'Vollkorn', 'Zilla Slab',
  'Advent Pro', 'Alata', 'Amatic SC', 'Archivo Narrow', 'Arvo', 'Bebas Neue',
  'Cairo', 'Chivo', 'Cinzel', 'Cormorant', 'Dancing Script', 'Domine',
  'Encode Sans', 'Exo', 'Fira Sans Condensed', 'Fjalla One', 'Fredoka One',
  'Great Vibes', 'Gruppo', 'Hammersmith One', 'Hind Siliguri', 'IBM Plex Mono',
  'IBM Plex Serif', 'Indie Flower', 'Jura', 'Kalam', 'Lora',
  'M PLUS Rounded 1c', 'Merriweather Sans', 'Monda', 'Noto Sans JP',
  'Old Standard TT', 'Orbitron', 'Pathway Gothic One', 'Patrick Hand',
  'Permanent Marker', 'Press Start 2P', 'Questrial', 'Rajdhani',
  'Recursive', 'Roboto Mono', 'Rokkitt', 'Sacramento', 'Sawarabi Gothic',
  'Shadows Into Light', 'Signika Negative', 'Slabo 27px', 'Sono',
  'Sora', 'Spline Sans', 'Staatliches', 'Varela Round', 'Yantramanav',
];

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.toLowerCase() || '';

  try {
    // Try Google Fonts API metadata endpoint
    const res = await fetch(
      'https://fonts.google.com/metadata/fonts',
      { next: { revalidate: 86400 } }
    );

    if (res.ok) {
      const text = await res.text();
      // Google Fonts metadata has a ")]}'" prefix
      const json = JSON.parse(text.replace(/^\)\]\}'/, ''));
      const families: any[] = json.familyMetadataList || [];

      const filtered = families
        .filter((f: any) => f.family.toLowerCase().includes(q))
        .slice(0, 20)
        .map((f: any) => ({
          family: f.family,
          category: f.category || '',
          variants: f.fonts ? Object.keys(f.fonts) : ['regular'],
        }));

      return NextResponse.json(filtered);
    }
  } catch {
    // Fall through to local list
  }

  // Fallback to bundled list
  const filtered = POPULAR_FONTS
    .filter((f) => f.toLowerCase().includes(q))
    .slice(0, 20)
    .map((family) => ({
      family,
      category: '',
      variants: ['regular', '700'],
    }));

  return NextResponse.json(filtered);
}
