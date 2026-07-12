// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });


async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (order matters for FK constraints)
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // ── Admin / Staff Users ──────────────────────────────────────────────────
  const fleetManager = await prisma.user.create({
    data: {
      email: "fleet@transitops.com",
      password: hash("Fleet@123"),
      name: "Alex Fleet",
      role: "FLEET_MANAGER",
    },
  });

  const dispatcher = await prisma.user.create({
    data: {
      email: "dispatch@transitops.com",
      password: hash("Dispatch@123"),
      name: "Sam Dispatch",
      role: "DISPATCHER",
    },
  });

  await prisma.user.create({
    data: {
      email: "safety@transitops.com",
      password: hash("Safety@123"),
      name: "Jordan Safety",
      role: "SAFETY_OFFICER",
    },
  });

  await prisma.user.create({
    data: {
      email: "finance@transitops.com",
      password: hash("Finance@123"),
      name: "Chris Finance",
      role: "FINANCIAL_ANALYST",
    },
  });

  console.log("✅ Staff users created.");

  // ── Vehicles ─────────────────────────────────────────────────────────────
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNumber: "MH-12-AB-1234",
        name: "Tata Prima 5530.S",
        type: "Heavy Truck",
        maxLoadCapacity: 25,
        odometer: 45200,
        acquisitionCost: 2800000,
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "MH-14-CD-5678",
        name: "Ashok Leyland Captain",
        type: "Medium Truck",
        maxLoadCapacity: 15,
        odometer: 78300,
        acquisitionCost: 1900000,
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "DL-01-EF-9012",
        name: "Eicher Pro 2095",
        type: "Light Truck",
        maxLoadCapacity: 9,
        odometer: 21100,
        acquisitionCost: 1200000,
        status: "IN_SHOP",
      },
    }),
  ]);

  console.log("✅ Vehicles created.");

  // ── Drivers (with linked User accounts for portal login) ─────────────────
  const driverUser1 = await prisma.user.create({
    data: {
      email: "ravi.driver@transitops.com",
      password: hash("driver123"),
      name: "Ravi Kumar",
      role: "DRIVER",
    },
  });

  const driverUser2 = await prisma.user.create({
    data: {
      email: "priya.driver@transitops.com",
      password: hash("driver123"),
      name: "Priya Sharma",
      role: "DRIVER",
    },
  });

  const driver1 = await prisma.driver.create({
    data: {
      name: "Ravi Kumar",
      licenseNumber: "MH0120230012345",
      licenseCategory: "Heavy Motor Vehicle",
      licenseExpiry: new Date("2027-06-30"),
      contactNumber: "+91-9876543210",
      safetyScore: 95,
      status: "AVAILABLE",
      userId: driverUser1.id,
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      name: "Priya Sharma",
      licenseNumber: "DL0120220054321",
      licenseCategory: "Medium Motor Vehicle",
      licenseExpiry: new Date("2025-12-31"), // Expiring soon — for safety officer demo
      contactNumber: "+91-9988776655",
      safetyScore: 78,
      status: "AVAILABLE",
      userId: driverUser2.id,
    },
  });

  console.log("✅ Drivers created with login credentials.");

  // ── Trips ─────────────────────────────────────────────────────────────────
  const trip1 = await prisma.trip.create({
    data: {
      code: "TR001",
      source: "Mumbai",
      destination: "Pune",
      cargoWeight: 12,
      plannedDistance: 150,
      status: "COMPLETED",
      finalOdometer: 45350,
      fuelConsumed: 45,
      vehicleId: vehicles[0].id,
      driverId: driver1.id,
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      code: "TR002",
      source: "Delhi",
      destination: "Jaipur",
      cargoWeight: 8,
      plannedDistance: 280,
      status: "DISPATCHED",
      vehicleId: vehicles[1].id,
      driverId: driver2.id,
    },
  });

  await prisma.trip.create({
    data: {
      code: "TR003",
      source: "Bangalore",
      destination: "Chennai",
      cargoWeight: 5,
      plannedDistance: 350,
      status: "DRAFT",
    },
  });

  console.log("✅ Trips created.");

  // ── Maintenance Logs ──────────────────────────────────────────────────────
  await prisma.maintenanceLog.create({
    data: {
      description: "Engine oil change + filter replacement",
      cost: 8500,
      date: new Date("2026-07-01"),
      status: "Completed",
      vehicleId: vehicles[0].id,
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      description: "Brake pad replacement — front axle",
      cost: 15000,
      date: new Date("2026-07-10"),
      status: "In Shop",
      vehicleId: vehicles[2].id,
    },
  });

  console.log("✅ Maintenance logs created.");

  // ── Fuel Logs ─────────────────────────────────────────────────────────────
  await prisma.fuelLog.create({
    data: {
      date: new Date("2026-07-05"),
      liters: 45,
      cost: 4995,
      vehicleId: vehicles[0].id,
      tripId: trip1.id,
    },
  });

  await prisma.fuelLog.create({
    data: {
      date: new Date("2026-07-11"),
      liters: 30,
      cost: 3330,
      vehicleId: vehicles[1].id,
      tripId: trip2.id,
    },
  });

  console.log("✅ Fuel logs created.");

  // ── Expenses ──────────────────────────────────────────────────────────────
  await prisma.expense.create({
    data: {
      toll: 220,
      other: 500,
      tripId: trip1.id,
    },
  });

  console.log("✅ Expenses created.");
  console.log("\n🎉 Seed complete! Login credentials:");
  console.log("   Fleet Manager : fleet@transitops.com / Fleet@123");
  console.log("   Dispatcher    : dispatch@transitops.com / Dispatch@123");
  console.log("   Safety Officer: safety@transitops.com / Safety@123");
  console.log("   Fin. Analyst  : finance@transitops.com / Finance@123");
  console.log("   Driver (Ravi) : ravi.driver@transitops.com / driver123");
  console.log("   Driver (Priya): priya.driver@transitops.com / driver123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
