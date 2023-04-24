import { GetServerSideProps } from "next"
import axios from "axios"
import { SessionsDTO } from "../types"

import OverviewPage from "../templates/OverviewPage"

type Props = {
    sessions: SessionsDTO[]
}

export default function Events({ sessions }: Props) {
    return <OverviewPage sessions={sessions} />
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    try {
        const url = process.env.URL_TO_FETCH

        const response = await axios.get(`${url}/api/fetchOverview`, {
            headers: {
                "x-api-key": process.env.KEY_TO_API as string // Pass cookies from the incoming request
            }
        })
        const sessions = response.data
        return {
            props: { sessions }
        }
    } catch (error) {
        res.statusCode = 404
        return {
            props: {}
        }
    }
}
