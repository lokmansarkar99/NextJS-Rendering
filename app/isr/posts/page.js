import { getData } from "@/lib/getData";
import { revalidatePath, revalidateTag } from "next/cache";

import Link from "next/link";

export default async function Posts() {
    
    // revalidateTag('getPosts')
    // revalidatePath("/isr/posts")

    const posts = await getData("http://localhost:8000/posts", {
        next: {
            // time based revalidation
            revalidate: 10

            // on demand revalidation
            // tags: ["getPosts"]
        }
    });

console.log("ISR Post")

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold">Posts page</h1>
            <div>
                <ul className="flex flex-col gap-4 list-image-[url(/checkmark.svg)] m-5">
                    {posts.map((post) => (
                        <Link key={post.id} href={`/isr/posts/${post.id}`}>
                            <li className="pl-2">{post.title}</li>
                        </Link>
                    ))}
                </ul>
            </div>
        </div>
    );
}
