import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { format } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // Ensure the cron is triggered by Vercel or an authorized scheduler
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Find all drivers whose license expires within 30 days and aren't suspended
    const expiringDrivers = await prisma.driver.findMany({
      where: {
        licenseExpiry: {
          lte: thirtyDaysFromNow,
          gte: today,
        },
        status: {
          not: "SUSPENDED",
        },
      },
      include: {
        user: true,
      },
    });

    if (expiringDrivers.length === 0) {
      return NextResponse.json({ message: "No expiring licenses found." });
    }

    const emailsToSend = expiringDrivers.map((driver) => {
      const daysLeft = Math.ceil(
        (new Date(driver.licenseExpiry).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // We'll always send a copy to the Safety Officer generic email
      // and CC the driver if they have a linked user account with an email.
      const to = ["safety@transitops.com"];
      if (driver.user?.email) {
        to.push(driver.user.email);
      }

      return {
        from: "TransitOps Safety <safety@transitops.com>", // Can be configured
        to,
        subject: `ACTION REQUIRED: License Expiring Soon - ${driver.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #dc2626;">⚠️ License Expiry Warning</h2>
            <p>Hello,</p>
            <p>This is an automated reminder that the commercial driving license for <strong>${driver.name}</strong> is expiring soon.</p>
            <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>License Number:</strong> ${driver.licenseNumber}</p>
              <p style="margin: 0 0 10px 0;"><strong>Expiry Date:</strong> ${format(new Date(driver.licenseExpiry), "PPP")}</p>
              <p style="margin: 0; color: #dc2626; font-weight: bold;">Days Remaining: ${daysLeft}</p>
            </div>
            <p>Please ensure the license is renewed and the records are updated in the TransitOps system before it expires. If the license expires, the driver will not be eligible for trip dispatch.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated message from TransitOps Platform.</p>
          </div>
        `,
      };
    });

    // Send emails in parallel via Resend batch API
    const response = await resend.batch.send(emailsToSend);

    return NextResponse.json({
      message: `Sent ${emailsToSend.length} license expiry reminders.`,
      result: response,
    });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
