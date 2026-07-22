"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/shadcn/carousel";
import { AvatarDialog } from "@/components/ui-providers/avatar/AvatarDialog";
import AutoScroll from "embla-carousel-auto-scroll";
import Image from "next/image";
import { type FC, useState } from "react";

const AVATAR_FILES = [
  "avatar-01.jpg",
  "avatar-02.jpg",
  "avatar-03.jpg",
  "avatar-04.jpg",
  "avatar-05.jpg",
  "avatar-06.jpg",
  "avatar-07.jpg",
  "avatar-08.jpg",
  "avatar-09.jpg",
];

// TODO: remove — testing data to work out category/hour tags per avatar
const AVATAR_TAGS: Record<string, { hours: number; label: string; }[]> = {
  "avatar-01.jpg": [
    { hours: 35, label: "Gardening" },
    { hours: 20, label: "Running" },
  ],
  "avatar-02.jpg": [
    { hours: 20, label: "Military" },
    { hours: 10, label: "Gym" },
  ],
  "avatar-03.jpg": [
    { hours: 30, label: "Satanic ritual" },
    { hours: 15, label: "Soccer" },
    { hours: 10, label: "Coding" },
  ],
  "avatar-04.jpg": [
    { hours: 25, label: "Gardening" },
    { hours: 20, label: "Coding" },
    { hours: 5, label: "Running" },
  ],
  "avatar-05.jpg": [
    { hours: 40, label: "Anatomy" },
    { hours: 20, label: "Biology" },
    { hours: 10, label: "Running" },
  ],
  "avatar-06.jpg": [
    { hours: 50, label: "Cave exploration" },
    { hours: 5, label: "Soccer" },
  ],
  "avatar-07.jpg": [
    { hours: 20, label: "Finance" },
    { hours: 15, label: "Research" },
    { hours: 10, label: "Gym" },
  ],
  "avatar-08.jpg": [{ hours: 50, label: "Baking" }],
  "avatar-09.jpg": [
    { hours: 40, label: "Weaving" },
    { hours: 20, label: "Pottery" },
    { hours: 5, label: "Sculpturing" },
  ],
};

export const AvatarShowcaseCarousel: FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<null | number>(null);

  const selectedFile
    = selectedIndex === null ? undefined : AVATAR_FILES[selectedIndex];
  const count = AVATAR_FILES.length;

  return (
    <div className="mx-auto max-w-3xl py-10">
      <Carousel
        opts={{ align: "center", loop: true }}
        plugins={[
          AutoScroll({
            speed: 1.2,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
      >
        <CarouselContent className="py-6">
          {AVATAR_FILES.map((file, i) => (
            <CarouselItem className="basis-4/5 sm:basis-3/5 md:basis-1/2" key={file}>
              <button
                className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:z-10 hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-primary"
                onClick={() => setSelectedIndex(i)}
                type="button"
              >
                <Image
                  alt="Example Nowaster avatar scene"
                  className="object-cover"
                  fill
                  priority={i === 0}
                  sizes="(max-width: 640px) 80vw, 500px"
                  src={`/avatars/${file}`}
                />
                {/* TODO: remove — testing tags to work out category/hour mapping per avatar */}
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-8">
                  {[...(AVATAR_TAGS[file] ?? [])]
                    .sort((a, b) => b.hours - a.hours)
                    .map((tag, tagIndex) => (
                      <span
                        className={
                          tagIndex === 0
                            ? "flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm"
                            : "flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
                        }
                        key={tag.label}
                      >
                        {tag.label}
                        <span
                          className={
                            tagIndex === 0
                              ? "text-primary-foreground/70"
                              : "text-white/60"
                          }
                        >
                          {tag.hours}
                          h
                        </span>
                      </span>
                    ))}
                </div>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {selectedFile && (
        <AvatarDialog
          imageUrl={`/avatars/${selectedFile}`}
          onNext={() => setSelectedIndex(((selectedIndex ?? 0) + 1) % count)}
          onOpenChange={(open) => !open && setSelectedIndex(null)}
          onPrevious={() =>
            setSelectedIndex(((selectedIndex ?? 0) - 1 + count) % count)}
          open={selectedIndex !== null}
        />
      )}
    </div>
  );
};
