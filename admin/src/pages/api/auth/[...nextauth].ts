import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // For V1, we'll use simple hardcoded admin credentials
        // In production, this should connect to a proper user database
        if (
          credentials?.email === 'admin@fashop.gn' && 
          credentials?.password === 'fashop2024'
        ) {
          return {
            id: '1',
            email: 'admin@fashop.gn',
            name: 'Admin FASHOP',
            role: 'admin'
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    },
  },
})
