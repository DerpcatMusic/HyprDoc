# Getting Your Supabase Credentials

## 🔑 Step-by-Step Guide to Get Required Keys

### 1. Get Your Supabase Access Token (for MCP server)

1. Go to [supabase.com](https://supabase.com) and sign in to your account
2. Click on your profile/avatar in the top right corner
3. Select "Access Tokens" from the dropdown menu
4. Click "Generate new token"
5. Give it a name like "HyprDoc MCP Server"
6. Copy the token (starts with `sbp_`)
7. **IMPORTANT**: Save this securely - you won't see it again

### 2. Get Your Service Role Key (for .env file)

1. Go to your HyprDoc project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API" under Settings
4. Scroll down to the "Project API keys" section
5. Find the "service_role" key (NOT the anon/public key)
6. Copy the service_role key (it's much longer than the anon key)

### 3. What These Keys Are For

- **Access Token**: Used by the MCP server to manage your Supabase project
- **Service Role Key**: Used by your app to perform admin operations (bypasses RLS)

## 🚨 Security Note

⚠️ **NEVER share these keys publicly or commit them to version control**

- Access Token: Keep for MCP server only
- Service Role Key: Keep secure, it's like admin password for your database

## ✅ Once You Have Both Keys

Once you have both keys, I can help you:

1. Configure the MCP server with your access token
2. Update your .env file with the service role key
3. Run the database setup script
4. Test the authentication flow

## 📍 Your Current Project Info

Based on your .env file, I can see you're using:
- **Project URL**: `https://jlgqpslemxirboufbviq.supabase.co`
- **Project Ref**: `jlgqpslemxirboufbviq`

You can also find the project reference in your dashboard URL:
`https://supabase.com/dashboard/project/jlgqpslemxirboufbviq`

---

**Next Steps**: Once you have both keys, let me know and I'll configure them for you!