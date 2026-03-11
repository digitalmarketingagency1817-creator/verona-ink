"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// Showcases: tRPC cursor pagination + TanStack Query useInfiniteQuery + Intersection Observer

export function PostListInfinite({ limit = 10 }: { limit?: number }) {
  const t = useTranslations("DashboardPostList");
  const locale = useLocale();
  const trpc = useTRPC();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    trpc.post.list.infiniteQueryOptions(
      { limit },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? null }
    )
  );

  // Auto-fetch next page when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center">{t("empty")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}>
          {post.imageUrl && (
            <div className="overflow-hidden rounded-t-lg">
              <Image
                src={post.imageUrl}
                alt={post.title}
                width={800}
                height={400}
                className="h-48 w-full object-cover"
              />
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{post.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={post.author.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {post.author.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground text-xs">{post.author.name}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-2 text-sm">{post.content}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(post.createdAt).toLocaleDateString(locale)}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Intersection sentinel — triggers next page fetch automatically */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      {isFetchingNextPage && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <p className="text-muted-foreground py-4 text-center text-sm">{t("allLoaded")}</p>
      )}
    </div>
  );
}
