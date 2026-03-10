import { groq } from "next-sanity";
import { sanityClient } from "@/lib/sanity";

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
}

const postsQuery = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt
  }
`;

export default async function BlogPage() {
  const posts = await sanityClient.fetch<Post[]>(postsQuery);

  return (
    <main>
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <div className="grid gap-6">
        {posts.map((post) => (
          <article key={post._id}>
            <a href={`/blog/${post.slug.current}`}>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-gray-600 mt-1">{post.excerpt}</p>
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
