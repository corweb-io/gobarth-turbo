"use client";
import { useState } from "react";
import { useDebounce } from "../hooks/use-debounce";
import { trpc } from "../lib/trpc";

export function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    trpc.search.posts.useInfiniteQuery(
      { query: debouncedQuery, limit: 10 },
      {
        enabled: debouncedQuery.length > 1,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
    );

  const results = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="w-full px-4 py-2 border rounded-md"
      />
      {debouncedQuery.length > 1 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
          {isLoading && (
            <p className="p-3 text-sm text-gray-500">Searching...</p>
          )}
          {results.length === 0 && !isLoading && (
            <p className="p-3 text-sm text-gray-500">No results</p>
          )}
          {results.map((result) => (
            <a
              key={result.id}
              href={`/posts/${result.id}`}
              className="block px-4 py-3 hover:bg-gray-50"
            >
              <p className="font-medium text-sm">{result.title}</p>
            </a>
          ))}
          {hasNextPage && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-50"
            >
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
