# Next.js Rendering Strategies - Complete Documentation

 

## Table of Contents
1. [Introduction](#introduction)
2. [Static Site Generation (SSG)](#1-static-site-generation-ssg)
3. [Dynamic Rendering](#2-dynamic-rendering)
4. [Incremental Static Regeneration (ISR)](#3-incremental-static-regeneration-isr)
5. [Hybrid Rendering](#4-hybrid-rendering)
6. [React Server Components (RSC)](#5-react-server-components-rsc)
7. [Comparison Table](#comparison-table)
8. [Best Practices](#best-practices)

---

## Introduction

Next.js provides multiple rendering strategies to optimize your application's performance, user experience, and development workflow. Each strategy has its own use cases, advantages, and trade-offs. This documentation covers all major rendering approaches with practical code examples.

---

## 1. Static Site Generation (SSG)

### Overview

Static Site Generation (SSG) pre-renders pages at **build time**. The HTML is generated once during the build process and reused for each request. This results in the fastest possible page loads.

### How It Works

1. During `npm run build`, Next.js fetches data and generates static HTML files
2. These HTML files are served directly from a CDN
3. No server-side processing happens on each request
4. Data fetching code runs only once during build

### Code Example

```javascript
import { getData } from "@/lib/getData";

export default async function Static() {
    // This function runs ONLY at build time
    const posts = await getData("http://localhost:8000/posts");
    console.log("I got the post") // Only visible during build
    
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Static Page</h1>
            <div>
                <ul className="flex flex-col gap-4 list-image-[url(/checkmark.svg)] m-5">
                    {posts.map((post) => (
                        <li key={post.id} className="pl-2">
                            {post.title}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
```

### When to Use SSG

- **Blog posts** - Content doesn't change frequently
- **Documentation sites** - Static reference materials
- **Marketing pages** - Landing pages, about pages
- **Product listings** - When products don't change often
- **Portfolio websites** - Personal websites with static content

### Advantages

- ⚡ **Blazing fast** - Served directly from CDN
- 💰 **Cost-effective** - Minimal server resources needed
- 📱 **SEO optimized** - Perfect for search engine crawlers
- 🔒 **Secure** - No server-side vulnerabilities
- 📊 **Scalable** - Handles massive traffic easily

### Disadvantages

- 🔄 **No real-time data** - Data is stale after build
- 📊 **Rebuild required** - Any data update requires a new build
- ⏱️ **Build time increases** - More pages = longer builds
- 🚫 **Not suitable for personalized content** - Same HTML for all users

### Configuration Options

```javascript
// Default behavior - automatically static if no dynamic functions used
export default async function Page() {
    const data = await fetch('https://api.example.com/data');
    return <div>{/* render */}</div>;
}

// Force static generation
export const dynamic = 'force-static';

// Generate static paths for dynamic routes
export async function generateStaticParams() {
    const posts = await fetch('https://api.example.com/posts').then(res => res.json());
    return posts.map((post) => ({
        id: post.id,
    }));
}
```

---

## 2. Dynamic Rendering

### Overview

Dynamic Rendering generates HTML on **every request**. The server fetches fresh data and renders the page in real-time for each user request.

### How It Works

1. User requests a page
2. Server receives the request
3. Server fetches fresh data from database/API
4. Server renders HTML with the latest data
5. HTML is sent to the client
6. Process repeats for every request

### Code Example

```javascript
import { getData } from "@/lib/getData";

export default async function Dynamic() {
    // cache: "no-store" forces dynamic rendering
    // Data is fetched on EVERY request
    const posts = await getData("http://localhost:8000/posts", {
        cache: "no-store", // This is the key to dynamic rendering
    });

    console.log("Dynamic Post") // Logs on every request

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Dynamic Page</h1>
            <div>
                <ul className="flex flex-col gap-4 list-image-[url(/checkmark.svg)] m-5">
                    {posts.map((post) => (
                        <li key={post.id} className="pl-2">
                            {post.title}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
```

### When to Use Dynamic Rendering

- **User dashboards** - Personalized data for each user
- **Authentication-protected pages** - User-specific content
- **Real-time data** - Stock prices, live scores, feeds
- **Shopping carts** - User-specific cart data
- **Search results** - Query-dependent content
- **Admin panels** - Frequently changing data

### Advantages

- 🔄 **Always fresh data** - Latest information on every request
- 👤 **Personalization** - Different content for different users
- 🎯 **User-specific** - Access to cookies, headers, user sessions
- 🔐 **Secure** - Can handle authenticated requests
- 📊 **Real-time** - Perfect for live data

### Disadvantages

- 🐌 **Slower** - Server processing on every request
- 💰 **Expensive** - Higher server costs
- 📡 **Database load** - More frequent queries
- ⚠️ **Scalability challenges** - Harder to handle traffic spikes
- 🌐 **CDN limitations** - Can't be cached at edge

### Configuration Options

```javascript
// Method 1: Use cache: "no-store"
const data = await fetch('https://api.example.com/data', {
    cache: 'no-store'
});

// Method 2: Force dynamic rendering
export const dynamic = 'force-dynamic';

// Method 3: Use dynamic functions (automatic)
import { cookies, headers } from 'next/headers';

export default async function Page() {
    const cookieStore = cookies(); // Using this makes the route dynamic
    const headersList = headers(); // This too
    
    return <div>{/* render */}</div>;
}

// Method 4: Disable caching for all fetches in a route
export const fetchCache = 'force-no-store';
```

---

## 3. Incremental Static Regeneration (ISR)

### Overview

ISR combines the benefits of SSG and Dynamic Rendering. Pages are generated statically but can be updated in the background at specified intervals without requiring a full rebuild.

### How It Works

1. **First request:** Serves the statically generated page from build time
2. **After revalidation period:** 
   - Still serves the stale (old) page to the user instantly
   - Triggers regeneration in the background
   - Updates the cached page
3. **Subsequent requests:** Serve the newly regenerated page

This is called **Stale-While-Revalidate** strategy.

### Code Example

```javascript
import { getData } from "@/lib/getData";
import { revalidatePath, revalidateTag } from "next/cache";
import Link from "next/link";

export default async function Posts() {
    // Time-based revalidation
    const posts = await getData("http://localhost:8000/posts", {
        next: {
            revalidate: 10 // Revalidate every 10 seconds
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
```

### Two Types of Revalidation

#### 1. Time-Based Revalidation

```javascript
// Revalidate every 60 seconds
const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 60 }
});

// Or at route level
export const revalidate = 60;
```

#### 2. On-Demand Revalidation

```javascript
// In your page/component
const posts = await getData("http://localhost:8000/posts", {
    next: {
        tags: ["posts"] // Tag this cache
    }
});

// In an API route or Server Action
import { revalidateTag, revalidatePath } from 'next/cache';

// Revalidate by tag
revalidateTag('posts');

// Revalidate by path
revalidatePath('/isr/posts');

// Revalidate multiple paths
revalidatePath('/isr/posts', 'layout'); // Revalidates layout and nested pages
```

### Example: On-Demand Revalidation API Route

```javascript
// app/api/revalidate/route.js
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const secret = request.nextUrl.searchParams.get('secret');
    
    // Validate secret token
    if (secret !== process.env.REVALIDATE_TOKEN) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    const tag = request.nextUrl.searchParams.get('tag');
    
    // Revalidate the tag
    revalidateTag(tag);
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
}

// Usage: POST to /api/revalidate?secret=TOKEN&tag=posts
```

### When to Use ISR

- **News websites** - Update every 5-10 minutes
- **E-commerce product pages** - Inventory updates periodically
- **Blog with comments** - New comments appear after revalidation
- **Social media feeds** - Updates every few minutes
- **Data dashboards** - Stats update hourly/daily
- **Weather apps** - Updates every 30 minutes

### Advantages

- ⚡ **Fast like static** - Served from cache
- 🔄 **Automatic updates** - No manual rebuilds needed
- 💰 **Cost-effective** - Less server load than full dynamic
- 📊 **Fresh content** - Updated at defined intervals
- 🌐 **CDN benefits** - Can be cached at edge
- 🎯 **Best of both worlds** - Speed + freshness

### Disadvantages

- ⏱️ **Not truly real-time** - Delay between updates
- 🔄 **Stale data possible** - First visitor after revalidation sees old data
- 🎛️ **Configuration complexity** - Need to tune revalidation times
- 💾 **Cache management** - Need to understand caching behavior

### ISR Workflow Diagram

```
Request 1 (t=0s)  → Serve static page (built at build time)
Request 2 (t=12s) → Serve static page + trigger background regeneration
Request 3 (t=15s) → Serve newly regenerated page
Request 4 (t=25s) → Serve regenerated page + trigger new regeneration
```

---

## 4. Hybrid Rendering

### Overview

Hybrid Rendering allows you to combine multiple rendering strategies on the same page. You can have static content that loads instantly and dynamic content that streams in afterward using React Suspense.

### How It Works

1. Static parts of the page are generated at build time
2. Page initially loads with static content
3. Dynamic parts show loading states (Suspense fallback)
4. Dynamic content streams in as it becomes available
5. User sees progressive enhancement

This uses React 18's **Streaming** and **Suspense** features.

### Code Example

```javascript
import SinglePost from "@/components/SinglePost";
import { getData } from "@/lib/getData";
import { Suspense } from "react";

export default async function Hybrid() {
    // Static data - fetched at build time
    const posts = await getData("http://localhost:8000/posts");

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Hybrid Page</h1>
            
            {/* Static content - renders immediately */}
            <div>
                <ul className="flex flex-col gap-4 list-image-[url(/checkmark.svg)] m-5">
                    {posts.map((post) => (
                        <li key={post.id} className="pl-2">
                            {post.title}
                        </li>
                    ))}
                </ul>

                <div>
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                    Perspiciatis omnis debitis optio est labore laboriosam
                    voluptatibus ullam numquam, id eum fuga illum, a veritatis
                    dolores nihil rerum? Inventore, sunt nihil.
                </div>

                <hr />

                {/* Dynamic content - streams in later */}
                <Suspense
                    fallback={
                        <div>
                            <h1>Loading single post...</h1>
                        </div>
                    }
                >
                    <SinglePost />
                </Suspense>
            </div>
        </div>
    );
}
```

### SinglePost Component Example

```javascript
// components/SinglePost.jsx
import { getData } from "@/lib/getData";

export default async function SinglePost() {
    // This data is fetched dynamically
    // Could use cache: "no-store" or revalidate
    const post = await getData("http://localhost:8000/posts/1", {
        cache: "no-store"
    });
    
    return (
        <div className="mt-6 bg-amber-400 p-4">
            <h2>{post.title}</h2>
            <p>{post.body}</p>
        </div>
    );
}
```

### Advanced Hybrid Patterns

#### Multiple Suspense Boundaries

```javascript
export default async function Page() {
    return (
        <div>
            {/* Fast static header */}
            <Header />
            
            {/* Main content with separate loading states */}
            <Suspense fallback={<PostsSkeleton />}>
                <Posts />
            </Suspense>
            
            <Suspense fallback={<CommentsSkeleton />}>
                <Comments />
            </Suspense>
            
            <Suspense fallback={<RecommendationsSkeleton />}>
                <Recommendations />
            </Suspense>
            
            {/* Fast static footer */}
            <Footer />
        </div>
    );
}
```

#### Nested Suspense

```javascript
export default async function Page() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <Layout>
                <Suspense fallback={<SidebarSkeleton />}>
                    <Sidebar />
                </Suspense>
                
                <main>
                    <Suspense fallback={<ContentSkeleton />}>
                        <Content />
                    </Suspense>
                </main>
            </Layout>
        </Suspense>
    );
}
```

### When to Use Hybrid Rendering

- **Product pages** - Basic info static, reviews/ratings dynamic
- **Profile pages** - Profile data static, activity feed dynamic
- **Article pages** - Article content static, comments dynamic
- **Dashboard** - Layout static, charts/data dynamic
- **E-commerce** - Product details static, inventory/pricing dynamic

### Advantages

- 🚀 **Fast initial load** - Static content appears instantly
- 📱 **Better UX** - Progressive content loading
- 🎯 **Prioritization** - Show important content first
- ⚡ **Perceived performance** - Feels faster to users
- 🔄 **Fresh dynamic data** - Best of both worlds
- 💪 **Flexibility** - Mix and match strategies

### Disadvantages

- 🧩 **Complexity** - More complex to architect
- 🎨 **Layout shift** - Need careful design to avoid CLS
- 🔄 **State management** - Can be tricky with streaming
- 🐛 **Debugging** - Harder to debug streaming issues

### Best Practices

1. **Minimize layout shift:** Reserve space for dynamic content
2. **Meaningful fallbacks:** Show skeleton screens, not just "Loading..."
3. **Error boundaries:** Wrap Suspense in error boundaries
4. **Optimize static parts:** Keep static parts truly static
5. **Progressive enhancement:** Page should work without dynamic parts

---

## 5. React Server Components (RSC)

### Overview

React Server Components (RSC) is a new paradigm where components render exclusively on the server. They don't send JavaScript to the client, resulting in smaller bundle sizes and faster page loads. This is the **default** in Next.js App Router.

### How It Works

1. Component code runs on the server
2. Server fetches data, performs computations
3. Component renders to a special format (not HTML, not JSON)
4. This format is streamed to the client
5. Client reconstructs the component tree
6. No JavaScript for that component is sent to the browser

### Code Example

```javascript
// app/rsc/page.jsx - Server Component
import PostList from "./post-list";

export default async function RSCPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold">React Server Component</h1>
            <div>
                <PostList />
            </div>
        </div>
    );
}
```

```javascript
// app/rsc/post-list.jsx - Also a Server Component
import { getData } from "@/lib/getData";

export default async function PostList() {
    // Can directly access database, APIs, file system
    const posts = await getData("http://localhost:8000/posts");
    
    return (
        <ul>
            {posts.map((post) => (
                <li key={post.id}>{post.title}</li>
            ))}
        </ul>
    );
}
```

### Server vs Client Components

#### Server Components (Default)

```javascript
// No directive needed - this is default in App Router
export default async function ServerComponent() {
    // ✅ Can use async/await
    const data = await fetch('...');
    
    // ✅ Can access database directly
    const users = await db.user.findMany();
    
    // ✅ Can use Node.js APIs
    const fs = require('fs');
    
    // ✅ Can use environment variables safely
    const apiKey = process.env.SECRET_API_KEY;
    
    // ❌ Cannot use useState, useEffect
    // ❌ Cannot use browser APIs
    // ❌ Cannot use event handlers (onClick, onChange)
    
    return <div>{data.title}</div>;
}
```

#### Client Components

```javascript
'use client' // This directive makes it a Client Component

import { useState, useEffect } from 'react';

export default function ClientComponent() {
    // ✅ Can use hooks
    const [count, setCount] = useState(0);
    
    // ✅ Can use browser APIs
    useEffect(() => {
        localStorage.setItem('count', count);
    }, [count]);
    
    // ✅ Can use event handlers
    const handleClick = () => setCount(count + 1);
    
    // ❌ Cannot use async/await directly
    // ❌ Cannot access database
    // ❌ Cannot use Node.js APIs
    
    return <button onClick={handleClick}>{count}</button>;
}
```

### Composition Patterns

#### Pattern 1: Server Component with Client Component Children

```javascript
// app/page.jsx - Server Component
import ClientButton from './ClientButton';

export default async function Page() {
    const data = await fetch('...');
    
    return (
        <div>
            <h1>Server Component</h1>
            <p>{data.title}</p>
            
            {/* Client Component for interactivity */}
            <ClientButton />
        </div>
    );
}
```

```javascript
// app/ClientButton.jsx - Client Component
'use client'

import { useState } from 'react';

export default function ClientButton() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

#### Pattern 2: Passing Server Components to Client Components

```javascript
// app/page.jsx - Server Component
import ClientWrapper from './ClientWrapper';
import ServerContent from './ServerContent';

export default function Page() {
    return (
        <ClientWrapper>
            {/* ServerContent stays a Server Component */}
            <ServerContent />
        </ClientWrapper>
    );
}
```

```javascript
// app/ClientWrapper.jsx - Client Component
'use client'

export default function ClientWrapper({ children }) {
    return (
        <div className="interactive-wrapper">
            {children} {/* children can be Server Components */}
        </div>
    );
}
```

#### Pattern 3: Sharing Data Between Server Components

```javascript
// app/page.jsx
import { cache } from 'react';
import Header from './Header';
import Content from './Content';

// cache() ensures this function is called once even if used multiple times
const getUser = cache(async (id) => {
    const user = await db.user.findUnique({ where: { id } });
    return user;
});

export default async function Page() {
    const user = await getUser(1);
    
    return (
        <div>
            {/* Both can use getUser() - only fetches once */}
            <Header userId={1} />
            <Content userId={1} />
        </div>
    );
}
```

### When to Use Server Components

Use Server Components (default) for:
- 🔍 Data fetching
- 💾 Database access
- 🔐 Accessing sensitive information (API keys, tokens)
- 🎯 Heavy computations
- 📦 Large dependencies (keep them on server)
- 📄 Static content rendering

### When to Use Client Components

Use Client Components (`'use client'`) for:
- 🖱️ Event handlers (onClick, onChange, onSubmit)
- 🎣 React hooks (useState, useEffect, useReducer)
- 🌐 Browser APIs (localStorage, window, navigator)
- 🎨 Interactive components
- 📍 usePathname, useSearchParams, useRouter from next/navigation
- 🔔 Real-time updates (WebSockets)

### Advantages of Server Components

- 📦 **Smaller bundles** - Components don't ship JavaScript
- ⚡ **Faster loads** - Less code to download and parse
- 🔒 **More secure** - Sensitive data stays on server
- 💰 **Better performance** - Less client-side work
- 🎯 **Direct data access** - No need for API routes
- 🌳 **Better SEO** - Fully rendered HTML

### Disadvantages

- 🚫 **No interactivity** - Need Client Components for that
- 🔄 **Learning curve** - New mental model
- 🧩 **Composition complexity** - Need to think about boundaries
- 🐛 **Debugging** - Server errors vs client errors

### Data Fetching Patterns

#### Sequential Data Fetching

```javascript
// Waterfalls - slower
export default async function Page() {
    const user = await getUser();
    const posts = await getPosts(user.id); // Waits for user
    const comments = await getComments(posts[0].id); // Waits for posts
    
    return <div>...</div>;
}
```

#### Parallel Data Fetching

```javascript
// Faster - fetches in parallel
export default async function Page() {
    const userPromise = getUser();
    const postsPromise = getPosts();
    const commentsPromise = getComments();
    
    // Wait for all promises
    const [user, posts, comments] = await Promise.all([
        userPromise,
        postsPromise,
        commentsPromise
    ]);
    
    return <div>...</div>;
}
```

#### Streaming with Suspense

```javascript
export default function Page() {
    return (
        <div>
            {/* Starts streaming immediately */}
            <Header />
            
            {/* These stream in as they resolve */}
            <Suspense fallback={<Skeleton />}>
                <SlowComponent />
            </Suspense>
            
            <Suspense fallback={<Skeleton />}>
                <AnotherSlowComponent />
            </Suspense>
        </div>
    );
}
```

---

## Comparison Table

| Strategy | Rendering Time | Data Freshness | Performance | Complexity | Best For |
|----------|---------------|----------------|-------------|------------|----------|
| **SSG (Static)** | Build time | Stale (until rebuild) | ⚡⚡⚡ Excellent | ⭐ Simple | Blogs, docs, marketing |
| **Dynamic** | Every request | Real-time | 🐌 Slower | ⭐⭐ Moderate | Dashboards, user pages |
| **ISR** | Build + periodic | Semi-fresh | ⚡⚡ Very Good | ⭐⭐ Moderate | News, e-commerce |
| **Hybrid** | Mixed | Mixed | ⚡⚡ Good | ⭐⭐⭐ Complex | Product pages, profiles |
| **RSC** | Server-side | Depends on strategy | ⚡⚡⚡ Excellent | ⭐⭐ Moderate | All server logic |

### Detailed Comparison

#### Performance Metrics

| Strategy | TTFB | FCP | LCP | Bundle Size |
|----------|------|-----|-----|-------------|
| **SSG** | ~50ms | ~100ms | ~300ms | Small |
| **Dynamic** | ~200ms | ~300ms | ~500ms | Medium |
| **ISR** | ~60ms | ~120ms | ~320ms | Small |
| **Hybrid** | ~80ms | ~150ms | ~400ms | Medium |
| **RSC** | ~100ms | ~180ms | ~350ms | Smallest |

#### Cost Comparison (Monthly for 1M requests)

| Strategy | Server Costs | CDN Costs | Database Calls | Total Estimated Cost |
|----------|--------------|-----------|----------------|----------------------|
| **SSG** | ~$5 | ~$10 | 1 (build time) | ~$15 |
| **Dynamic** | ~$200 | ~$5 | 1,000,000 | ~$205 |
| **ISR** | ~$20 | ~$10 | ~1,000 | ~$30 |
| **Hybrid** | ~$50 | ~$8 | ~100,000 | ~$58 |

---

## Best Practices

### 1. Choose the Right Strategy

```javascript
// Decision tree
if (content rarely changes) {
    use SSG
} else if (content changes frequently but not per-user) {
    use ISR
} else if (content is user-specific or real-time) {
    use Dynamic
} else if (page has both static and dynamic needs) {
    use Hybrid
}

// For all cases, use RSC (Server Components) by default
// Add 'use client' only when needed
```

### 2. Optimize Data Fetching

```javascript
// ❌ Bad: Sequential waterfalls
export default async function Page() {
    const user = await getUser();
    const posts = await getPosts(user.id);
    return <div>...</div>;
}

// ✅ Good: Parallel fetching
export default async function Page() {
    const [user, posts] = await Promise.all([
        getUser(),
        getPosts()
    ]);
    return <div>...</div>;
}

// ✅ Better: Use Suspense for streaming
export default function Page() {
    return (
        <>
            <Suspense fallback={<UserSkeleton />}>
                <User />
            </Suspense>
            <Suspense fallback={<PostsSkeleton />}>
                <Posts />
            </Suspense>
        </>
    );
}
```

### 3. Implement Proper Caching

```javascript
// Cache for 1 hour
const data = await fetch('...', {
    next: { revalidate: 3600 }
});

// No cache for real-time data
const data = await fetch('...', {
    cache: 'no-store'
});

// Tag-based revalidation
const data = await fetch('...', {
    next: { tags: ['posts'] }
});
```

### 4. Use Loading States Effectively

```javascript
// ❌ Bad: Generic loading
<Suspense fallback={<div>Loading...</div>}>

// ✅ Good: Skeleton screens
<Suspense fallback={<PostSkeleton />}>
    <Posts />
</Suspense>

// ✅ Better: Match content layout
function PostSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                </div>
            ))}
        </div>
    );
}
```

### 5. Error Handling

```javascript
// app/error.jsx - Error boundary for route segment
'use client'

export default function Error({ error, reset }) {
    return (
        <div>
            <h2>Something went wrong!</h2>
            <button onClick={() => reset()}>Try again</button>
        </div>
    );
}

// Handle errors in Server Components
export default async function Page() {
    try {
        const data = await getData();
        return <div>{data}</div>;
    } catch (error) {
        return <div>Failed to load data</div>;
    }
}
```

### 6. Minimize Client Components

```javascript
// ❌ Bad: Entire page is client component
'use client'

export default function Page() {
    const [count, setCount] = useState(0);
    return (
        <div>
            <Header /> {/* Unnecessarily client-side */}
            <button onClick={() => setCount(count + 1)}>{count}</button>
            <Footer /> {/* Unnecessarily client-side */}
        </div>
    );
}

// ✅ Good: Only interactive part is client component
export default function Page() {
    return (
        <div>
            <Header /> {/* Server Component */}
            <Counter /> {/* Client Component */}
            <Footer /> {/* Server Component */}
        </div>
    );
}
```

### 7. Use Metadata API for SEO

```javascript
// Static metadata
export const metadata = {
    title: 'My Page',
    description: 'Page description',
};

// Dynamic metadata
export async function generateMetadata({ params }) {
    const