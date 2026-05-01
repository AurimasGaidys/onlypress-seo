import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { credits, amount, uid, email, agencyId } = await req.json()

    console.log('Received request to create checkout session with:', { credits, amount, uid, email, agencyId })

    if (!credits || !amount || credits <= 0 || amount <= 0) {
      return NextResponse.json({ error: 'Invalid credits or amount' }, { status: 400 })
    }

    // Find or create customer using Firebase UID in metadata
    let customerId: string | undefined;

    try {
      // Search for existing customer by Firebase UID
      const existingCustomers = await stripe.customers.search({
        query: `metadata['firebaseAgencyId']:'${agencyId}'`,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id
        console.log('Found existing customer:', customerId)
      } else {
        // Create new customer
        const newCustomer = await stripe.customers.create({
          email: email,
          metadata: {
            firebaseUserId: uid,
            firebaseAgencyId: agencyId || '' // Include agencyId in metadata if available
          }
        })
        customerId = newCustomer.id
        console.log('Created new customer:', customerId)
      }
    } catch (error) {
      console.error('Error handling customer:', error)
      // Continue without customer ID - Stripe will handle it
    }

    const paymentMetadata = {
      credits: credits.toString(),
      userId: uid,
      ble: "agency_credits_purchase",
      agencyId: agencyId || 'not-set',
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${credits} Credits`,
              description: `Purchase ${credits} credits for your account`,
            },
            unit_amount: credits * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/agency/${agencyId}`,  ///buyer/credits/success?amount=${0.0121 * amount}&credit=${credits / 100},
      cancel_url: `${req.nextUrl.origin}/agency/${agencyId}`,
      metadata: paymentMetadata,
      payment_intent_data: {
        metadata: paymentMetadata
      },
      client_reference_id: uid,
      automatic_tax: { enabled: true },
      billing_address_collection: 'auto',
      customer_update: { address: 'auto', name: 'auto' },
      invoice_creation: { enabled: true },
    }

    // Use existing customer if found, otherwise let Stripe handle customer creation
    if (customerId) {
      sessionParams.customer = customerId
    } else {
      sessionParams.customer_email = email
      sessionParams.customer_creation = 'if_required'
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({
      id: session.id,
      url: session.url
    })
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
