import { groq } from "next-sanity";
import { sanityClient } from "@/lib/sanity";

export const revalidate = 60; // revalidate every 60 seconds

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await sanityClient.fetch(
    groq`*[_type == "post" && slug.current == $slug][0]`,
    { slug: params.slug },
  );

  return (
    <article>
      <h1>{post?.title}</h1>
    </article>
  );
}
