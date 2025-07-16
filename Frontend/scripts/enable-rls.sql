-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own row"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own row"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Logs table policies
CREATE POLICY "Users can view their own logs"
  ON public.logs
  FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logs"
  ON public.logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

