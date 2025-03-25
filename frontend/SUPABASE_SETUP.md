# Supabase Setup Instructions

## Error Troubleshooting

If you're seeing a 404 error when accessing tables like `documents`, it means the tables haven't been created in your Supabase project yet. 

Error example:
```
POST https://fhadrvevkqhhinyhtatr.supabase.co/rest/v1/documents?columns=... 404 (Not Found)
```

## How to Set Up Supabase Tables

1. Go to the [Supabase Dashboard](https://app.supabase.com/) and select your project
2. Navigate to the **SQL Editor** section
3. Choose one of the following options:

### Option 1: Set Up All Tables at Once
- Open the file `supabase_setup.sql` from this project
- Copy its contents and paste them into the SQL Editor
- Click "Run" to execute all SQL statements

### Option 2: Set Up Tables Individually (Recommended)

#### For the Documents Module:
- Open the file `setup_documents_table.sql` from this project
- Copy its contents and paste them into the SQL Editor
- Click "Run" to execute all SQL statements

#### For the Tasks Module:
- Open the file `setup_tasks_table.sql` from this project
- Copy its contents and paste them into the SQL Editor
- Click "Run" to execute all SQL statements

#### For the Marketing Campaigns Module:
- Open the file `setup_campaigns_table.sql` from this project
- Copy its contents and paste them into the SQL Editor
- Click "Run" to execute all SQL statements

**IMPORTANT**: For each script, you must select ALL the SQL code and run it as a single script, not line by line

## Troubleshooting SQL Script Execution

If you're getting errors when running the SQL script:

1. **Make sure you're running the entire script at once**:
   - Select ALL the SQL code in the editor
   - Then click the "Run" button
   - Do NOT try to run individual statements or sections

2. **Check for existing objects**:
   - If you see errors about objects already existing, you can safely ignore these
   - The script uses IF NOT EXISTS clauses to handle this

3. **Error with user_id null violation**:
   - This means you're trying to insert a document without being logged in
   - We've removed the sample document insertion to prevent this error
   - After creating the table, you can add documents through the application

## Table Structure

The application uses the following tables:

1. **tasks** - Task management
2. **documents** - Wiki/documentation storage
3. **campaigns** - Marketing calendar events
4. **document_shares** - For sharing documents between users

## Verifying Setup

After running the SQL scripts:

1. Go to the **Table Editor** in Supabase
2. You should see the newly created tables in the list
3. Return to the application and refresh the page

## Debugging

If you continue to have issues:
- Check the Dashboard page which includes a debug panel to show available tables
- Verify that your Supabase URL and anon key in the `.env` file match your Supabase project
- Ensure your Supabase project has Row Level Security (RLS) enabled
- Make sure you're logged in when trying to create documents if RLS is active