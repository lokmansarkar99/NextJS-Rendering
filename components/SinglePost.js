import { getData } from "@/lib/getData";

export default async function SinglePost() {
    const post = await getData("http://localhost:8000/posts/2", {}, 3000);

    return <div className="mt-6 bg-amber-300 p-4 text-2xl">{post.body}</div>;
}
