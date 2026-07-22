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
            speed: 0.6,
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
