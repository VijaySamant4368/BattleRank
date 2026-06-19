import { supabaseAdmin } from "../src/lib/supabase/admin"

async function createAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]
  const username = process.argv[4] || "admin"

  if (!email || !password) {
    console.error("Usage: npx tsx supabase/create_admin.ts <email> <password> [username]")
    process.exit(1)
  }

  console.log(`Creating admin: ${email}...`)

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: "System Admin"
    }
  })

  if (error) {
    console.error("Error creating admin:", error.message)
    process.exit(1)
  }

  console.log("Admin user created successfully in auth.users!")
  console.log("Database trigger will auto-create the profile.")
  console.log(`Ensure ADMIN_EMAIL=${email} is set in your .env file.`)
}

createAdmin()
