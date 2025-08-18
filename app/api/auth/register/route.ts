import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists and create new user in Supabase
    const supabaseUrl = "https://diubdforaeqzbtbwxdfc.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdWJkZm9yYWVxemJ0Ynd4ZGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDc4NDUsImV4cCI6MjA3MDMyMzg0NX0.W9kNfkg3HE_fjIWlCggY2qcButBKUvBCsNQ8955CY1I";

    // First check if user already exists
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${email}&select=email`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const existingUsers = await checkResponse.json();
    
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user with password hash
    const createResponse = await fetch(
      `${supabaseUrl}/rest/v1/users`,
      {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          email,
          password_hash: hashedPassword,
          source: "registration",
          consent_email: false,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error("Supabase error:", errorData);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    const userData = await createResponse.json();
    
    return NextResponse.json(
      { 
        message: "Account created successfully",
        user: { 
          id: userData[0].id, 
          email: userData[0].email 
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
