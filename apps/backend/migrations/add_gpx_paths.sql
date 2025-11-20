-- Migration: Add GPX path columns
-- Created: 2025-11-20

-- Add gpxPath column to DiaryEntry table
ALTER TABLE DiaryEntry ADD COLUMN gpxPath TEXT;

-- Add gpxPath column to Activity table
ALTER TABLE Activity ADD COLUMN gpxPath TEXT;
