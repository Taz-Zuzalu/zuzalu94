import { createContext, ReactNode, useState, useContext, useEffect, useMemo } from "react"
import axios from "axios"

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs"
import { SessionsDTO, UserDTO } from "../types"

import { KEY_TO_API } from "../hooks/env"

type UserAuthenticationContextData = {
    userInfo: UserDTO | undefined
    setUserInfo: (b: UserDTO) => void
    isAuth: boolean
    userRole: string
    userSessions: SessionsDTO[]
    userParticipatingSessions: SessionsDTO[]
}

type UserAuthenticationProviderProps = {
    children: ReactNode
}

export const UserAuthenticationContext = createContext({} as UserAuthenticationContextData)

export function UserAuthenticationProvider({ children }: UserAuthenticationProviderProps) {
    const [userInfo, setUserInfo] = useState<UserDTO>()
    const [userSessions, setUserSessions] = useState<SessionsDTO[]>([])
    const [userRole, setUserRole] = useState("")
    const [errorAuth, setErrorAuth] = useState(false)

    const [userParticipatingSessions, setUserParticipatingSessions] = useState<SessionsDTO[]>([])

    const isAuth = useMemo(() => Boolean(userInfo), [userInfo])

    const fetchUser = async () => {
        await axios
            .post(
                "/api/apiSupabaseSession",
                {},
                {
                    headers: {
                        "x-api-key": `${KEY_TO_API}`
                        // Pass cookies from the incoming request
                    }
                }
            )
            .then(async (responsee) => {
                if (responsee.data.user.id) {
                    const userId = `${window.location.origin}/api/fetchUser/${responsee.data.user.id!}/`
                    await axios
                        .post(
                            userId,
                            {},
                            {
                                headers: {
                                    "x-api-key": `${KEY_TO_API}`
                                    // Pass cookies from the incoming request
                                }
                            }
                        )
                        .then((res) => {
                            setUserRole(res.data.role)
                            setUserInfo(res.data)
                        })
                        .catch((error) => {
                            console.log("USER AUTH CONTEXT FAILED TO FETCH USER ID", error)
                        })
                } else {
                    setErrorAuth(true)
                    console.log("USER AUTH CONTEXT FAILED TO FETCH USER ID")
                }
            })
            .catch((err) => setUserInfo(undefined))
    }

    const fetchEvents = async () => {
        if (userInfo) {
            await axios({
                method: "post",
                url: `/api/fetchSessionsByUserId/${userInfo.id}`,
                data: {},
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": `${KEY_TO_API}`,
                    "x-api-type": "fetchSessionsByUserId"
                }
            })
                .then((res) => {
                    const sessionsParticipanting = res.data.filter((item: any) => item.participants.length > 0)
                    const sessionsFavorited = res.data.filter((item: any) => item.favoritedSessions.length > 0)
                    const sessionsFilteredByUserId: SessionsDTO[] = [...sessionsFavorited, ...sessionsParticipanting]

                    setUserParticipatingSessions(sessionsParticipanting)
                    setUserSessions(sessionsFilteredByUserId)
                })
                .catch((err) => console.log(err))
        }
    }

    useEffect(() => {
        fetchUser()
    }, [])

    useEffect(() => {
        if (errorAuth === false && userInfo !== undefined) {
            fetchEvents()
        }
    }, [userInfo])

    return (
        <UserAuthenticationContext.Provider
            value={{ userInfo, isAuth, setUserInfo, userParticipatingSessions, userRole, userSessions }}
        >
            {children}
        </UserAuthenticationContext.Provider>
    )
}

export const useUserAuthenticationContext = () => useContext(UserAuthenticationContext)
