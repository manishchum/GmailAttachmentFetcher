-- Add Google Drive folder column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

-- Add Drive folder tracking to logs table
ALTER TABLE logs ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS drive_folder_name TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_drive_folder ON users(drive_folder_id);
CREATE INDEX IF NOT EXISTS idx_logs_drive_folder ON logs(drive_folder_id);

-- Update existing logs with default values if needed
UPDATE logs 
SET drive_folder_name = 'Legacy Upload'
WHERE drive_folder_name IS NULL AND status = 'success';
