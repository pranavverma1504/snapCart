import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Providers
  
  providers: [
    //  Credentials Login
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password)
          throw new Error("Email and password are required");

        await connectDb();
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("User not found");

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password!
        );
        if (!isValid) throw new Error("Invalid password");

        //  Return essential data (NextAuth uses this in jwt callback)
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || "user",
        };
      },
    }),
    //  Google Login
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

  ],

  // Callbacks
  
  callbacks: {

    // 1️⃣ Ensure Google users have a role
    async signIn({ account, user }) {
      if (account?.provider === "google") {
        await connectDb();
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          // Create new user with default role
          dbUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role:user?.role || "user", // ✅ default role
          });
        }

        // Inject DB info into NextAuth's user object
        user.id = dbUser._id.toString();
        user.role = dbUser.role; // ✅ attach role manually
      }

      return true;
    },
    
    //  token k andr user k data dalna
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role; 
      }
      
      return token;
    },

    //  session k andr user k data dalte h token k use krke
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },

  
  // Settings
  
  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET!,
});
