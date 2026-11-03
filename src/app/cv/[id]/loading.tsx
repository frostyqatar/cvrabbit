import { Skeleton } from "@/components/ui/skeleton";

export default function EditorLoading() {
  return (
    <div className="min-h-dvh bg-mint">
      <div className="border-b border-onyx/8">
        <div className="container-page flex h-16 items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="ml-auto h-9 w-28 rounded-lg" />
        </div>
        <div className="container-page flex gap-2 py-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-20 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="container-page max-w-[940px] space-y-10 py-10">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-3 w-72" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
