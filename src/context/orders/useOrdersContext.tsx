import * as React from 'react'
import { OrderContext } from './orderContext'

export function useOrderContext() {
    return React.useContext(OrderContext)
}
