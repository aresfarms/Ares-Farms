import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.property.create({
    data: {
      name: "Test Farm",
      state: "MD",
      region: "Eastern Shore",
      price: 1000000,
      acreage: 50,
      soilScore: 8.5,
      waterAccess: true,
      zoningType: "Agricultural",
      climateRisk: 3.2,
      infrastructureScore: 7.1,
      source: "manual"
    }
  });

  console.log(result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
