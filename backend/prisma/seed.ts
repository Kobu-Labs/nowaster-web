import { PrismaClient } from "@prisma/client";

/* { */
/*     startTime: , */
/*     endTime: , */
/*     category: , */
/*     description: , */
/* } */

/* type PreDbScheduledEntity = Omit<ScheduledEntity, "id"> */

const scheduledSessions = [
  {
    startTime: new Date(2023, 6, 20, 10, 30),
    endTime: new Date(2023, 6, 20, 11, 30),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 6, 20, 12, 30),
    endTime: new Date(2023, 6, 20, 15, 30),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 6, 20, 20, 30),
    endTime: new Date(2023, 6, 20, 20, 45),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 6, 22, 8, 11),
    endTime: new Date(2023, 6, 22, 11, 30),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 6, 24, 10, 30, 11),
    endTime: new Date(2023, 6, 24, 18, 23, 20),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 6, 25, 10, 30),
    endTime: new Date(2023, 6, 25, 11, 30),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 6, 29, 11, 29),
    endTime: new Date(2023, 6, 29, 15, 17),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 7, 2, 10, 30),
    endTime: new Date(2023, 7, 2, 11, 30),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 7, 2, 12, 0),
    endTime: new Date(2023, 7, 2, 14, 30),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 7, 2, 18, 30),
    endTime: new Date(2023, 7, 2, 20, 30),
    category: "school",
    description: null,
  },
  {
    startTime: new Date(2023, 7, 2, 23, 30),
    endTime: new Date(2023, 8, 2, 0, 30),
    category: "school",
    description: null,
  },
];

const client = new PrismaClient();
async function main() {
  scheduledSessions.map(async (session) => {
    const { category, ...sessionData } = session;
    await client.scheduledEntity.create({
      data: {
        ...sessionData,
        category: {
          connectOrCreate: {
            where: {
              name: category,
            },
            create: {
              name: category,
            },
          },
        },
      },
    });
  });
  console.log("SEEDING SUCCESSFULL");
}

main()
  .then(async () => {
    await client.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await client.$disconnect();
    process.exit(1);
  });
