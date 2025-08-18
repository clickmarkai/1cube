import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Fetch user from Supabase
          const supabaseUrl = "https://diubdforaeqzbtbwxdfc.supabase.co";
          const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdWJkZm9yYWVxemJ0Ynd4ZGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDc4NDUsImV4cCI6MjA3MDMyMzg0NX0.W9kNfkg3HE_fjIWlCggY2qcButBKUvBCsNQ8955CY1I";

          const response = await fetch(
            `${supabaseUrl}/rest/v1/users?email=eq.${credentials.email}&select=id,email,password_hash`,
            {
              headers: {
                "apikey": supabaseKey,
                "Authorization": `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
            }
          );

          const users = await response.json();
          
          if (users.length === 0) {
            return null;
          }

          const user = users[0];
          
          // Check if password_hash exists
          if (!user.password_hash) {
            console.error("No password hash found for user:", user.email);
            return null;
          }
          
          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
          
          if (!isValidPassword) {
            console.error("Password verification failed for user:", user.email);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.email.split('@')[0], // Use email prefix as name
            image: null,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };