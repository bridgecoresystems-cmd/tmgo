import { createAuthClient } from "better-auth/vue"

export const authClient = createAuthClient({
    baseURL: "http://localhost:8000/api/auth"
})

export const useAuth = () => {
    const session = authClient.useSession()
    return {
        session,
        signIn: authClient.signIn,
        signUp: authClient.signUp,
        signOut: authClient.signOut
    }
}
