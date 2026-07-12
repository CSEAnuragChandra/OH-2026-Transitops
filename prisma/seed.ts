// prisma/seed.ts
import { PrismaClient, VehicleStatus, DriverStatus, TripStatus, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// --- Mock Data Generators ---
const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal"];
const firstNames = ["Amit", "Ravi", "Priya", "Neha", "Rahul", "Vikram", "Suresh", "Anjali", "Karan", "Pooja", "Rajesh", "Deepak", "Manoj", "Sanjay", "Gaurav"];
const lastNames = ["Kumar", "Sharma", "Patel", "Singh", "Verma", "Gupta", "Das", "Reddy", "Yadav", "Jain", "Mehta", "Chauhan", "Bose", "Nair", "Rao"];
const truckModels = ["Tata Prima 5530.S", "Ashok Leyland Captain", "Eicher Pro 2095", "BharatBenz 3123R", "Mahindra Blazo X", "Volvo FH16", "Scania R500"];
const truckTypes = ["Heavy Truck", "Medium Truck", "Light Truck", "Refrigerated Truck", "Flatbed Trailer"];
const maintenanceDesc = ["Engine oil change", "Brake pad replacement", "Tyre rotation and alignment", "Battery replacement", "Transmission fluid change", "Coolant flush", "Air filter replacement"];

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function sample<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generateRegistration() { return `MH-${randomInt(10, 40)}-${sample(["AB", "CD", "EF", "GH"])}-${randomInt(1000, 9999)}`; }
function generateLicense() { return `MH${randomInt(10, 99)}20${randomInt(10, 24)}${randomInt(1000000, 9999999)}`; }

async function main() {
  console.log("🌱 Seeding database with massive programmatic dataset...");

  // 1. Clear existing data
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  // 2. Core Staff
  await prisma.user.createMany({
    data: [
      { email: "fleet@transitops.com", password: hash("Fleet@123"), name: "Alex Fleet", role: "FLEET_MANAGER" },
      { email: "dispatch@transitops.com", password: hash("Dispatch@123"), name: "Sam Dispatch", role: "DISPATCHER" },
      { email: "safety@transitops.com", password: hash("Safety@123"), name: "Jordan Safety", role: "SAFETY_OFFICER" },
      { email: "finance@transitops.com", password: hash("Finance@123"), name: "Chris Finance", role: "FINANCIAL_ANALYST" },
    ],
  });

  // 3. Generate 100 Vehicles
  const vehicleData = Array.from({ length: 100 }).map(() => {
    const statuses: VehicleStatus[] = ["AVAILABLE", "AVAILABLE", "ON_TRIP", "IN_SHOP"];
    return {
      registrationNumber: generateRegistration(),
      name: sample(truckModels),
      type: sample(truckTypes),
      maxLoadCapacity: randomInt(5, 30),
      odometer: randomInt(10000, 150000),
      acquisitionCost: randomInt(1200000, 4500000),
      status: sample(statuses),
      createdAt: randomDate(sixMonthsAgo, now),
    };
  });
  await prisma.vehicle.createMany({ data: vehicleData, skipDuplicates: true });
  const dbVehicles = await prisma.vehicle.findMany({ select: { id: true } });
  console.log(`✅ Created ${dbVehicles.length} Vehicles.`);

  // 4. Generate 100 Drivers (Users + Driver Profiles)
  const driverUsersData = Array.from({ length: 100 }).map((_, i) => ({
    email: `driver${i}@transitops.com`,
    password: hash("driver123"),
    name: `${sample(firstNames)} ${sample(lastNames)}`,
    role: "DRIVER" as Role,
  }));
  await prisma.user.createMany({ data: driverUsersData });
  const dbDriverUsers = await prisma.user.findMany({ where: { role: "DRIVER" }, select: { id: true, name: true } });

  const driverData = dbDriverUsers.map((user) => {
    const statuses: DriverStatus[] = ["AVAILABLE", "AVAILABLE", "ON_TRIP", "OFF_DUTY"];
    const isTracking = Math.random() > 0.8;
    return {
      name: user.name,
      licenseNumber: generateLicense(),
      licenseCategory: sample(["Heavy Motor Vehicle", "Medium Motor Vehicle", "Light Motor Vehicle"]),
      licenseExpiry: randomDate(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30), new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365 * 3)), // Some expired, mostly valid
      contactNumber: `+91-9${randomInt(100000000, 999999999)}`,
      safetyScore: randomInt(50, 100),
      status: sample(statuses),
      userId: user.id,
      currentLat: isTracking ? (18 + Math.random() * 10) : null,
      currentLng: isTracking ? (72 + Math.random() * 10) : null,
      lastLocationUpdate: isTracking ? new Date() : null,
    };
  });
  await prisma.driver.createMany({ data: driverData, skipDuplicates: true });
  const dbDrivers = await prisma.driver.findMany({ select: { id: true } });
  console.log(`✅ Created ${dbDrivers.length} Drivers.`);

  // 5. Generate 150 Trips
  const tripData = Array.from({ length: 150 }).map((_, i) => {
    const isCompleted = Math.random() > 0.3; // 70% completed, 30% dispatched/draft
    const status = isCompleted ? "COMPLETED" : sample(["DISPATCHED", "DRAFT", "DISPATCHED"]);
    const plannedDistance = randomInt(100, 1500);
    const date = randomDate(sixMonthsAgo, now);

    return {
      code: `TR-26-${(i + 1).toString().padStart(4, "0")}`,
      source: sample(cities),
      destination: sample(cities),
      cargoWeight: randomInt(2, 25),
      plannedDistance,
      status: status as TripStatus,
      finalOdometer: isCompleted ? randomInt(50000, 150000) : null,
      fuelConsumed: isCompleted ? (plannedDistance / randomInt(3, 8)) : null, // ~3-8 km/l
      vehicleId: sample(dbVehicles).id,
      driverId: sample(dbDrivers).id,
      createdAt: date,
      updatedAt: date,
    };
  });
  await prisma.trip.createMany({ data: tripData });
  const dbTrips = await prisma.trip.findMany({ select: { id: true, vehicleId: true, status: true, createdAt: true } });
  console.log(`✅ Created ${dbTrips.length} Trips.`);

  // 6. Generate 150 Maintenance Logs
  const maintenanceData = Array.from({ length: 150 }).map(() => ({
    description: sample(maintenanceDesc),
    cost: randomInt(2000, 35000),
    date: randomDate(sixMonthsAgo, now),
    status: sample(["Completed", "Completed", "In Shop"]),
    vehicleId: sample(dbVehicles).id,
  }));
  await prisma.maintenanceLog.createMany({ data: maintenanceData });
  console.log(`✅ Created ${maintenanceData.length} Maintenance Logs.`);

  // 7. Generate 150 Fuel Logs (Tied to completed trips where possible)
  const completedTrips = dbTrips.filter(t => t.status === "COMPLETED");
  const fuelData = Array.from({ length: 150 }).map(() => {
    const trip = sample(completedTrips) || sample(dbTrips);
    return {
      date: trip.createdAt,
      liters: randomInt(30, 200),
      cost: randomInt(3000, 20000),
      vehicleId: trip.vehicleId!,
      tripId: trip.id,
    };
  });
  await prisma.fuelLog.createMany({ data: fuelData });
  console.log(`✅ Created ${fuelData.length} Fuel Logs.`);

  // 8. Generate 150 Expenses
  const expenseData = Array.from({ length: 150 }).map(() => {
    const trip = sample(dbTrips);
    return {
      toll: randomInt(100, 1500),
      other: randomInt(50, 1000),
      tripId: trip.id,
    };
  });
  await prisma.expense.createMany({ data: expenseData });
  console.log(`✅ Created ${expenseData.length} Expenses.`);

  console.log("\n🎉 Massive Seed complete! Login credentials remain the same:");
  console.log("   Staff roles: <role>@transitops.com / <Role>@123");
  console.log("   Drivers: driver0..99@transitops.com / driver123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });