import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("STARTING WRITE TEST")

  const result = await prisma.property.create({
    data: {
      name: "VISIBLE TEST",
      state: "NJ",
      region: "South",
      price: 999,
      acreage: 12,
      soilScore: 7,
      waterAccess: true,
      zoningType: "test",
      climateRisk: 2,
      infrastructureScore: 6,
      source: "debug"
    }
  })

  console.log("WRITE SUCCESS:", result)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
