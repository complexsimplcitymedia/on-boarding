/*
  # Add Device Specifications Tracking

  ## Overview
  Adds device capability tracking to ensure users are recommended appropriate plans
  based on their hardware capabilities. We don't want to sell them a dream they can't handle.

  ## Changes to users table
  
  Add device specification columns:
  - `device_type` (text) - mobile, desktop, tablet
  - `device_os` (text) - Operating system
  - `device_cpu_cores` (integer) - Number of CPU cores
  - `device_ram_gb` (numeric) - RAM in gigabytes
  - `device_gpu_available` (boolean) - GPU availability
  - `device_storage_gb` (numeric) - Available storage
  - `device_is_flagship` (boolean) - Whether device meets flagship specs
  - `recommended_plan` (text) - System-recommended plan based on specs
  - `device_checked_at` (timestamptz) - When specs were last checked

  ## Flagship Device Criteria
  A device is considered flagship if it meets:
  - CPU: 4+ cores
  - RAM: 6+ GB
  - Storage: 64+ GB available
  - GPU: Available

  ## Plan Recommendations
  - Free Tier: Flagship devices only
  - Compute Tier: Mid-range devices (4+ cores, 4+ GB RAM)
  - Premium Tier: All devices (cloud-based)
*/

-- Add device specification columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'device_type'
  ) THEN
    ALTER TABLE users ADD COLUMN device_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'device_os'
  ) THEN
    ALTER TABLE users ADD COLUMN device_os text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'device_cpu_cores'
  ) THEN
    ALTER TABLE users ADD COLUMN device_cpu_cores integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'device_ram_gb'
  ) THEN
    ALTER TABLE users ADD COLUMN device_ram_gb numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'device_gpu_available'
  ) THEN
    ALTER TABLE users ADD COLUMN device_gpu_available boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'device_storage_gb'
  ) THEN
    ALTER TABLE users ADD COLUMN device_storage_gb numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'device_is_flagship'
  ) THEN
    ALTER TABLE users ADD COLUMN device_is_flagship boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'recommended_plan'
  ) THEN
    ALTER TABLE users ADD COLUMN recommended_plan text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'device_checked_at'
  ) THEN
    ALTER TABLE users ADD COLUMN device_checked_at timestamptz;
  END IF;
END $$;

-- Create index for device capability queries
CREATE INDEX IF NOT EXISTS idx_users_device_is_flagship ON users(device_is_flagship);
CREATE INDEX IF NOT EXISTS idx_users_recommended_plan ON users(recommended_plan);