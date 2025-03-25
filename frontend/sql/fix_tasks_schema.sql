-- SQL to check and fix column naming in tasks table

-- First, check if dueDate column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks'
    AND column_name = 'dueDate'
  ) THEN
    -- Rename dueDate to due_date to follow Postgres naming convention
    ALTER TABLE tasks RENAME COLUMN "dueDate" TO due_date;
    RAISE NOTICE 'Column dueDate renamed to due_date';
  ELSE
    RAISE NOTICE 'Column dueDate not found, no action needed';
  END IF;

  -- Check assigneeId too 
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks'
    AND column_name = 'assigneeId'
  ) THEN
    -- Rename assigneeId to assignee_id to follow Postgres naming convention
    ALTER TABLE tasks RENAME COLUMN "assigneeId" TO assignee_id;
    RAISE NOTICE 'Column assigneeId renamed to assignee_id';
  ELSE
    RAISE NOTICE 'Column assigneeId not found, no action needed';
  END IF;
END $$;