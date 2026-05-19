// src/lib/wordpress.ts

const WP_URL = import.meta.env.WORDPRESS_API_URL;

export interface WPPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  author: string;
  image: string;
  readTime: string;
}

// Helper para formatear la fecha
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function fetchAPI(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${WP_URL}/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch API from WordPress: ${response.statusText}`);
  }
  return response.json();
}

export async function getBlogPosts(): Promise<WPPost[]> {
  // _embed=true es clave para obtener imágenes destacadas, categorías y autores en una sola petición
  const data = await fetchAPI("posts", { _embed: "true", per_page: "100" });

  return data.map((post: any) => {
    // Obtener la imagen destacada
    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
    const image = featuredMedia?.source_url || "/wood-framing.png"; // Fallback por si no tiene imagen

    // Obtener la categoría (tomamos la primera asociada)
    const termCategories = post._embedded?.['wp:term']?.[0] || [];
    const category = termCategories.length > 0 ? termCategories[0].name : "General";

    // Obtener el autor
    const authorObj = post._embedded?.author?.[0];
    const author = authorObj?.name || "Avonce Team";

    // Obtener el campo personalizado de ACF para tiempo de lectura
    const readTime = post.acf?.read_time || "4 min read";

    return {
      id: post.id,
      slug: post.slug,
      title: post.title.rendered,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, ''), // Limpiamos etiquetas HTML del extracto
      content: post.content.rendered,
      date: formatDate(post.date),
      category,
      author,
      image,
      readTime
    };
  });
}

export async function getCategories() {
  return fetchAPI("categories", { hide_empty: "true" });
}
