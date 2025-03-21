import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const contractAddress = formData.get("contractAddress") as string
    const bannerText = formData.get("bannerText") as string
    const email = formData.get("email") as string
    const telegram = formData.get("telegram") as string
    const bannerType = formData.get("bannerType") as string
    const paymentSignature = formData.get("paymentSignature") as string
    const manualPayment = formData.get("manualPayment") === "true"

    // Handle logo upload
    const logo = formData.get("logo") as File | null
    let logoPath = null

    if (logo) {
      const bytes = await logo.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // In a real app, you'd use a storage service like AWS S3 or Vercel Blob
      // For this example, we'll just log the file details
      console.log(`Received logo: ${logo.name}, size: ${logo.size} bytes`)
      logoPath = `logo-${uuidv4()}-${logo.name}`
    }

    // Handle screenshots (for premium banners)
    const screenshotPaths = []

    if (bannerType === "premium") {
      for (let i = 0; i < 3; i++) {
        const screenshot = formData.get(`screenshot_${i}`) as File | null

        if (screenshot) {
          const bytes = await screenshot.arrayBuffer()
          const buffer = Buffer.from(bytes)

          console.log(`Received screenshot ${i}: ${screenshot.name}, size: ${screenshot.size} bytes`)
          screenshotPaths.push(`screenshot-${i}-${uuidv4()}-${screenshot.name}`)
        }
      }
    }

    // In a real app, you would:
    // 1. Store the banner request in a database
    // 2. Send a confirmation email to the user
    // 3. Notify your design team to create the banner
    // 4. Update the status of the request

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'solbannerr@gmail.com',
        pass: 'your_app_password_here' // You should use environment variables for this in production
      }
    });

    // Prepare email content
    const requestId = uuidv4();
    const emailContent = {
      from: 'solbannerr@gmail.com',
      to: 'solbannerr@gmail.com',
      subject: `New Banner Request: ${bannerType} Banner`,
      html: `
        <h1>New Banner Request</h1>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Banner Type:</strong> ${bannerType}</p>
        <p><strong>Contract Address:</strong> ${contractAddress}</p>
        <p><strong>Banner Text:</strong> ${bannerText}</p>
        <p><strong>Customer Email:</strong> ${email}</p>
        <p><strong>Telegram:</strong> ${telegram || 'Not provided'}</p>
        <p><strong>Payment Method:</strong> ${manualPayment ? 'Manual Payment' : 'Automatic Payment'}</p>
        <p><strong>Payment Signature:</strong> ${paymentSignature || 'Not provided'}</p>
        <p><strong>Logo:</strong> ${logo ? logo.name : 'Not provided'}</p>
        ${bannerType === "premium" ? 
          `<p><strong>Screenshots:</strong> ${screenshotPaths.length > 0 ? screenshotPaths.join(', ') : 'None provided'}</p>` 
          : ''}
        <hr>
        <p>This is an automated notification from the SOL Banner system.</p>
      `
    };

    // Send email
    try {
      await transporter.sendMail(emailContent);
      console.log('Email notification sent to solbannerr@gmail.com');
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Continue with the response even if email fails
    }

    // For this example, we'll just return a success response
    return NextResponse.json({
      success: true,
      message: "Banner request submitted successfully",
      requestId: uuidv4(),
      details: {
        contractAddress,
        bannerType,
        paymentSignature,
        manualPayment,
        logoPath,
        screenshotPaths,
      },
    })
  } catch (error) {
    console.error("Error processing banner request:", error)
    return NextResponse.json({ error: "Failed to process banner request" }, { status: 500 })
  }
}
