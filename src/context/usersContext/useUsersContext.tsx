import * as React from 'react'
import { UsersContext } from './UsersContext'

export function useUsersContext() {
    return React.useContext(UsersContext)
}
