import * as React from 'react'
import { PortalsContext } from './context'

export function usePortalsContext() {
    return React.useContext(PortalsContext)
}
