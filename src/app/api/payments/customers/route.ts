import { withAuth } from '@/lib/api/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

interface CustomerData {
  email?: string
  name?: string
  phone?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  metadata?: Record<string, string>
}

interface CustomerRequestBody extends CustomerData {
  firebaseUserId: string
  stripeCustomerId?: string
}

export const POST = withAuth(async (req: NextRequest, { userId }: { userId: string }) => {
  try {
    const body: CustomerRequestBody = await req.json()

    // Validate required fields
    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if customer already exists by searching for Firebase user ID in metadata
    const existingCustomers = await stripe.customers.search({
      query: `metadata['firebaseUserId']:'${userId}'`,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      return NextResponse.json({
        error: 'Customer already exists',
        customerId: existingCustomers.data[0].id
      }, { status: 409 })
    }

    // Create new customer
    const customerParams: Stripe.CustomerCreateParams = {
      email: body.email,
      name: body.name,
      phone: body.phone,
      address: body.address,
      metadata: {
        firebaseUserId: userId,
        ...body.metadata
      }
    }

    const customer = await stripe.customers.create(customerParams)

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        created: customer.created,
        metadata: customer.metadata
      }
    })

  } catch (error) {
    console.error('Error creating customer:', error)

    if (error instanceof Error && error.message.includes('auth')) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (req: NextRequest, { userId }: { userId: string }) => {
  try {
    const body: CustomerRequestBody = await req.json()

    let stripeCustomerId = body.stripeCustomerId

    // If no Stripe customer ID provided, find it using Firebase user ID
    if (!stripeCustomerId) {
      const existingCustomers = await stripe.customers.search({
        query: `metadata['firebaseUserId']:'${userId}'`,
        limit: 1
      })

      if (existingCustomers.data.length === 0) {
        return NextResponse.json({
          error: 'Customer not found. Create customer first.'
        }, { status: 404 })
      }

      stripeCustomerId = existingCustomers.data[0].id
    }

    // Verify the customer belongs to the authenticated user
    const existingCustomer = await stripe.customers.retrieve(stripeCustomerId)

    if (!existingCustomer || existingCustomer.deleted) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if ((existingCustomer as Stripe.Customer).metadata?.firebaseUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update customer
    const updateParams: Stripe.CustomerUpdateParams = {}

    if (body.email !== undefined) updateParams.email = body.email
    if (body.name !== undefined) updateParams.name = body.name
    if (body.phone !== undefined) updateParams.phone = body.phone
    if (body.address !== undefined) updateParams.address = body.address
    if (body.metadata !== undefined) {
      updateParams.metadata = {
        ...(existingCustomer as Stripe.Customer).metadata,
        ...body.metadata
      }
    }

    const updatedCustomer = await stripe.customers.update(stripeCustomerId, updateParams)

    return NextResponse.json({
      success: true,
      customer: {
        id: updatedCustomer.id,
        email: updatedCustomer.email,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        address: updatedCustomer.address,
        created: updatedCustomer.created,
        metadata: updatedCustomer.metadata
      }
    })

  } catch (error) {
    console.error('Error updating customer:', error)

    if (error instanceof Error && error.message.includes('auth')) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const GET = withAuth(async (req: NextRequest, { userId }: { userId: string }) => {
  try {
    // Find customer by Firebase user ID
    const existingCustomers = await stripe.customers.search({
      query: `metadata['firebaseUserId']:'${userId}'`,
      limit: 1
    })

    if (existingCustomers.data.length === 0) {
      return NextResponse.json({
        error: 'Customer not found'
      }, { status: 404 })
    }

    const customer = existingCustomers.data[0]

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        created: customer.created,
        metadata: customer.metadata
      }
    })

  } catch (error) {
    console.error('Error retrieving customer:', error)

    if (error instanceof Error && error.message.includes('auth')) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
